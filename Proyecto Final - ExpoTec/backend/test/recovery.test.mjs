/**
 * Prueba unitaria (sin base de datos real): recuperación de contraseña sin revelar cuentas existentes.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readRecoveryConfig } from '../src/config/env.mjs';
import { recoveryEmail, recoveryPassword } from '../src/validators/recovery.mjs';
import { createRecoveryService, recoveryMessage } from '../src/services/recovery.mjs';
import { tokenHash, verifyPassword } from '../src/services/crypto.mjs';
import { createApp } from '../src/create-app.mjs';
import { memoryRepository, listen, testConfig } from './support.mjs';

test('recuperación: configuración opcional, SMTP cifrado y origen autorizado', () => {
  assert.equal(readRecoveryConfig({}, testConfig.origins, false), null);
  const env = { SMTP_USER: 'expo@example.com', SMTP_PASSWORD: 'abcd efgh ijkl mnop', PASSWORD_RESET_WEB_ORIGIN: testConfig.origins[0] };
  assert.equal(readRecoveryConfig(env, testConfig.origins, false).smtp.password, 'abcdefghijklmnop');
  for (const changes of [{ SMTP_PORT: '25' }, { SMTP_HOST: 'host/path' }, { SMTP_USER: 'x\r\nbcc:victim@example.com' }, { PASSWORD_RESET_WEB_ORIGIN: 'https://unknown.example.com' }, { PASSWORD_RESET_WEB_ORIGIN: `${testConfig.origins[0]}/path` }])
    assert.throws(() => readRecoveryConfig({ ...env, ...changes }, testConfig.origins, false));
  assert.throws(() => readRecoveryConfig(env, testConfig.origins, true));
});

test('recuperación: valida correo, token, contraseña y confirmación sin admitir campos extra', () => {
  assert.equal(recoveryEmail({ email: ' EXPO@example.com ' }), 'expo@example.com');
  for (const input of [{ email: 'mal' }, { email: 'expo@example.com', userId: 'victim' }, null]) assert.throws(() => recoveryEmail(input));
  const input = { token: 'x'.repeat(43), password: 'Una contraseña nueva 2026', confirmation: 'Una contraseña nueva 2026' };
  assert.equal(recoveryPassword(input).password, input.password);
  for (const changes of [{ token: 'corto' }, { password: 'corta' }, { confirmation: 'diferente' }, { roles: ['admin'] }]) assert.throws(() => recoveryPassword({ ...input, ...changes }));
});

test('recuperación: mensajes idénticos, hash del token, vencimiento y notificación sin exponer secretos', async () => {
  const stored = [], messages = [], tasks = [], logs = [];
  let expired = false, used = false;
  const repository = {
    async issue(email, hash, expiresAt) { if (email !== 'known@example.com') return false; stored.push({ hash, expiresAt }); used = false; return true; },
    async revoke() { used = true; },
    async consume(hash, passwordHash) { if (used || expired || hash !== stored.at(-1)?.hash) throw new Error('INVALID'); used = true; stored.at(-1).passwordHash = passwordHash; return 'known@example.com'; },
  };
  const mailer = { async request(email, url) { messages.push({ email, url }); }, async changed(email) { messages.push({ changed: email }); } };
  const service = createRecoveryService(repository, mailer, { webOrigin: 'https://expo.example.com' }, { error: item => logs.push(item) }, promise => tasks.push(promise));
  const known = await service.request('known@example.com');
  const unknown = await service.request('unknown@example.com');
  assert.deepEqual(known, unknown); assert.equal(known.message, recoveryMessage);
  const token = new URL(messages[0].url).hash.slice('#reset='.length);
  assert.match(token, /^[A-Za-z0-9_-]{43}$/); assert.equal(stored[0].hash, tokenHash(token));
  assert.equal(JSON.stringify(stored).includes(token), false);
  assert.ok(stored[0].expiresAt > new Date(Date.now() + 19 * 60 * 1000));
  assert.ok(stored[0].expiresAt <= new Date(Date.now() + 20 * 60 * 1000));
  const password = 'Mi contraseña nueva de ExpoTec';
  await service.complete({ token, password }); await Promise.all(tasks);
  assert.ok(await verifyPassword(password, stored[0].passwordHash));
  await assert.rejects(service.complete({ token, password }));
  await service.request('known@example.com'); expired = true;
  await assert.rejects(service.complete({ token: new URL(messages.findLast(item => item.url).url).hash.slice(7), password }));
  assert.ok(messages.some(item => item.changed)); assert.deepEqual(logs, []);
});

test('recuperación: un fallo de correo revoca el enlace y responde sin revelar cuentas ni detalles SMTP', async () => {
  const tasks = [], logs = [], revoked = [];
  const service = createRecoveryService({ async issue() { return true; }, async revoke(hash) { revoked.push(hash); } }, { async request() { throw new Error('secret SMTP details'); } }, { webOrigin: 'https://expo.example.com' }, { error: item => logs.push(item) }, task => tasks.push(task));
  assert.deepEqual(await service.request('private@example.com'), { message: recoveryMessage });
  await Promise.all(tasks);
  assert.equal(revoked.length, 1); assert.deepEqual(logs, [{ code: 'RESET_MAIL_FAILED' }]);
});

test('recuperación HTTP: consulta de disponibilidad, respuesta uniforme y límites', async t => {
  const auth = memoryRepository();
  const disabled = await listen(createApp(auth, testConfig)); t.after(disabled.close);
  assert.deepEqual((await disabled.get('/api/auth/recovery')).body, { enabled: false });
  assert.equal((await disabled.request('/api/auth/recovery/request', { email: 'any@example.com' })).status, 503);
  const config = { ...testConfig, recovery: { webOrigin: testConfig.origins[0] } };
  const repository = { async issue() { return false; } };
  const api = await listen(createApp(auth, config, console, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, repository, {}));
  t.after(api.close);
  assert.deepEqual((await api.get('/api/auth/recovery')).body, { enabled: true });
  assert.equal((await api.request('/api/auth/recovery/request', { email: 'unknown@example.com' })).status, 202);
  assert.equal((await api.request('/api/auth/recovery/complete', { token: 'short', password: 'long enough password', confirmation: 'long enough password' })).status, 400);
  auth.consumeRate = async () => 60;
  const limited = await api.request('/api/auth/recovery/request', { email: 'unknown@example.com' });
  assert.equal(limited.status, 429); assert.equal(limited.headers.get('retry-after'), '60');
});
