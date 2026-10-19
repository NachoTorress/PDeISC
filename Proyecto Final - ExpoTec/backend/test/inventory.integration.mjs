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
test('TiDB: inventario, reservas atómicas, concurrencia y liberación con historial', { skip: !database ? 'Configurá TEST_DB_NAME.' : false }, async t => {
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

  const firstResource = await inventory.create({ name: `Cable ${randomUUID()}`, description: '', total: 2 }, admin.user.id);
  resources.push(firstResource.id);
  const secondResource = await inventory.create({ name: `Adaptador ${randomUUID()}`, description: '', total: 1 }, admin.user.id);
  resources.push(secondResource.id);
  const space = await layouts.create({ name: 'Espacio temporal de reservas', description: '' }, admin.user.id);
  spaces.push(space.id);
  const furniture = ['M01', 'M02'].map((id, index) => ({ id, type: 'table', x: 30 + index * 40, y: 50, rotation: 0, width: 14, height: 9 }));
  const savedSpace = await layouts.save(space.id, { version: 1, name: space.name, description: '', furniture, boothFurnitureIds: furniture.map(item => item.id) }, admin.user.id);
  const proposal = { name: 'Proyecto de reservas', description: 'Prueba temporal de reservas de elementos compartidos.', course: '6° 1°', imageUrl: 'https://example.com/image.png', videoUrl: '', githubUrl: '', websiteUrl: '', isSoftwareProject: false, memberIds: [owner.user.id], teacherIds: [teacher.user.id], subjects: [subject], boothId: savedSpace.booths[0].id,
    resources: [{ resourceId: firstResource.id, quantity: 2 }, { resourceId: secondResource.id, quantity: 2 }] };
  async function create(body) {
    const result = await api.request('/api/projects/create', body, owner.accessToken);
    assert.equal(result.status, 201, JSON.stringify(result.body)); projects.push(result.body.project.id); return result.body.project;
  }
  const first = await create(proposal);
  assert.equal((await inventory.get(firstResource.id, admin.user.id)).reserved, 0);
  assert.equal((await api.request(`/api/inventory/${firstResource.id}/archive`, { version: 1 }, admin.accessToken)).status, 409);
  const failed = await api.request(`/api/projects/${first.id}/review`, { version: 1, action: 'approve' }, teacher.accessToken);
  assert.equal(failed.status, 409); assert.equal(failed.body.error.code, 'RESOURCE_STOCK');
  assert.equal((await inventory.get(firstResource.id, admin.user.id)).reserved, 0);
  assert.ok((await layouts.get(space.id)).booths.every(booth => !booth.projectId));
  const corrected = { ...proposal, resources: [{ resourceId: firstResource.id, quantity: 2 }, { resourceId: secondResource.id, quantity: 1 }] };
  assert.equal((await api.request(`/api/projects/${first.id}/save`, { ...corrected, version: 1 }, owner.accessToken)).status, 200);
  const { resources: omitted, ...legacy } = corrected;
  const preserved = await api.request(`/api/projects/${first.id}/save`, { ...legacy, version: 2 }, owner.accessToken);
  assert.equal(preserved.status, 200); assert.equal(preserved.body.project.resources.length, 2);
  const second = await create({ ...corrected, boothId: savedSpace.booths[1].id });
  const confirmations = await Promise.all([
    api.request(`/api/projects/${first.id}/review`, { version: 3, action: 'approve' }, teacher.accessToken),
    api.request(`/api/projects/${second.id}/review`, { version: 1, action: 'approve' }, teacher.accessToken),
  ]);
  assert.deepEqual(confirmations.map(result => result.status).sort(), [200, 409]);
  const winner = confirmations.find(result => result.status === 200).body.project;
  assert.equal(winner.resources[0].reservedQuantity > 0, true);
  const published = await api.request(`/api/projects/public/${winner.id}/query`);
  assert.equal(published.body.project.resources, undefined);
  assert.equal((await inventory.get(firstResource.id, admin.user.id)).reserved, 2);
  assert.equal((await layouts.get(space.id)).booths.filter(booth => booth.projectId).length, 1);
  const tooLow = await api.request(`/api/inventory/${firstResource.id}/save`, { name: firstResource.name, description: '', total: 1, version: 1 }, admin.accessToken);
  assert.equal(tooLow.status, 409); assert.equal(tooLow.body.error.code, 'RESOURCE_RESERVED');
  const reopened = await api.request(`/api/projects/${winner.id}/review`, { version: winner.version, action: 'reopen', note: 'Revisar los elementos y la ubicación del proyecto.' }, admin.accessToken);
  assert.equal(reopened.status, 200); assert.equal((await inventory.get(firstResource.id, admin.user.id)).reserved, 0);
  const stockRace = await Promise.all([
    api.request(`/api/projects/${winner.id}/review`, { version: reopened.body.project.version, action: 'approve' }, teacher.accessToken),
    api.request(`/api/inventory/${firstResource.id}/save`, { name: firstResource.name, description: '', total: 1, version: 1 }, admin.accessToken),
  ]);
  assert.deepEqual(stockRace.map(result => result.status).sort(), [200, 409]);
  const remaining = await inventory.get(firstResource.id, admin.user.id);
  assert.ok(remaining.reserved <= remaining.total);
  for (const id of projects) {
    const current = await proposals.get(id, admin.user.id);
    assert.equal((await api.request(`/api/projects/${id}/cancel`, { version: current.version }, admin.accessToken)).status, 200);
  }
  assert.equal((await inventory.get(firstResource.id, admin.user.id)).reserved, 0);
  assert.equal((await api.request(`/api/inventory/${firstResource.id}/archive`, { version: remaining.version }, admin.accessToken)).status, 204);
  assert.equal((await proposals.get(first.id, admin.user.id)).resources.length, 2);
});
