import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/create-app.mjs';
import { memoryRepository, listen, testConfig } from './support.mjs';

test('API de espacios: lectura pública, escritura solo de administradores y validación', async t => {
  const auth = memoryRepository();
  const id = randomUUID();
  const saved = { id, name: 'Aula', description: '', version: 1, furniture: [], booths: [] };
  const calls = [];
  const spaces = {
    async list() { return [{ id, name: saved.name, description: '', version: 1, furnitureCount: 0, boothCount: 0 }]; },
    async get(key) { assert.equal(key, id); return saved; },
    async create(input, actor) { calls.push({ input, actor }); return saved; },
    async save(key, input, actor) { calls.push({ key, input, actor }); return { ...saved, ...input, version: 2 }; },
    async archive(key, version, actor) { calls.push({ key, version, actor }); },
  };
  const api = await listen(createApp(auth, testConfig, console, undefined, spaces));
  t.after(api.close);
  assert.equal((await api.request('/api/spaces/query')).status, 200);
  const publicSpace = await api.request(`/api/spaces/${id}/query`);
  assert.equal(publicSpace.status, 200);
  assert.deepEqual(publicSpace.body.space, saved);
  assert.equal(publicSpace.body.space.createdBy, undefined);
  assert.equal((await api.request('/api/spaces/not-an-id/query')).status, 400);
  assert.equal((await api.request('/api/spaces/query', { email: 'extra' })).status, 400);
  const input = { name: 'Aula', description: '' };
  assert.equal((await api.request('/api/spaces/create', input)).status, 401);
  const registration = await api.request('/api/auth/register', { firstName: 'Ana', lastName: 'García', email: 'space@example.com', password: 'Contraseña de prueba 2026' });
  const { user, accessToken } = registration.body;
  assert.equal((await api.request('/api/spaces/create', input, accessToken)).status, 403);
  auth.users.get(user.id).roles.push('admin');
  assert.equal((await api.request('/api/spaces/create', input, accessToken)).status, 201);
  assert.equal(calls[0].actor, user.id);
  assert.equal((await api.request(`/api/spaces/${id}/save`, { ...input, version: 1, furniture: [], boothFurnitureIds: [] }, accessToken)).status, 200);
  assert.equal((await api.request(`/api/spaces/${id}/archive`, { version: 2 }, accessToken)).status, 204);
  assert.equal((await api.request(`/api/spaces/${id}/archive`, { version: 0 }, accessToken)).status, 400);
  assert.equal((await api.request(`/api/spaces/${id}/save`, { ...input, version: 1, furniture: [], boothFurnitureIds: [], roles: ['admin'] }, accessToken)).status, 400);
  auth.users.get(user.id).roles = ['student'];
  assert.equal((await api.request(`/api/spaces/${id}/archive`, { version: 2 }, accessToken)).status, 403);
});
