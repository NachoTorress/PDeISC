import test from 'node:test';
import assert from 'node:assert/strict';
import { transaction, createDatabase } from '../src/config/database.mjs';
import { readDatabaseConfig, readConfig } from '../src/config/env.mjs';
import { createAuthRepository } from '../src/repositories/auth.mjs';

function scriptedPool(responses = []) {
  const events = [];
  const db = {
    async beginTransaction() { events.push('begin'); },
    async commit() { events.push('commit'); },
    async rollback() { events.push('rollback'); },
    release() { events.push('release'); },
    async execute(sql) { events.push(sql); return [responses.shift() ?? []]; },
  };
  return { events, async getConnection() { return db; } };
}

test('transacciones liberan la conexión en éxito, error y rollback fallido', async () => {
  const good = scriptedPool();
  assert.equal(await transaction(good, async () => 42), 42);
  assert.deepEqual(good.events, ['begin', 'commit', 'release']);
  const failed = scriptedPool();
  await assert.rejects(transaction(failed, async () => { throw new Error('fail'); }), /fail/);
  assert.deepEqual(failed.events, ['begin', 'rollback', 'release']);
  let released = false;
  const original = new Error('original');
  const broken = { async getConnection() { return { async beginTransaction() {}, async rollback() { throw new Error('closed'); }, release() { released = true; } }; } };
  await assert.rejects(transaction(broken, async () => { throw original; }), error => error === original);
  assert.ok(released);
});

test('reutilizar renovación confirma la revocación antes de responder 401', async () => {
  const pool = scriptedPool([[{ id: 'session', userId: 'student', expiresAt: new Date(Date.now() + 60000), revokedAt: null, usedAt: new Date() }]]);
  await assert.rejects(createAuthRepository(pool).rotate('old', 'next'), error => error.status === 401);
  assert.ok(pool.events.some(event => event.startsWith('UPDATE sessions SET revoked_at')));
  assert.deepEqual(pool.events.slice(-2), ['commit', 'release']);
});

test('no permite quitar al último administrador ni escribir si el actor perdió su permiso', async () => {
  const last = scriptedPool([[{ code: 'admin' }], [{ user_id: 'admin' }], [{ id: 'admin' }], [{ user_id: 'admin' }]]);
  await assert.rejects(createAuthRepository(last).setRoles('admin', ['student'], 'admin'), error => error.code === 'LAST_ADMIN');
  assert.ok(!last.events.some(event => event.startsWith('DELETE')));
  assert.deepEqual(last.events.slice(-2), ['rollback', 'release']);
  const changed = scriptedPool([[{ code: 'admin' }], []]);
  await assert.rejects(createAuthRepository(changed).setRoles('other', ['admin'], 'former-admin'), error => error.status === 403);
  assert.ok(!changed.events.some(event => event.startsWith('DELETE')));
});

test('configuración exige secretos, CORS exacto y TLS en producción', () => {
  assert.throws(() => readConfig({ JWT_SECRET: 'short' }), /JWT_SECRET/);
  assert.throws(() => readConfig({ JWT_SECRET: 'x'.repeat(40), CORS_ORIGINS: '*' }));
  assert.throws(() => readConfig({ JWT_SECRET: 'x'.repeat(40), CORS_ORIGINS: 'http://example.com', NODE_ENV: 'production' }));
  const env = { DB_HOST: 'example.tidbcloud.com', DB_USER: 'prefix.user', DB_NAME: 'expotec' };
  assert.equal(readDatabaseConfig(env).ssl.rejectUnauthorized, true);
  assert.equal(readDatabaseConfig(env).multipleStatements, false);
  assert.throws(() => readDatabaseConfig({ ...env, DB_SSL: 'false', NODE_ENV: 'production' }), /TLS/);
  assert.throws(() => readDatabaseConfig({ ...env, DB_POOL_LIMIT: '0' }), /DB_POOL_LIMIT/);
});

test('Vercel admite el pool y registra el cierre de conexiones ociosas sin conectarse', async () => {
  const pool = createDatabase({ VERCEL: '1', DB_HOST: 'example.tidbcloud.com', DB_USER: 'prefix.user', DB_NAME: 'expotec' });
  assert.ok(pool.pool.listenerCount('release') > 0);
  assert.ok(pool.pool.listenerCount('connection') > 0);
  await pool.end();
});

test('listado agrupa varios permisos, conserva cuentas sin permisos y no expone hashes', async () => {
  const calls = [];
  const pool = {
    async query(sql, args) {
      calls.push({ sql, args });
      return [[{ id: 'one', active: 1, email: 'one@example.com' }, { id: 'two', active: 0, email: 'two@example.com' }]];
    },
    async execute(sql, args) {
      calls.push({ sql, args });
      return [[{ userId: 'one', code: 'admin' }, { userId: 'one', code: 'teacher' }]];
    },
  };
  const users = await createAuthRepository(pool).listUsers({ limit: 25, offset: 0 });
  assert.deepEqual(users.map(user => user.roles), [['admin', 'teacher'], []]);
  assert.deepEqual(users.map(user => user.active), [true, false]);
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1].args, ['one', 'two']);
  assert.ok(!calls[0].sql.includes('password_hash'));
  assert.deepEqual(await createAuthRepository({ async query() { return [[]]; } }).listUsers({ limit: 25, offset: 0 }), []);
});
