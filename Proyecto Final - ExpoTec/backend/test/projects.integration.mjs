import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../src/config/database.mjs';
import { createAuthRepository } from '../src/repositories/auth.mjs';
import { createSpacesRepository } from '../src/repositories/spaces.mjs';
import { createProjectsRepository } from '../src/repositories/projects.mjs';
import { createApp } from '../src/create-app.mjs';
import { migrate } from '../scripts/migrations.mjs';
import { listen, testConfig } from './support.mjs';

const database = process.env.TEST_DB_NAME;
test('TiDB: equipos reales, privacidad, revisiones y dos confirmaciones para un único puesto', {
  skip: !database ? 'Configurá TEST_DB_NAME con una base exclusiva de pruebas.' : false,
}, async t => {
  assert.match(database, /^expotec_test_[a-z0-9_]+$/);
  assert.notEqual(database, process.env.DB_NAME);
  const pool = createDatabase({ ...process.env, DB_NAME: database, VERCEL: '0' });
  const users = [], projects = [], spaces = [], subjects = [];
  t.after(async () => {
    for (const id of projects) {
      for (const table of ['booth_allocations', 'project_reviews', 'project_members', 'project_teachers', 'project_subjects']) await pool.execute(`DELETE FROM ${table} WHERE project_id = ?`, [id]);
      await pool.execute('DELETE FROM projects WHERE id = ?', [id]);
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
    for (const name of subjects) await pool.execute('DELETE FROM subjects WHERE name = ? AND id NOT IN (SELECT subject_id FROM project_subjects)', [name]);
    await pool.end();
  });
  await migrate(pool);
  const authRepository = createAuthRepository(pool), spaceRepository = createSpacesRepository(pool);
  const repository = createProjectsRepository(pool);
  const api = await listen(createApp(authRepository, testConfig, console, undefined, spaceRepository, repository));
  t.after(api.close);
  async function account(firstName, extraRole) {
    const result = await api.request('/api/auth/register', { firstName, lastName: 'García', email: `project-${randomUUID()}@example.com`, password: 'Contraseña de prueba 2026' });
    assert.equal(result.status, 201);
    users.push(result.body.user.id);
    if (extraRole) await pool.execute('INSERT INTO user_roles (user_id, role_code) VALUES (?, ?)', [result.body.user.id, extraRole]);
    return result.body;
  }
  const owner = await account('Lucía'), teammate = await account('Mateo'), outsider = await account('Otro');
  const teacher = await account('Martín', 'teacher'), otherTeacher = await account('Paula', 'teacher'), admin = await account('Ana', 'admin');
  const space = await spaceRepository.create({ name: 'Espacio de prueba de proyectos', description: '' }, admin.user.id);
  spaces.push(space.id);
  const table = { id: 'M01', type: 'table', x: 50, y: 50, rotation: 0, width: 14, height: 9 };
  const savedSpace = await spaceRepository.save(space.id, { version: 1, name: space.name, description: '', furniture: [table], boothFurnitureIds: ['M01'] }, admin.user.id);
  const boothId = savedSpace.booths[0].id;
  subjects.push(`Materia ${randomUUID()}`);
  const input = { name: 'Robot 2026', description: 'Propuesta temporal para comprobar la revisión de proyectos.', course: '6° 1°', imageUrl: 'https://example.com/image.png', videoUrl: '', isSoftwareProject: false, githubUrl: '', websiteUrl: '', memberIds: [owner.user.id, teammate.user.id], teacherIds: [teacher.user.id], subjects, boothId };
  async function create(body, who) {
    const result = await api.request('/api/projects/create', body, who.accessToken);
    assert.equal(result.status, 201, JSON.stringify(result.body));
    projects.push(result.body.project.id);
    return result.body.project;
  }
  const first = await create(input, owner);
  assert.equal((await api.request(`/api/projects/public/${first.id}/query`)).status, 404);
  assert.equal((await api.request(`/api/projects/${first.id}/query`, {}, outsider.accessToken)).status, 404);
  assert.equal((await api.request(`/api/projects/${first.id}/query`, {}, teammate.accessToken)).status, 200);
  assert.equal((await api.request(`/api/projects/${first.id}/save`, { ...input, version: 1, memberIds: [...input.memberIds, outsider.user.id] }, outsider.accessToken)).status, 404);
  assert.equal((await api.request(`/api/projects/${first.id}/save`, { ...input, version: 1, memberIds: [teammate.user.id] }, teammate.accessToken)).status, 400);
  assert.equal((await api.request('/api/projects/people/find', { email: teacher.user.email, role: 'teacher' }, owner.accessToken)).body.person.email, undefined);
  assert.equal((await api.request(`/api/projects/${first.id}/review`, { version: 1, action: 'approve', note: '' }, otherTeacher.accessToken)).status, 403);
  const changes = await api.request(`/api/projects/${first.id}/review`, { version: 1, action: 'changes', note: 'Ampliar la descripción del circuito de control.' }, teacher.accessToken);
  assert.equal(changes.body.project.status, 'changes');
  assert.equal(changes.body.project.version, 2);
  const resubmitted = await api.request(`/api/projects/${first.id}/save`, { ...input, version: 2 }, teammate.accessToken);
  assert.equal(resubmitted.status, 200);
  assert.equal(resubmitted.body.project.status, 'pending');
  const second = await create({ ...input, memberIds: [outsider.user.id] }, outsider);
  const confirms = await Promise.all([
    api.request(`/api/projects/${first.id}/review`, { version: 3, action: 'approve', note: '' }, teacher.accessToken),
    api.request(`/api/projects/${second.id}/review`, { version: 1, action: 'approve', note: '' }, teacher.accessToken),
  ]);
  assert.deepEqual(confirms.map(result => result.status).sort(), [200, 409]);
  const approved = confirms.find(result => result.status === 200).body.project;
  const published = await api.request(`/api/projects/public/${approved.id}/query`);
  assert.equal(published.status, 200);
  for (const field of ['creatorId', 'feedback', 'version', 'reviews']) assert.equal(published.body.project[field], undefined);
  assert.ok(published.body.project.members.every(member => member.id === undefined && member.email === undefined));
  assert.equal((await pool.execute('SELECT COUNT(*) AS count FROM booth_allocations WHERE booth_id = ?', [boothId]))[0][0].count, 1);
  assert.equal((await spaceRepository.get(space.id)).booths[0].projectId, approved.id);
  await assert.rejects(spaceRepository.archive(space.id, 2, admin.user.id), error => error.code === 'SPACE_IN_USE');
  await assert.rejects(spaceRepository.save(space.id, { ...savedSpace, version: 2, furniture: [], boothFurnitureIds: [] }, admin.user.id), error => error.code === 'SPACE_IN_USE');
  assert.equal((await api.request(`/api/projects/${approved.id}/save`, { ...input, version: approved.version }, owner.accessToken)).status === 200, false);
  const reopened = await api.request(`/api/projects/${approved.id}/review`, { version: approved.version, action: 'reopen', note: 'Reabrir para revisar la ubicación del proyecto.' }, admin.accessToken);
  assert.equal(reopened.status, 200);
  assert.equal((await pool.execute('SELECT COUNT(*) AS count FROM booth_allocations WHERE booth_id = ?', [boothId]))[0][0].count, 0);
  const stale = await api.request(`/api/projects/${first.id}/save`, { ...input, version: 1 }, owner.accessToken);
  assert.equal(stale.status, 409);
  await pool.execute("DELETE FROM user_roles WHERE user_id = ? AND role_code = 'teacher'", [teacher.user.id]);
  assert.equal((await api.request(`/api/projects/${second.id}/review`, { version: 1, action: 'approve', note: '' }, teacher.accessToken)).status, 403);
  for (const id of projects) {
    const current = await repository.get(id, admin.user.id);
    assert.equal((await api.request(`/api/projects/${id}/cancel`, { version: current.version }, admin.accessToken)).body.project.status, 'cancelled');
  }
  await spaceRepository.archive(space.id, 2, admin.user.id);
  assert.equal((await pool.execute('SELECT COUNT(*) AS count FROM project_reviews WHERE project_id = ?', [first.id]))[0][0].count >= 3, true);
});
