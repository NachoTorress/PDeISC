import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/create-app.mjs';
import { rolesChange, usersQuery } from '../src/validators/auth.mjs';
import { memoryRepository, listen, testConfig } from './support.mjs';

test('usuarios: búsqueda limitada y cambios con permisos esperados obligatorios', () => {
  assert.deepEqual(usersQuery({ search: '  María  ' }), { limit: 25, offset: 0, search: 'María' });
  for (const body of [{ search: 10 }, { search: 'x'.repeat(101) }, { limit: 101 }, { offset: -1 }, { roles: ['admin'] }])
    assert.throws(() => usersQuery(body), error => error.status === 400);
  assert.deepEqual(rolesChange({ roles: ['teacher'], expectedRoles: [] }), { roles: ['teacher'], expectedRoles: [] });
  for (const body of [
    { roles: ['teacher'] }, { roles: [], expectedRoles: ['student'] },
    { roles: ['admin'], expectedRoles: ['invalid'] }, { roles: ['admin'], expectedRoles: ['student', 'student'] },
    { roles: ['admin', 'admin'], expectedRoles: [] }, { roles: ['admin'], expectedRoles: [], active: true },
  ]) assert.throws(() => rolesChange(body), error => error.status === 400);
});

test('usuarios: solo administración consulta y guarda, con identidad y comparación del servidor', async t => {
  const repository = memoryRepository();
  const target = randomUUID();
  const managed = { id: target, firstName: 'Ana', lastName: 'García', email: 'ana@example.com', active: true, roles: ['student'], createdAt: new Date().toISOString() };
  const calls = [];
  repository.listUsers = async input => { calls.push(input); return [managed]; };
  repository.getUser = async id => { assert.equal(id, target); return managed; };
  repository.setRoles = async (...args) => { calls.push(args); return { ...managed, roles: args[1] }; };
  const api = await listen(createApp(repository, testConfig));
  t.after(api.close);
  assert.equal((await api.request('/api/admin/users/query')).status, 401);
  const result = await api.request('/api/auth/register', { firstName: 'Laura', lastName: 'Pérez', email: 'admin-test@example.com', password: 'Contraseña larga 2026' });
  const { user, accessToken } = result.body;
  const input = { roles: ['student', 'teacher'], expectedRoles: ['student'] };
  for (const path of ['/api/admin/users/query', `/api/admin/users/${target}/query`, `/api/admin/users/${target}/roles/save`])
    assert.equal((await api.request(path, path.endsWith('/save') ? input : {}, accessToken)).status, 403);
  assert.equal(calls.length, 0);
  repository.users.get(user.id).roles.push('admin');
  const listed = await api.request('/api/admin/users/query', { search: '  Ana ', limit: 20, offset: 0 }, accessToken);
  assert.equal(listed.status, 200);
  assert.equal(listed.body.users[0].passwordHash, undefined);
  assert.deepEqual(calls[0], { search: 'Ana', limit: 20, offset: 0 });
  assert.equal((await api.request(`/api/admin/users/${target}/query`, {}, accessToken)).status, 200);
  assert.equal((await api.request(`/api/admin/users/not-uuid/query`, {}, accessToken)).status, 400);
  assert.equal((await api.request(`/api/admin/users/${target}/roles/save`, input, accessToken)).status, 200);
  assert.deepEqual(calls[1], [target, input.roles, user.id, input.expectedRoles]);
  assert.equal((await api.request(`/api/admin/users/${target}/roles/save`, { roles: ['admin'] }, accessToken)).status, 400);
  assert.equal(calls.length, 2);
  repository.users.get(user.id).roles = ['teacher'];
  assert.equal((await api.request(`/api/admin/users/${target}/roles/save`, input, accessToken)).status, 403);
});
