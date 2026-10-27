/**
 * Prueba de integración contra una base MySQL/TiDB exclusiva (TEST_DB_NAME): espacios y puestos en uso.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../src/config/database.mjs';
import { createAuthRepository } from '../src/repositories/auth.mjs';
import { createSpacesRepository } from '../src/repositories/spaces.mjs';
import { createApp } from '../src/create-app.mjs';
import { migrate } from '../scripts/migrations.mjs';
import { listen, testConfig } from './support.mjs';

const database = process.env.TEST_DB_NAME;
test('TiDB real: espacios, planos atómicos, conflictos y bajas sin borrar historial', {
  skip: !database ? 'Configurá TEST_DB_NAME con una base exclusiva de pruebas.' : false,
}, async t => {
  assert.match(database, /^expotec_test_[a-z0-9_]+$/);
  assert.notEqual(database, process.env.DB_NAME);
  const pool = createDatabase({ ...process.env, DB_NAME: database, VERCEL: '0' });
  const ids = [], users = [];
  t.after(async () => {
    for (const id of ids) {
      await pool.execute('DELETE FROM booths WHERE space_id = ?', [id]);
      await pool.execute('DELETE FROM furniture WHERE space_id = ?', [id]);
      await pool.execute('DELETE FROM spaces WHERE id = ?', [id]);
    }
    for (const id of users) {
      await pool.execute('DELETE FROM refresh_tokens WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)', [id]);
      await pool.execute('DELETE FROM sessions WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    }
    await pool.end();
  });
  await migrate(pool);
  await migrate(pool);
  const repository = createSpacesRepository(pool);
  const api = await listen(createApp(createAuthRepository(pool), testConfig, console, undefined, repository));
  t.after(api.close);
  const account = await api.request('/api/auth/register', { firstName: 'María', lastName: 'García', email: `spaces-${randomUUID()}@example.com`, password: 'Contraseña de prueba 2026' });
  assert.equal(account.status, 201);
  const { user, accessToken } = account.body;
  users.push(user.id);
  await pool.execute("INSERT INTO user_roles (user_id, role_code) VALUES (?, 'admin')", [user.id]);
  const created = await api.request('/api/spaces', { name: 'Espacio temporal de integración', description: 'Solo prueba' }, accessToken);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const id = created.body.space.id;
  ids.push(id);
  const table = { id: 'M01', type: 'table', x: 50, y: 50, rotation: 90, width: 14, height: 9 };
  const bench = { id: 'B01', type: 'bench', x: 20, y: 30, rotation: 37 };
  const input = { name: 'Plano compartido', description: 'Prueba', version: 1, furniture: [table, bench], boothFurnitureIds: ['M01'] };
  const saved = await api.put(`/api/spaces/${id}`, input, accessToken);
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.body.space.version, 2);
  assert.deepEqual(saved.body.space.furniture, [table, bench]);
  const boothId = saved.body.space.booths[0].id;
  const concurrent = await Promise.all([
    api.put(`/api/spaces/${id}`, { ...input, version: 2, name: 'Edición A' }, accessToken),
    api.put(`/api/spaces/${id}`, { ...input, version: 2, name: 'Edición B' }, accessToken),
  ]);
  assert.deepEqual(concurrent.map(result => result.status).sort(), [200, 409]);
  let current = (await api.get(`/api/spaces/${id}`)).body.space;
  assert.equal(current.version, 3);
  assert.equal(current.booths[0].id, boothId);
  assert.equal((await api.put(`/api/spaces/${id}`, { ...input, version: 3, boothFurnitureIds: ['B01'] }, accessToken)).status, 400);
  assert.deepEqual((await api.get(`/api/spaces/${id}`)).body.space, current);
  await assert.rejects(pool.execute('INSERT INTO booths (id, space_id, furniture_code) VALUES (?, ?, ?)', [randomUUID(), id, 'missing']), error => error.code === 'ER_NO_REFERENCED_ROW_2');
  const removed = await api.put(`/api/spaces/${id}`, { ...input, version: 3, furniture: [bench], boothFurnitureIds: [] }, accessToken);
  assert.equal(removed.status, 200);
  assert.equal((await api.put(`/api/spaces/${id}`, { ...input, version: 4 }, accessToken)).status, 409);
  assert.equal((await pool.execute('SELECT active FROM furniture WHERE space_id = ? AND code = ?', [id, 'M01']))[0][0].active, 0);
  await pool.execute("DELETE FROM user_roles WHERE user_id = ? AND role_code = 'admin'", [user.id]);
  await assert.rejects(repository.save(id, { ...input, version: 4, furniture: [bench], boothFurnitureIds: [] }, user.id), error => error.status === 403);
  await pool.execute("INSERT INTO user_roles (user_id, role_code) VALUES (?, 'admin')", [user.id]);
  assert.equal((await api.del(`/api/spaces/${id}`, { version: 3 }, accessToken)).status, 409);
  assert.equal((await api.del(`/api/spaces/${id}`, { version: 4 }, accessToken)).status, 204);
  assert.equal((await api.get(`/api/spaces/${id}`)).status, 404);
  assert.ok(!(await api.get('/api/spaces')).body.spaces.some(space => space.id === id));
  assert.equal((await pool.execute('SELECT COUNT(*) AS count FROM spaces WHERE id = ?', [id]))[0][0].count, 1);
  assert.equal((await pool.execute('SELECT COUNT(*) AS count FROM booths WHERE space_id = ?', [id]))[0][0].count, 1);
});
