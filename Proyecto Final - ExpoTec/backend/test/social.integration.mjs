import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { createDatabase } from '../src/config/database.mjs';
import { createAuthRepository } from '../src/repositories/auth.mjs';
import { createSocialRepository } from '../src/repositories/social.mjs';
import { createSocialService } from '../src/services/social.mjs';
import { createAuthService } from '../src/services/auth.mjs';
import { tokenHash, rateKey } from '../src/services/crypto.mjs';
import { migrate } from '../scripts/migrations.mjs';
import { testConfig } from './support.mjs';

test('TiDB social: alta con contraseña, vinculación explícita, concurrencia, vencimiento y sesión única', {
  skip: !process.env.TEST_DB_NAME ? 'Configurá una base expotec_test_ exclusiva.' : false,
}, async t => {
  const database = process.env.TEST_DB_NAME;
  assert.match(database, /^expotec_test_[a-z0-9_]+$/);
  assert.notEqual(database, process.env.DB_NAME);
  const pool = createDatabase({ ...process.env, DB_NAME: database, VERCEL: '0' });
  const marker = `social-${randomUUID()}`, flows = [];
  t.after(async () => {
    await pool.execute('DELETE FROM auth_rate_limits WHERE bucket = ?', [rateKey(testConfig.secret, `social-link:${marker}@example.com`)]);
    await pool.execute('DELETE FROM auth_rate_limits WHERE bucket = ?', [rateKey(testConfig.secret, `social-link:${marker}-admin@example.com`)]);
    for (const id of flows) await pool.execute('DELETE FROM social_flows WHERE id = ?', [id]);
    const [users] = await pool.execute('SELECT id FROM users WHERE email LIKE ?', [`${marker}%`]);
    for (const { id } of users) {
      await pool.execute('DELETE FROM social_identities WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM refresh_tokens WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)', [id]);
      await pool.execute('DELETE FROM sessions WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    }
    await pool.end();
  });
  await migrate(pool); await migrate(pool);
  const config = { ...testConfig, social: { webOrigin: testConfig.origins[0], providers: Object.fromEntries(['google', 'discord', 'github'].map(name => [name, { clientId: 'test-id', clientSecret: 'test-secret' }])) } };
  const binding = randomBytes(32).toString('base64url');
  const authRepo = createAuthRepository(pool), repository = createSocialRepository(pool);
  const accounts = createAuthService(authRepo, config);
  const password = 'Contraseña para ExpoTec 2026';
  let identity;
  const social = createSocialService(repository, authRepo, config, async () => identity);
  async function flow(provider, subject, email) {
    identity = { subject, email };
    const proof = randomBytes(32).toString('base64url');
    const start = await social.start({ provider, challenge: tokenHash(proof) }, binding);
    flows.push(start.id);
    const state = new URL(start.url).searchParams.get('state');
    await assert.rejects(social.callback(provider, { state, code: 'test-code' }, 'x'.repeat(43)), error => error.code === 'SOCIAL_FAILED');
    const redirect = await social.callback(provider, { state, code: 'test-code' }, binding);
    assert.equal(redirect, `${config.social.webOrigin}/#social=${start.id}`);
    return { id: start.id, proof, state, provider };
  }
  const email = `${marker}@example.com`;
  const first = await flow('google', marker, email);
  const payload = ({ id, proof }) => ({ id, proof });
  assert.equal((await social.status(payload(first))).mode, 'signup');
  await assert.rejects(social.status({ id: first.id, proof: 'x'.repeat(43) }), error => error.code === 'SOCIAL_FAILED');
  await assert.rejects(social.complete({ ...payload(first), mode: 'signup', firstName: 'Lucía', lastName: 'Prueba', password: 'short' }), error => error.code === 'VALIDATION_ERROR');
  await assert.rejects(social.complete({ ...payload(first), mode: 'signup', firstName: 'Lucía', lastName: 'Prueba', password, accountType: 'admin' }), error => error.code === 'VALIDATION_ERROR');
  const created = await social.complete({ ...payload(first), mode: 'signup', firstName: 'Lucía', lastName: 'Prueba', password, accountType: 'guest' });
  assert.deepEqual(created.user.roles, ['guest']);
  assert.equal(created.user.email, email);
  assert.equal((await accounts.login({ email, password })).user.id, created.user.id);
  await assert.rejects(social.complete({ ...payload(first), mode: 'login' }), error => error.code === 'SOCIAL_FAILED');
  await assert.rejects(social.callback('google', { state: first.state, code: 'replayed' }, binding), error => error.code === 'SOCIAL_FAILED');
  const second = await flow('google', marker, `${marker}-changed@example.com`);
  assert.equal((await social.status(payload(second))).mode, 'login');
  const simultaneous = await Promise.allSettled([social.complete({ ...payload(second), mode: 'login' }), social.complete({ ...payload(second), mode: 'login' })]);
  assert.equal(simultaneous.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(simultaneous.find(result => result.status === 'fulfilled').value.user.id, created.user.id);

  const link = await flow('github', `${marker}-github`, email);
  assert.equal((await social.status(payload(link))).mode, 'link');
  await assert.rejects(social.complete({ ...payload(link), mode: 'login' }), error => error.status === 409);
  await assert.rejects(social.complete({ ...payload(link), mode: 'link', password: 'wrong' }), error => error.status === 401);
  assert.equal((await social.complete({ ...payload(link), mode: 'link', password })).user.id, created.user.id);
  const [[count]] = await pool.execute('SELECT COUNT(*) AS count FROM users WHERE email = ?', [email]);
  assert.equal(count.count, 1);
  const [[identities]] = await pool.execute('SELECT COUNT(*) AS count FROM social_identities WHERE user_id = ?', [created.user.id]);
  assert.equal(identities.count, 2);

  const adminEmail = `${marker}-admin@example.com`;
  const admin = await accounts.register({ email: adminEmail, password, firstName: 'Admin', lastName: 'Existente', accountType: 'student' });
  await pool.execute('INSERT INTO user_roles (user_id, role_code) VALUES (?, ?)', [admin.user.id, 'admin']);
  const beforeLink = await authRepo.findCredentials(adminEmail);
  const adminLink = await flow('google', `${marker}-admin`, adminEmail);
  assert.equal((await social.status(payload(adminLink))).mode, 'link');
  await assert.rejects(social.complete({ ...payload(adminLink), mode: 'signup', password }), error => error.status === 409);
  await assert.rejects(social.complete({ ...payload(adminLink), mode: 'link', password: 'Una contraseña nueva' }), error => error.status === 401);
  const linkedAdmin = await social.complete({ ...payload(adminLink), mode: 'link', password });
  assert.equal(linkedAdmin.user.id, admin.user.id);
  assert.deepEqual(linkedAdmin.user.roles, ['admin', 'student']);
  assert.equal((await authRepo.findCredentials(adminEmail)).passwordHash, beforeLink.passwordHash);
  const adminReturn = await flow('google', `${marker}-admin`, adminEmail);
  assert.equal((await social.status(payload(adminReturn))).mode, 'login');
  const returningAdmin = await social.complete({ ...payload(adminReturn), mode: 'login' });
  assert.equal(returningAdmin.user.id, admin.user.id);
  assert.deepEqual(returningAdmin.user.roles, ['admin', 'student']);

  const native = createSocialService(repository, authRepo, config, undefined, async (token, nonce) => {
    assert.equal(token, 'test-native-token'); assert.match(nonce, /^[a-f0-9]{64}$/);
    return { subject: `${marker}-admin`, email: adminEmail };
  });
  const nativeProof = randomBytes(32).toString('base64url');
  const nativeStart = await native.startNativeGoogle({ challenge: tokenHash(nativeProof) });
  flows.push(nativeStart.id);
  const nativeInput = { id: nativeStart.id, proof: nativeProof };
  await assert.rejects(native.verifyNativeGoogle({ ...nativeInput, proof: 'x'.repeat(43), idToken: 'test-native-token' }), error => error.code === 'SOCIAL_FAILED');
  await native.verifyNativeGoogle({ ...nativeInput, idToken: 'test-native-token' });
  await assert.rejects(native.verifyNativeGoogle({ ...nativeInput, idToken: 'test-native-token' }), error => error.code === 'SOCIAL_FAILED');
  assert.equal((await native.status(nativeInput)).mode, 'login');
  const nativeSession = await native.complete({ ...nativeInput, mode: 'login' });
  assert.equal(nativeSession.user.id, admin.user.id);
  assert.deepEqual(nativeSession.user.roles, ['admin', 'student']);
  assert.equal((await authRepo.findCredentials(adminEmail)).passwordHash, beforeLink.passwordHash);
  await assert.rejects(native.complete({ ...nativeInput, mode: 'login' }), error => error.code === 'SOCIAL_FAILED');

  const collision = await flow('google', `${marker}-different`, email);
  await assert.rejects(social.complete({ ...payload(collision), mode: 'link', password }), error => error.code === 'SOCIAL_CONFLICT');
  assert.equal((await social.status(payload(collision))).mode, 'link');
  const inactive = await flow('google', marker, email);
  await pool.execute('UPDATE users SET active = FALSE WHERE id = ?', [created.user.id]);
  await assert.rejects(social.complete({ ...payload(inactive), mode: 'login' }), error => error.status === 401);
  await pool.execute('UPDATE users SET active = TRUE WHERE id = ?', [created.user.id]);
  const expired = await flow('discord', `${marker}-discord`, email);
  await pool.execute('UPDATE social_flows SET expires_at = ? WHERE id = ?', [new Date(0), expired.id]);
  await assert.rejects(social.status(payload(expired)), error => error.code === 'SOCIAL_FAILED');

  const canceledProof = randomBytes(32).toString('base64url');
  const canceled = await social.start({ provider: 'discord', challenge: tokenHash(canceledProof) }, binding);
  flows.push(canceled.id);
  const state = new URL(canceled.url).searchParams.get('state');
  await assert.rejects(social.callback('github', { state, code: 'mixup' }, binding), error => error.code === 'SOCIAL_FAILED');
  await social.callback('discord', { state, error: 'access_denied' }, binding);
  await assert.rejects(social.status({ id: canceled.id, proof: canceledProof }), error => error.code === 'SOCIAL_FAILED');
  const [[stored]] = await pool.execute('SELECT verifier, subject, email, status FROM social_flows WHERE id = ?', [canceled.id]);
  assert.deepEqual(stored, { verifier: null, subject: null, email: null, status: 'failed' });
});
