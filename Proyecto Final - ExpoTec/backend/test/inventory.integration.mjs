import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../src/config/database.mjs';
import { createAuthRepository } from '../src/repositories/auth.mjs';
import { createInventoryRepository } from '../src/repositories/inventory.mjs';
import { createProjectsRepository } from '../src/repositories/projects.mjs';
import { createSpacesRepository } from '../src/repositories/spaces.mjs';
import { createApp } from '../src/create-app.mjs';
import { migrate } from '../scripts/migrations.mjs';
import { listen, testConfig } from './support.mjs';

const database = process.env.TEST_DB_NAME;
test('TiDB: inventario, permisos y cambios concurrentes con historial', { skip: !database ? 'Configurá TEST_DB_NAME.' : false }, async t => {
  assert.match(database, /^expotec_test_[a-z0-9_]+$/);
  assert.notEqual(database, process.env.DB_NAME);
  const pool = createDatabase({ ...process.env, DB_NAME: database, VERCEL: '0' });
  const users = [], resources = [], projects = [], spaces = [];
  const subject = `Materia inventario ${randomUUID()}`;
  t.after(async () => {
    for (const id of projects) {
      for (const table of ['resource_allocations', 'project_resource_requests', 'booth_allocations', 'project_reviews', 'project_members', 'project_teachers', 'project_subjects']) await pool.execute(`DELETE FROM ${table} WHERE project_id = ?`, [id]);
      await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
    }
    for (const id of spaces) {
      for (const table of ['booths', 'furniture']) await pool.execute(`DELETE FROM ${table} WHERE space_id = ?`, [id]);
      await pool.execute('DELETE FROM spaces WHERE id = ?', [id]);
    }
    for (const id of resources) {
      await pool.execute('DELETE FROM inventory_events WHERE resource_id = ?', [id]);
      await pool.execute('DELETE FROM resources WHERE id = ?', [id]);
    }
    for (const id of users) {
      await pool.execute('DELETE FROM refresh_tokens WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)', [id]);
      for (const table of ['sessions', 'user_roles']) await pool.execute(`DELETE FROM ${table} WHERE user_id = ?`, [id]);
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    }
    await pool.execute('DELETE FROM subjects WHERE name = ? AND id NOT IN (SELECT subject_id FROM project_subjects)', [subject]);
    await pool.end();
  });
  await migrate(pool);
  const auth = createAuthRepository(pool), inventory = createInventoryRepository(pool), proposals = createProjectsRepository(pool), layouts = createSpacesRepository(pool);
  const api = await listen(createApp(auth, testConfig, console, undefined, layouts, proposals, inventory));
  t.after(api.close);
  async function account(firstName, role) {
    const response = await api.request('/api/auth/register', { firstName, lastName: 'Prueba', email: `inventory-${randomUUID()}@example.com`, password: 'Inventario de prueba 2026' });
    assert.equal(response.status, 201); users.push(response.body.user.id);
    if (role) await pool.execute('INSERT INTO user_roles (user_id, role_code) VALUES (?, ?)', [response.body.user.id, role]);
    return response.body;
  }
  const owner = await account('Lucía'), teacher = await account('Martín', 'teacher'), loans = await account('Paula', 'loans'), admin = await account('Ana', 'admin');
  const input = { name: `Alargue ${randomUUID()}`, description: 'Unidades equivalentes para pruebas', total: 5 };
  assert.equal((await api.request('/api/inventory/query')).status, 401);
  assert.equal((await api.request('/api/inventory/query', {}, owner.accessToken)).status, 403);
  assert.equal((await api.request('/api/inventory/query', {}, loans.accessToken)).status, 200);
  assert.equal((await api.request('/api/inventory/create', input, loans.accessToken)).status, 403);
  const created = await api.request('/api/inventory/create', input, admin.accessToken);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const resource = created.body.resource; resources.push(resource.id);
  assert.equal(resource.available, 5); assert.equal(resource.events.length, 1);
  assert.equal((await api.request('/api/inventory/create', input, admin.accessToken)).status, 409);
  assert.ok((await api.request('/api/inventory/catalog/query', {}, owner.accessToken)).body.resources.some(item => item.id === resource.id));
  const updates = await Promise.all([6, 7].map(total => api.request(`/api/inventory/${resource.id}/save`, { ...input, total, version: 1 }, admin.accessToken)));
  assert.deepEqual(updates.map(result => result.status).sort(), [200, 409]);
  const changed = updates.find(result => result.status === 200).body.resource;
  assert.equal(changed.version, 2); assert.equal(changed.events.length, 2);
  await pool.execute("DELETE FROM user_roles WHERE user_id = ? AND role_code = 'admin'", [admin.user.id]);
  assert.equal((await api.request(`/api/inventory/${resource.id}/save`, { ...input, version: 2 }, admin.accessToken)).status, 403);
  await pool.execute("INSERT INTO user_roles (user_id, role_code) VALUES (?, 'admin')", [admin.user.id]);
  assert.equal((await api.request(`/api/inventory/${resource.id}/archive`, { version: 2 }, admin.accessToken)).status, 204);
  const archived = await inventory.get(resource.id, admin.user.id);
  assert.ok(archived.archivedAt); assert.equal(archived.events.length, 3);
  assert.equal((await api.request('/api/inventory/catalog/query', {}, teacher.accessToken)).body.resources.some(item => item.id === resource.id), false);
  assert.ok((await api.request('/api/inventory/query', { archived: true }, loans.accessToken)).body.resources.some(item => item.id === resource.id));
});
