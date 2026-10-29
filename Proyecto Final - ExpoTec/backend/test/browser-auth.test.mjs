/** Prueba unitaria (sin base de datos real): sesión web con la renovación en cookie HttpOnly. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/create-app.mjs';
import { memoryRepository, listen, testConfig } from './support.mjs';

const account = { email: 'web@example.com', password: 'Contraseña de prueba 2026', firstName: 'Lucía', lastName: 'Fernández' };
const headers = { Origin: testConfig.origins[0] };
const cookie = result => result.headers.get('set-cookie').split(';')[0];

test('sesión web protegida: cookie, rotación, revocación y CSRF', async t => {
  const api = await listen(createApp(memoryRepository(), testConfig));
  t.after(api.close);
  const register = await api.request('/api/auth/browser/register', account, null, { headers });
  assert.equal(register.status, 201);
  assert.equal(register.body.refreshToken, undefined);
  assert.deepEqual(register.body.user.roles, ['student']);
  const initialCookie = cookie(register);
  assert.match(register.headers.get('set-cookie'), /HttpOnly/);
  assert.match(register.headers.get('set-cookie'), /SameSite=Strict/);
  assert.match(register.headers.get('set-cookie'), /Path=\/api\/auth\/browser/);
  assert.equal(register.headers.get('access-control-allow-credentials'), 'true');

  for (const origin of [undefined, 'null', 'https://otra.example']) {
    const result = await api.request('/api/auth/browser/refresh', {}, null,
      { headers: { Cookie: initialCookie, ...(origin ? { Origin: origin } : {}) } });
    assert.equal(result.status, 403);
  }
  assert.equal((await api.request('/api/auth/browser/refresh', {}, null,
    { headers: { ...headers, Cookie: initialCookie, 'Content-Type': 'text/plain' } })).status, 403);
  assert.equal((await api.request('/api/auth/browser/refresh', { refreshToken: 'extra' }, null, { headers })).status, 400);

  const refreshed = await api.request('/api/auth/browser/refresh', {}, null, { headers: { ...headers, Cookie: initialCookie } });
  assert.equal(refreshed.status, 200);
  assert.notEqual(cookie(refreshed), initialCookie);
  assert.equal(refreshed.body.refreshToken, undefined);
  assert.equal((await api.request('/api/auth/session', {}, refreshed.body.accessToken)).status, 200);
  assert.equal((await api.request('/api/auth/browser/logout', {}, null,
    { headers: { ...headers, Cookie: cookie(refreshed) } })).status, 204);
  assert.equal((await api.request('/api/auth/session', {}, refreshed.body.accessToken)).status, 401);
  const expired = await api.request('/api/auth/browser/refresh', {}, null, { headers: { ...headers, Cookie: cookie(refreshed) } });
  assert.equal(expired.status, 401);
  assert.match(expired.headers.get('set-cookie'), /Expires=Thu, 01 Jan 1970/);
  assert.equal((await api.request('/api/auth/browser/logout', {}, null, { headers })).status, 204);
});

test('cookie de producción exige HTTPS y no comparte dominio', async t => {
  const api = await listen(createApp(memoryRepository(), { ...testConfig, production: true }));
  t.after(api.close);
  const result = await api.request('/api/auth/browser/register', account, null, { headers });
  assert.equal(result.status, 201);
  assert.match(result.headers.get('set-cookie'), /^__Secure-expotec-refresh=/);
  assert.match(result.headers.get('set-cookie'), /; Secure;/);
  assert.doesNotMatch(result.headers.get('set-cookie'), /Domain=/);
});
