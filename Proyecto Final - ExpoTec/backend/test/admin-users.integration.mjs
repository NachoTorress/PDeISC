/**
 * Prueba de integración contra una base MySQL/TiDB exclusiva (TEST_DB_NAME): permisos concurrentes y protección del último administrador.
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
test('TiDB: búsqueda privada, cambio de permisos y rechazo de dos ediciones simultáneas', {
  skip: !database ? 'Configurá TEST_DB_NAME con una base exclusiva de pruebas.' : false,
}, async t => {
  assert.match(database, /^expotec_test_[a-z0-9_]+$/);
  assert.notEqual(database, process.env.DB_NAME);
  const pool = createDatabase({ ...process.env, DB_NAME: database, VERCEL: '0' });
  const ids = [];
  t.after(async () => {
    for (const id of ids) {
      await pool.execute('DELETE FROM refresh_tokens WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)', [id]);
      await pool.execute('DELETE FROM sessions WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    }
    await pool.end();
  });
  await migrate(pool);
  const api = await listen(createApp(createAuthRepository(pool), testConfig));
  t.after(api.close);
  const suffix = randomUUID();
  async function register(prefix) {
    const result = await api.request('/api/auth/register', { firstName: 'Ana', lastName: 'García', email: `${prefix}-${suffix}@example.com`, password: 'Contraseña de prueba 2026' });
    assert.equal(result.status, 201, JSON.stringify(result.body));
    ids.push(result.body.user.id);
    return result.body;
  }
  const admin = await register('admin'), student = await register('student');
  await pool.execute("INSERT INTO user_roles (user_id, role_code) VALUES (?, 'admin')", [admin.user.id]);
  assert.equal((await api.request('/api/admin/users/query')).status, 401);
  assert.equal((await api.request('/api/admin/users/query', {}, student.accessToken)).status, 403);
  const listed = await api.request('/api/admin/users/query', { search: suffix, limit: 1, offset: 0 }, admin.accessToken);
  assert.equal(listed.status, 200);
  assert.equal(listed.body.users.length, 1);
  assert.equal(listed.body.users[0].passwordHash, undefined);
  assert.equal(listed.body.users[0].password_hash, undefined);
  const second = await api.request('/api/admin/users/query', { search: suffix, limit: 1, offset: 1 }, admin.accessToken);
  assert.equal(second.body.users.length, 1);
  assert.notEqual(second.body.users[0].id, listed.body.users[0].id);
  const noWildcard = await api.request('/api/admin/users/query', { search: `%${suffix}` }, admin.accessToken);
  assert.deepEqual(noWildcard.body.users, []);
  const path = `/api/admin/users/${student.user.id}`;
  const roles = ['student', 'teacher', 'loans'];
  const saved = await api.put(`${path}/roles`, { roles, expectedRoles: ['student'] }, admin.accessToken);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.deepEqual([...saved.body.user.roles].sort(), [...roles].sort());
  assert.deepEqual((await api.request('/api/auth/session', {}, student.accessToken)).body.user.roles, saved.body.user.roles);
  const concurrent = await Promise.all([
    api.put(`${path}/roles`, { roles: ['student', 'teacher'], expectedRoles: roles }, admin.accessToken),
    api.put(`${path}/roles`, { roles: ['student', 'loans'], expectedRoles: roles }, admin.accessToken),
  ]);
  assert.deepEqual(concurrent.map(value => value.status).sort(), [200, 409]);
  const current = (await api.request(`${path}/query`, {}, admin.accessToken)).body.user;
  assert.equal(current.active, true);
  const stale = await api.put(`${path}/roles`, { roles: ['admin'], expectedRoles: roles }, admin.accessToken);
  assert.equal(stale.status, 409);
  assert.equal(stale.body.error.code, 'ROLES_CHANGED');
  assert.deepEqual((await api.request(`${path}/query`, {}, admin.accessToken)).body.user, current);
  assert.equal((await api.request(`/api/admin/users/${randomUUID()}/query`, {}, admin.accessToken)).status, 404);
});
