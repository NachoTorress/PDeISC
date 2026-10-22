import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { createDatabase } from '../src/config/database.mjs';
import { createAuthRepository } from '../src/repositories/auth.mjs';
import { createRecoveryRepository } from '../src/repositories/recovery.mjs';
import { createAuthService } from '../src/services/auth.mjs';
import { hashPassword, tokenHash } from '../src/services/crypto.mjs';
import { migrate } from '../scripts/migrations.mjs';
import { testConfig } from './support.mjs';

test('TiDB recuperación: tokens de uso único, caducidad, concurrencia y revocación de todas las sesiones', { skip: !process.env.TEST_DB_NAME ? 'Configurá una base exclusiva de pruebas.' : false }, async t => {
  const database = process.env.TEST_DB_NAME;
  assert.match(database, /^expotec_test_[a-z0-9_]+$/); assert.notEqual(database, process.env.DB_NAME);
  const pool = createDatabase({ ...process.env, DB_NAME: database, VERCEL: '0' });
  const ids = [];
  t.after(async () => {
    for (const id of ids) {
      await pool.execute('DELETE FROM password_resets WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM refresh_tokens WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)', [id]);
      await pool.execute('DELETE FROM sessions WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    }
    await pool.end();
  });
  await migrate(pool); await migrate(pool);
  const repository = createRecoveryRepository(pool), accounts = createAuthService(createAuthRepository(pool), testConfig);
  const email = `recovery-${randomUUID()}@example.com`, password = 'Contraseña anterior ExpoTec 2026';
  const one = await accounts.register({ email, password, firstName: 'Lucía', lastName: 'Prueba', accountType: 'guest' }); ids.push(one.user.id);
  const two = await accounts.login({ email, password });
  const token = randomBytes(32).toString('base64url'), old = randomBytes(32).toString('base64url');
  assert.equal(await repository.issue('unknown@example.com', tokenHash(old), new Date(Date.now() + 60000)), false);
  await repository.issue(email, tokenHash(old), new Date(Date.now() + 60000));
  await repository.issue(email, tokenHash(token), new Date(Date.now() + 60000));
  const nextPassword = 'Contraseña nueva ExpoTec 2026', encoded = await hashPassword(nextPassword);
  await assert.rejects(repository.consume(tokenHash(old), encoded), error => error.code === 'RESET_INVALID');
  const concurrent = await Promise.allSettled([repository.consume(tokenHash(token), encoded), repository.consume(tokenHash(token), encoded)]);
  assert.equal(concurrent.filter(item => item.status === 'fulfilled').length, 1);
  assert.equal(concurrent.find(item => item.status === 'rejected').reason.code, 'RESET_INVALID');
  await assert.rejects(accounts.authenticate(one.accessToken)); await assert.rejects(accounts.authenticate(two.accessToken));
  await assert.rejects(accounts.refresh(one.refreshToken)); await assert.rejects(accounts.refresh(two.refreshToken));
  await assert.rejects(accounts.login({ email, password }));
  assert.equal((await accounts.login({ email, password: nextPassword })).user.id, one.user.id);
  const expired = randomBytes(32).toString('base64url');
  await repository.issue(email, tokenHash(expired), new Date(Date.now() - 1000));
  await assert.rejects(repository.consume(tokenHash(expired), encoded), error => error.code === 'RESET_INVALID');
  const inactive = randomBytes(32).toString('base64url');
  await repository.issue(email, tokenHash(inactive), new Date(Date.now() + 60000));
  await pool.execute('UPDATE users SET active = FALSE WHERE id = ?', [one.user.id]);
  await assert.rejects(repository.consume(tokenHash(inactive), encoded), error => error.code === 'RESET_INVALID');
});
