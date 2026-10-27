/**
 * Prueba unitaria (sin base de datos real): registro, ingreso, JWT de acceso y renovación, rotación, cierre de sesión, CORS y límites de tamaño.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT } from 'jose';
import { createApp } from '../src/create-app.mjs';
import { memoryRepository, listen, testConfig } from './support.mjs';

const student = { email: 'Lucia@example.com', password: 'Una contraseña larga 2026', firstName: 'Lucía', lastName: 'O’Connor' };

test('API completa de cuentas: permisos, sesiones, validación y errores', async t => {
  const repository = memoryRepository();
  const logs = [];
  const api = await listen(createApp(repository, testConfig, { error: value => logs.push(value) }));
  t.after(api.close);
  let registered;
  await t.test('registro normaliza correo y solo concede student; no expone hash', async () => {
    const result = await api.request('/api/auth/register', student);
    assert.equal(result.status, 201);
    registered = result.body;
    assert.deepEqual(registered.user.roles, ['student']);
    assert.equal(registered.user.email, 'lucia@example.com');
    assert.equal(registered.user.firstName, 'Lucía');
    assert.equal(registered.user.passwordHash, undefined);
    assert.equal(registered.user.password, undefined);
    assert.equal(result.headers.get('cache-control'), 'no-store');
    assert.equal(registered.expiresIn, 900);
    assert.notEqual(repository.users.get(registered.user.id).passwordHash, student.password);
  });
  await t.test('rechaza permisos autoconcedidos, campos extra y nombres inválidos', async () => {
    assert.equal((await api.request('/api/auth/register', { ...student, roles: ['admin'] })).status, 400);
    const result = await api.request('/api/auth/register', { ...student, firstName: 'Lucía123', password: 'corta' });
    assert.equal(result.status, 400);
    assert.ok(result.body.error.fields.firstName);
    assert.ok(result.body.error.fields.password);
    assert.equal((await api.request('/api/auth/register', student)).status, 409);
  });
  await t.test('credenciales incorrectas dan el mismo error para cuentas existentes e inexistentes', async () => {
    const first = await api.request('/api/auth/login', { email: student.email, password: 'incorrecta' });
    const second = await api.request('/api/auth/login', { email: 'nadie@example.com', password: 'incorrecta' });
    assert.equal(first.status, 401);
    assert.deepEqual(first.body.error, second.body.error);
    const login = await api.request('/api/auth/login', { email: student.email, password: student.password });
    assert.equal(login.status, 200);
  });
  await t.test('requiere sesión, lee permisos del servidor y bloquea a alumnos', async () => {
    assert.equal((await api.get('/api/auth/session')).status, 401);
    assert.equal((await api.get('/api/auth/session', {}, registered.accessToken)).status, 200);
    assert.equal((await api.get('/api/admin/users', {}, registered.accessToken)).status, 403);
    repository.users.get(registered.user.id).roles.push('admin');
    const users = await api.get('/api/admin/users', {}, registered.accessToken);
    assert.equal(users.status, 200);
    assert.equal(users.body.users[0].passwordHash, undefined);
    assert.equal((await api.get('/api/admin/users', { limit: 101 }, registered.accessToken)).status, 400);
    repository.users.get(registered.user.id).roles = ['student'];
    assert.equal((await api.get('/api/admin/users', {}, registered.accessToken)).status, 403);
  });
  await t.test('firma inválida y JWT vencido no autentican', async () => {
    assert.equal((await api.get('/api/auth/session', {}, `${registered.accessToken}x`)).status, 401);
    const expired = await new SignJWT({ sid: 'fake' }).setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuer(testConfig.issuer).setAudience(testConfig.audience).setSubject(registered.user.id)
      .setIssuedAt(1).setExpirationTime(2).sign(new TextEncoder().encode(testConfig.secret));
    assert.equal((await api.get('/api/auth/session', {}, expired)).status, 401);
  });
  await t.test('JWT de acceso y renovación tienen usos separados y no son intercambiables', async () => {
    assert.equal((await api.get('/api/auth/session', {}, registered.refreshToken)).status, 401);
    assert.equal((await api.request('/api/auth/refresh', { refreshToken: registered.accessToken })).status, 401);
    assert.equal((await api.request('/api/auth/refresh', { refreshToken: `${registered.refreshToken}x` })).status, 401);
    assert.equal((await api.request('/api/auth/logout', { refreshToken: registered.accessToken })).status, 401);
  });
  await t.test('renueva y detecta reutilización: revoca toda la sesión', async () => {
    const next = await api.request('/api/auth/refresh', { refreshToken: registered.refreshToken });
    assert.equal(next.status, 200);
    assert.notEqual(next.body.refreshToken, registered.refreshToken);
    assert.equal((await api.request('/api/auth/refresh', { refreshToken: registered.refreshToken })).status, 401);
    assert.equal((await api.request('/api/auth/refresh', { refreshToken: next.body.refreshToken })).status, 401);
    assert.equal((await api.get('/api/auth/session', {}, next.body.accessToken)).status, 401);
  });
  await t.test('cerrar sesión invalida acceso y renovación; es idempotente', async () => {
    const login = await api.request('/api/auth/login', { email: student.email, password: student.password });
    const { accessToken, refreshToken } = login.body;
    assert.equal((await api.request('/api/auth/logout', { refreshToken })).status, 204);
    assert.equal((await api.request('/api/auth/logout', { refreshToken })).status, 204);
    assert.equal((await api.get('/api/auth/session', {}, accessToken)).status, 401);
    assert.equal((await api.request('/api/auth/refresh', { refreshToken })).status, 401);
  });
  await t.test('CORS exacto, preflight, JSON inválido y límite de cuerpo', async () => {
    const preflight = await api.request('/api/auth/login', {}, null, { method: 'OPTIONS', headers: { Origin: 'http://localhost:8081', 'Access-Control-Request-Method': 'POST' } });
    assert.equal(preflight.status, 204);
    assert.equal(preflight.headers.get('access-control-allow-origin'), 'http://localhost:8081');
    assert.equal((await api.get('/api/health', {}, null, { headers: { Origin: 'https://otra-web.example' } })).status, 403);
    assert.equal((await api.request('/api/auth/login', {}, null, { raw: '{' })).status, 400);
    assert.equal((await api.request('/api/auth/login', { password: 'x'.repeat(17000) })).status, 413);
    assert.equal((await api.del('/api/health')).status, 404);
  });
  await t.test('límite persistente devuelve Retry-After y no ejecuta login', async () => {
    repository.consumeRate = async () => 30;
    const result = await api.request('/api/auth/login', { email: student.email, password: student.password });
    assert.equal(result.status, 429);
    assert.equal(result.headers.get('retry-after'), '30');
    repository.consumeRate = async () => 0;
  });
  await t.test('falla de base se informa sin filtrar credenciales', async () => {
    repository.ready = async () => { throw Object.assign(new Error('password=secreto'), { code: 'ECONNREFUSED' }); };
    const result = await api.get('/api/health/ready');
    assert.equal(result.status, 503);
    assert.equal(result.body.error.code, 'DATABASE_UNAVAILABLE');
    assert.ok(result.body.requestId);
    assert.ok(!JSON.stringify([...logs, result.body]).includes('secreto'));
    assert.equal((await api.get('/api/health')).status, 200);
  });
});
