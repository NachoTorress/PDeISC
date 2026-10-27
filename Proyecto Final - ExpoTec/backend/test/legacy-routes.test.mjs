/**
 * Pruebas de la capa de compatibilidad con la APK 0.4.0: las rutas POST
 * anteriores deben llegar a la misma lógica que las rutas REST nuevas.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/create-app.mjs';
import { legacyRoutes } from '../src/middleware/legacy-routes.mjs';
import { memoryRepository, listen, testConfig } from './support.mjs';

test('rutas anteriores: se traducen a GET, PUT y DELETE con sus parámetros', async t => {
  const auth = memoryRepository();
  const id = randomUUID(), calls = [];
  const saved = { id, name: 'Aula', description: '', version: 1, furniture: [], booths: [] };
  const spaces = {
    async list() { return []; },
    async get() { return saved; },
    async create() { return saved; },
    async save(key, input) { calls.push(['save', key, input.version]); return saved; },
    async archive(key, version) { calls.push(['archive', key, version]); },
  };
  const api = await listen(createApp(auth, testConfig, console, undefined, spaces));
  t.after(api.close);

  const listed = await api.request('/api/spaces/query', {});
  assert.equal(listed.status, 200);
  assert.equal(listed.headers.get('deprecation'), 'true');
  assert.equal((await api.request(`/api/spaces/${id}/query`, {})).status, 200);
  // Un campo extra en una lectura anterior sigue siendo rechazado.
  assert.equal((await api.request('/api/spaces/query', { extra: 1 })).status, 400);

  const { accessToken, user } = (await api.request('/api/auth/register', { firstName: 'Ana', lastName: 'Gómez', email: 'legacy@example.com', password: 'Contraseña de prueba 2026' })).body;
  assert.equal((await api.request('/api/auth/session', {}, accessToken)).status, 200);
  auth.users.get(user.id).roles.push('admin');
  assert.equal((await api.request(`/api/spaces/${id}/save`, { name: 'Aula', description: '', version: 1, furniture: [], boothFurnitureIds: [] }, accessToken)).status, 200);
  assert.equal((await api.request(`/api/spaces/${id}/archive`, { version: 3 }, accessToken)).status, 204);
  assert.deepEqual(calls, [['save', id, 1], ['archive', id, 3]]);

  // La consulta de usuarios conserva los números de paginación.
  assert.equal((await api.request('/api/admin/users/query', { limit: 5, offset: 0 }, accessToken)).status, 200);
  assert.equal((await api.request('/api/admin/users/query', { limit: 500 }, accessToken)).status, 400);
});

test('rutas anteriores: cada traducción apunta a un método REST válido', () => {
  for (const route of legacyRoutes) {
    assert.ok(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(route.method));
    assert.ok(route.to('00000000-0000-4000-8000-000000000000').startsWith('/api/'));
  }
});
