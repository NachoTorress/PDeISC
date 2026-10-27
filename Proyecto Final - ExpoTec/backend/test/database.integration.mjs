/**
 * Prueba de integración contra una base MySQL/TiDB exclusiva (TEST_DB_NAME): migraciones, registro, rotación concurrente y límite persistente. Requiere base vacía.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../src/config/database.mjs';
import { createAuthRepository } from '../src/repositories/auth.mjs';
import { createApp } from '../src/create-app.mjs';
import { migrate } from '../scripts/migrations.mjs';
import { listen, testConfig } from './support.mjs';

const database = process.env.TEST_DB_NAME;
test('SQL real: migraciones, registro, permisos, rotación concurrente y límite persistente', {
  skip: !database ? 'Configurá TEST_DB_NAME con una base exclusiva de pruebas.' : false,
}, async t => {
  assert.match(database, /^expotec_test_[a-z0-9_]+$/);
  assert.notEqual(database, process.env.DB_NAME, 'La base de prueba debe ser distinta de DB_NAME.');
  const pool = createDatabase({ ...process.env, DB_NAME: database, VERCEL: '0' });
  t.after(() => pool.end());
  const [tables] = await pool.execute('SELECT table_name FROM information_schema.tables WHERE table_schema = ?', [database]);
  assert.equal(tables.length, 0, 'Usá una base vacía. Esta prueba no borra tablas ni datos previos.');
  const [timezone] = await pool.execute('SELECT @@session.time_zone AS zone');
  assert.equal(timezone[0].zone, '+00:00');
  await migrate(pool);
  await migrate(pool);
  const repository = createAuthRepository(pool);
  const api = await listen(createApp(repository, testConfig));
  t.after(api.close);
  const account = { firstName: 'María', lastName: 'García', email: `test-${randomUUID()}@example.com`, password: 'Contraseña de prueba 2026' };
  const registration = await api.request('/api/auth/register', account);
  assert.equal(registration.status, 201, JSON.stringify(registration.body));
  const auth = registration.body;
  assert.deepEqual(auth.user.roles, ['student']);
  assert.equal((await api.request('/api/auth/register', account)).status, 409);
  const [counts] = await pool.execute('SELECT COUNT(*) AS count FROM users');
  assert.equal(counts[0].count, 1, 'El duplicado no deja cuentas parciales.');
  assert.equal((await api.get('/api/admin/users', {}, auth.accessToken)).status, 403);
  await pool.execute("INSERT INTO user_roles (user_id, role_code) VALUES (?, 'admin')", [auth.user.id]);
  const listed = await api.get('/api/admin/users', {}, auth.accessToken);
  assert.equal(listed.status, 200);
  assert.deepEqual(listed.body.users[0].roles, ['admin', 'student']);
  assert.equal(listed.body.users[0].passwordHash, undefined);
  assert.equal(listed.body.users[0].active, true);
  const lastAdmin = await api.put(`/api/admin/users/${auth.user.id}/roles`, { roles: ['student'], expectedRoles: ['admin', 'student'] }, auth.accessToken);
  assert.equal(lastAdmin.status, 409);
  assert.equal(lastAdmin.body.error.code, 'LAST_ADMIN');

  const concurrent = await Promise.all([
    api.request('/api/auth/refresh', { refreshToken: auth.refreshToken }),
    api.request('/api/auth/refresh', { refreshToken: auth.refreshToken }),
  ]);
  assert.deepEqual(concurrent.map(result => result.status).sort(), [200, 401]);
  const rotated = concurrent.find(result => result.status === 200).body;
  assert.equal((await api.get('/api/auth/session', {}, rotated.accessToken)).status, 401);
  assert.equal((await api.request('/api/auth/refresh', { refreshToken: rotated.refreshToken })).status, 401);
  const login = await api.request('/api/auth/login', { email: account.email, password: account.password });
  assert.equal(login.status, 200);
  assert.equal((await api.request('/api/auth/logout', { refreshToken: login.body.refreshToken })).status, 204);
  assert.equal((await api.get('/api/auth/session', {}, login.body.accessToken)).status, 401);

  const bucket = 'a'.repeat(64);
  const limits = await Promise.all(Array.from({ length: 8 }, () => repository.consumeRate(bucket, 3, 900)));
  assert.equal(limits.filter(value => value === 0).length, 3);
  assert.equal(limits.filter(value => value > 0).length, 5);
  await pool.execute('UPDATE users SET active = FALSE WHERE id = ?', [auth.user.id]);
  assert.equal((await api.request('/api/auth/login', { email: account.email, password: account.password })).status, 401);
});
