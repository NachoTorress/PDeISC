/**
 * Prueba de integración contra una base MySQL/TiDB exclusiva (TEST_DB_NAME): tres jornadas de préstamos, devoluciones concurrentes y daños.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../src/config/database.mjs';
import { createAuthRepository } from '../src/repositories/auth.mjs';
import { createSpacesRepository } from '../src/repositories/spaces.mjs';
import { createProjectsRepository } from '../src/repositories/projects.mjs';
import { createInventoryRepository } from '../src/repositories/inventory.mjs';
import { createLoansRepository } from '../src/repositories/loans.mjs';
import { createApp } from '../src/create-app.mjs';
import { migrate } from '../scripts/migrations.mjs';
import { listen, testConfig } from './support.mjs';

const database = process.env.TEST_DB_NAME;
test('TiDB: tres jornadas, entregas y devoluciones concurrentes, saldos y daños con trazabilidad', { skip: !database ? 'Configurá TEST_DB_NAME.' : false }, async t => {
  assert.match(database, /^expotec_test_[a-z0-9_]+$/); assert.notEqual(database, process.env.DB_NAME);
  const pool = createDatabase({ ...process.env, DB_NAME: database, VERCEL: '0' });
  const users = [], projects = [], resources = [], spaces = [], subject = `Materia préstamos ${randomUUID()}`;
  t.after(async () => {
    for (const id of resources) await pool.execute('DELETE FROM inventory_condition_events WHERE event_id IN (SELECT id FROM inventory_events WHERE resource_id = ?)', [id]);
    for (const id of projects) {
      await pool.execute('DELETE FROM loan_returns WHERE loan_id IN (SELECT id FROM loans WHERE project_id = ?)', [id]);
      for (const table of ['loans', 'resource_allocations', 'project_resource_requests', 'booth_allocations', 'project_reviews', 'project_members', 'project_teachers', 'project_subjects']) await pool.execute(`DELETE FROM ${table} WHERE project_id = ?`, [id]);
      await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
    }
    for (const id of resources) {
      await pool.execute('DELETE FROM inventory_events WHERE resource_id = ?', [id]);
      await pool.execute('DELETE FROM resource_conditions WHERE resource_id = ?', [id]);
      await pool.execute('DELETE FROM resources WHERE id = ?', [id]);
    }
    for (const id of spaces) {
      for (const table of ['booths', 'furniture']) await pool.execute(`DELETE FROM ${table} WHERE space_id = ?`, [id]);
      await pool.execute('DELETE FROM spaces WHERE id = ?', [id]);
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
  const auth = createAuthRepository(pool), layouts = createSpacesRepository(pool), proposals = createProjectsRepository(pool), inventory = createInventoryRepository(pool), repository = createLoansRepository(pool);
  const api = await listen(createApp(auth, testConfig, console, undefined, layouts, proposals, inventory, repository)); t.after(api.close);
  async function account(firstName, role) {
    const response = await api.request('/api/auth/register', { firstName, lastName: 'Prueba', email: `loan-${randomUUID()}@example.com`, password: 'Préstamos de prueba 2026' });
    assert.equal(response.status, 201); users.push(response.body.user.id);
    if (role) await pool.execute('INSERT INTO user_roles (user_id, role_code) VALUES (?, ?)', [response.body.user.id, role]);
    return response.body;
  }
  const student = await account('Lucía'), teacher = await account('Martín', 'teacher'), operator = await account('Paula', 'loans'), admin = await account('Ana', 'admin');
  const resource = await inventory.create({ name: `Cable préstamo ${randomUUID()}`, description: '', total: 4 }, admin.user.id); resources.push(resource.id);
  const space = await layouts.create({ name: 'Espacio temporal de préstamos', description: '' }, admin.user.id); spaces.push(space.id);
  const furniture = ['M01', 'M02'].map((id, i) => ({ id, type: 'table', x: 30 + i * 40, y: 50, rotation: 0, width: 14, height: 9 }));
  const layout = await layouts.save(space.id, { version: 1, name: space.name, description: '', furniture, boothFurnitureIds: furniture.map(item => item.id) }, admin.user.id);
  const proposal = { name: 'Proyecto con préstamo', description: 'Proyecto temporal para verificar las entregas de las jornadas.', course: '6° 1°', imageUrl: 'https://example.com/image.png', videoUrl: '', githubUrl: '', websiteUrl: '', isSoftwareProject: false, memberIds: [student.user.id], teacherIds: [teacher.user.id], subjects: [subject], resources: [{ resourceId: resource.id, quantity: 2 }] };
  for (const booth of layout.booths) { const project = await proposals.create({ ...proposal, boothId: booth.id }, student.user.id); projects.push(project.id); }
  const delivery = { projectId: projects[0], projectVersion: 1, resourceId: resource.id, day: 1, quantity: 2, recipientId: student.user.id };
  assert.equal((await api.request('/api/loans/query')).status, 401);
  assert.equal((await api.request('/api/loans/query', {}, student.accessToken)).status, 403);
  assert.equal((await api.request('/api/loans', delivery, teacher.accessToken)).status, 403);
  assert.equal((await api.request('/api/loans', delivery, operator.accessToken)).body.error.code, 'PROJECT_NOT_APPROVED');
  for (const id of projects) await proposals.review(id, { version: 1, action: 'approve', note: '' }, teacher.user.id);
  delivery.projectVersion = 2;
  const queue = await api.request('/api/loans/projects/query', { day: 1 }, operator.accessToken);
  assert.equal(queue.status, 200); assert.ok(queue.body.projects.some(project => project.id === projects[0] && project.resources[0].deliverable === 2));
  assert.equal(queue.body.projects.find(project => project.id === projects[0]).members[0].email, undefined);
  assert.equal((await api.request('/api/loans', { ...delivery, recipientId: admin.user.id }, operator.accessToken)).status, 400);
  const simultaneous = await Promise.all([api.request('/api/loans', delivery, operator.accessToken), api.request('/api/loans', delivery, admin.accessToken)]);
  assert.deepEqual(simultaneous.map(result => result.status).sort(), [201, 409]);
  const first = simultaneous.find(result => result.status === 201).body.loan;
  assert.equal((await proposals.get(projects[0], admin.user.id)).openLoanQuantity, 2);
  for (const path of ['cancel', 'review']) {
    const result = path === 'cancel'
      ? await api.del(`/api/projects/${projects[0]}`, { version: 2 }, admin.accessToken)
      : await api.request(`/api/projects/${projects[0]}/reviews`, { version: 2, action: 'reopen', note: 'Reabrir para revisar el pedido del equipo.' }, admin.accessToken);
    assert.equal(result.status, 409); assert.equal(result.body.error.code, 'PROJECT_HAS_LOANS');
  }
  assert.equal((await api.del(`/api/inventory/${resource.id}`, { version: 1 }, admin.accessToken)).body.error.code, 'RESOURCE_HAS_LOANS');
  assert.equal((await api.request('/api/loans', { ...delivery, day: 2 }, operator.accessToken)).body.error.code, 'PROJECT_LOAN_LIMIT');
  const partial = await api.request(`/api/loans/${first.id}/returns`, { version: 1, quantity: 1 }, operator.accessToken);
  assert.equal(partial.status, 200); assert.equal(partial.body.loan.returned, 1);
  assert.equal((await api.request(`/api/loans/${first.id}/returns`, { version: 1, quantity: 1 }, operator.accessToken)).body.error.code, 'LOAN_CHANGED');
  assert.equal((await api.request(`/api/loans/${first.id}/returns`, { version: 2, quantity: 2 }, operator.accessToken)).body.error.code, 'RETURN_EXCEEDS_LOAN');
  const noted = await api.request(`/api/loans/${first.id}/returns`, { version: 2, quantity: 0, note: 'El equipo devolverá la unidad que falta al terminar.' }, operator.accessToken);
  assert.equal(noted.body.loan.returned, 1); assert.equal(noted.body.loan.version, 3);
  const secondDay = await api.request('/api/loans', { ...delivery, day: 2, quantity: 1 }, operator.accessToken);
  assert.equal(secondDay.status, 201);
  const other = await api.request('/api/loans', { ...delivery, projectId: projects[1], day: 2 }, operator.accessToken);
  assert.equal(other.status, 201);
  const damaged = await api.request(`/api/loans/${first.id}/returns`, { version: 3, quantity: 1, damagedQuantity: 1, note: 'Una unidad volvió con la ficha rota y se retira de servicio.' }, operator.accessToken);
  assert.equal(damaged.status, 200); assert.equal(damaged.body.loan.returned, 2);
  assert.equal((await api.request('/api/loans', { ...delivery, day: 1, quantity: 1 }, operator.accessToken)).body.error.code, 'ALREADY_DELIVERED');
  const stock = await inventory.get(resource.id, admin.user.id);
  assert.equal(stock.unavailable, 1); assert.equal(stock.outstanding, 3); assert.equal(stock.availableToLend, 0); assert.equal(stock.shortage, 1);
  assert.ok(stock.events.some(event => event.action === 'damage' && event.unavailable === 1));
  assert.equal((await api.request('/api/loans', { ...delivery, day: 3, quantity: 1 }, operator.accessToken)).body.error.code, 'LOAN_STOCK');
  assert.equal((await api.put(`/api/inventory/${resource.id}`, { name: resource.name, description: '', total: 4, version: 1 }, admin.accessToken)).body.error.code, 'RESOURCE_CHANGED');
  const legacy = await api.put(`/api/inventory/${resource.id}`, { name: resource.name, description: '', total: 4, version: stock.version }, admin.accessToken);
  assert.equal(legacy.body.resource.unavailable, 1);
  const fix = { name: resource.name, description: '', total: 4, unavailable: 0, version: legacy.body.resource.version };
  assert.equal((await api.put(`/api/inventory/${resource.id}`, fix, admin.accessToken)).status, 400);
  assert.equal((await api.put(`/api/inventory/${resource.id}`, { ...fix, note: 'Unidad reparada y revisada antes de volver a servicio.' }, admin.accessToken)).status, 200);
  const thirdDay = await api.request('/api/loans', { ...delivery, day: 3, quantity: 1 }, operator.accessToken); assert.equal(thirdDay.status, 201);
  const returns = await Promise.all([api.request(`/api/loans/${secondDay.body.loan.id}/returns`, { version: 1, quantity: 1 }, operator.accessToken), api.request(`/api/loans/${secondDay.body.loan.id}/returns`, { version: 1, quantity: 1 }, admin.accessToken)]);
  assert.deepEqual(returns.map(result => result.status).sort(), [200, 409]);
  for (const loan of [other.body.loan, thirdDay.body.loan]) assert.equal((await api.request(`/api/loans/${loan.id}/returns`, { version: 1, quantity: loan.quantity }, operator.accessToken)).status, 200);
  const summary = await api.request('/api/loans/query', { openOnly: true }, operator.accessToken);
  assert.equal(summary.body.loans.some(loan => projects.includes(loan.projectId)), false);
  assert.equal((await inventory.get(resource.id, admin.user.id)).reserved, 4);
  const repairLoan = await api.request('/api/loans', { ...delivery, projectId: projects[1], day: 1 }, operator.accessToken);
  assert.equal(repairLoan.status, 201);
  assert.equal((await api.request(`/api/loans/${repairLoan.body.loan.id}/returns`, { version: 1, quantity: 2, damagedQuantity: 2, note: 'Dos unidades regresaron dañadas y requieren revisión.' }, operator.accessToken)).status, 200);
  for (const unavailable of [1, 0]) {
    const current = await inventory.get(resource.id, admin.user.id);
    const repaired = await api.put(`/api/inventory/${resource.id}`, { name: resource.name, description: '', total: 4, unavailable, version: current.version, note: 'Se revisó y reparó una unidad para volver a utilizarla.' }, admin.accessToken);
    assert.equal(repaired.status, 200); assert.equal(repaired.body.resource.shortage, unavailable);
  }
  const reopened = await proposals.review(projects[0], { version: 2, action: 'reopen', note: 'Revisar el pedido después de devolver todos los elementos.' }, admin.user.id);
  await proposals.save(projects[0], { ...proposal, boothId: layout.booths[0].id, resources: [], version: reopened.version }, student.user.id);
  for (const id of projects) { const project = await proposals.get(id, admin.user.id); await proposals.cancel(id, project.version, admin.user.id); }
  const finalStock = await inventory.get(resource.id, admin.user.id); await inventory.archive(resource.id, finalStock.version, admin.user.id);
  assert.equal((await repository.get(first.id, operator.user.id)).returns.length, 3);
  await pool.execute("DELETE FROM user_roles WHERE user_id = ? AND role_code = 'loans'", [operator.user.id]);
  assert.equal((await api.request('/api/loans/query', {}, operator.accessToken)).status, 403);
});
