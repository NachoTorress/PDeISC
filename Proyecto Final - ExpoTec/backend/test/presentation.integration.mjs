/**
 * Prueba de integración contra una base MySQL/TiDB exclusiva (TEST_DB_NAME): presentación TV con proyectos confirmados.
 */
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
test('TiDB: secuencia pública paginada, privacidad y retiro al reabrir o cancelar', { skip: !database ? 'Configurá TEST_DB_NAME.' : false }, async t => {
  assert.match(database, /^expotec_test_[a-z0-9_]+$/); assert.notEqual(database, process.env.DB_NAME);
  const pool = createDatabase({ ...process.env, DB_NAME: database, VERCEL: '0' });
  const users = [], projects = [], spaces = [], subject = `Presentación ${randomUUID()}`;
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
    await pool.execute('DELETE FROM subjects WHERE name = ? AND id NOT IN (SELECT subject_id FROM project_subjects)', [subject]);
    await pool.end();
  });
  await migrate(pool);
  const auth = createAuthRepository(pool), spacesRepository = createSpacesRepository(pool), repository = createProjectsRepository(pool);
  const api = await listen(createApp(auth, testConfig, console, undefined, spacesRepository, repository)); t.after(api.close);
  async function account(firstName, role) {
    const response = await api.request('/api/auth/register', { firstName, lastName: 'Prueba', email: `tv-${randomUUID()}@example.com`, password: 'Presentación de prueba 2026' });
    assert.equal(response.status, 201); users.push(response.body.user.id);
    if (role) await pool.execute('INSERT INTO user_roles (user_id, role_code) VALUES (?, ?)', [response.body.user.id, role]);
    return response.body;
  }
  const student = await account('Lucía'), teacher = await account('Martín', 'teacher'), admin = await account('Ana', 'admin');
  const space = await spacesRepository.create({ name: 'Aula temporal de presentación', description: '' }, admin.user.id); spaces.push(space.id);
  const furniture = [1, 2, 3, 4].map((i) => ({ id: `M0${i}`, type: 'table', x: i * 20, y: 50, rotation: 0, width: 14, height: 9 }));
  const layout = await spacesRepository.save(space.id, { version: 1, name: space.name, description: '', furniture, boothFurnitureIds: furniture.map(item => item.id) }, admin.user.id);
  for (const [index, booth] of layout.booths.entries()) {
    const project = await repository.create({ name: `Proyecto TV ${index}`, description: 'Proyecto temporal para comprobar la presentación pública compartida.', course: '6° 1°', imageUrl: 'https://example.com/image.png', videoUrl: index ? '' : 'https://example.com/video.mp4', githubUrl: '', websiteUrl: '', isSoftwareProject: false, memberIds: [student.user.id], teacherIds: [teacher.user.id], subjects: [subject], boothId: booth.id }, student.user.id);
    projects.push(project.id);
    if (index < 2) await repository.review(project.id, { version: 1, action: 'approve', note: 'Nota privada de revisión para el equipo.' }, teacher.user.id);
    if (index === 3) await repository.cancel(project.id, 1, student.user.id);
  }
  let after; const feed = [];
  do {
    const result = await api.request('/api/projects/presentation/query', { limit: 1, ...(after ? { after } : {}) });
    assert.equal(result.status, 200); assert.ok(result.body.projects.length <= 1);
    if (after && result.body.projects.length) assert.ok(result.body.projects[0].id > after);
    feed.push(...result.body.projects); after = result.body.nextCursor;
  } while (after);
  assert.deepEqual(feed.filter(item => projects.includes(item.id)).map(item => item.id).sort(), projects.slice(0, 2).sort());
  const published = feed.find(item => item.id === projects[0]);
  assert.equal(published.videoUrl, 'https://example.com/video.mp4');
  assert.deepEqual(published.members, [{ firstName: 'Lucía', lastName: 'Prueba' }]);
  assert.deepEqual(published.teachers, [{ firstName: 'Martín', lastName: 'Prueba' }]);
  assert.deepEqual(published.subjects, [subject]); assert.equal(published.spaceName, space.name);
  assert.deepEqual(Object.keys(published).sort(), ['id', 'name', 'description', 'course', 'imageUrl', 'videoUrl', 'furnitureId', 'spaceName', 'members', 'teachers', 'subjects'].sort());
  assert.ok(!JSON.stringify(published).includes(student.user.email)); assert.ok(!JSON.stringify(published).includes(student.user.id));
  assert.equal((await api.request('/api/projects/presentation/query', { status: 'pending' })).status, 400);
  await repository.review(projects[0], { version: 2, action: 'reopen', note: 'Reabrir proyecto y retirar de la muestra pública.' }, admin.user.id);
  await repository.cancel(projects[1], 2, admin.user.id);
  const refreshed = await api.request('/api/projects/presentation/query');
  assert.ok(refreshed.body.projects.every(item => !projects.includes(item.id)));
});
