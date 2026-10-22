import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readSocialConfig } from '../src/config/env.mjs';
import { authorizationUrl, createProviderExchange } from '../src/services/social-providers.mjs';
import { createSocialService } from '../src/services/social.mjs';
import { tokenHash } from '../src/services/crypto.mjs';
import { createApp } from '../src/create-app.mjs';
import { listen, memoryRepository, testConfig } from './support.mjs';
import { HttpError } from '../src/lib/errors.mjs';

export const socialConfig = { ...testConfig, social: {
  webOrigin: testConfig.origins[0],
  providers: Object.fromEntries(['google', 'discord', 'github'].map(name => [name, { clientId: `test-${name}`, clientSecret: 'test-only-client-secret' }])),
} };
const binding = 'b'.repeat(43);

test('social Android: los tres proveedores exigen la prueba propia y entregan renovación sin cookies', async t => {
  for (const provider of ['google', 'discord', 'github']) {
    const auth = memoryRepository();
    const account = await auth.register({ email: 'mobile@example.com', firstName: 'Prueba', lastName: 'Android', passwordHash: 'unused', accountType: 'student' }, 'initial', new Date(Date.now() + 60000));
    account.user.roles.push('admin');
    auth.users.get(account.user.id).roles.push('admin');
    const id = randomUUID(), proof = 'p'.repeat(43);
    let consumed = false;
    const social = {
      async inspect(flowId, proofHash) {
        if (flowId !== id || proofHash !== tokenHash(proof) || consumed) throw new HttpError(400, 'SOCIAL_FAILED', 'Acceso inválido.');
        return { provider, email: account.user.email };
      },
      mode: async () => 'login',
      async complete(input, hash, expires) {
        assert.equal(input.mode, 'login'); consumed = true;
        return auth.openSession(account.user.id, hash, expires);
      },
    };
    const api = await listen(createApp(auth, socialConfig, console, undefined, undefined, undefined, undefined, undefined, undefined, social));
    t.after(api.close);
    assert.equal((await api.request('/api/auth/social/status', { id, proof: 'x'.repeat(43) })).status, 400);
    const status = await api.request('/api/auth/social/status', { id, proof });
    assert.equal(status.status, 200); assert.equal(status.body.provider, provider);
    const result = await api.request('/api/auth/social/complete', { id, proof, mode: 'login' });
    assert.equal(result.status, 200); assert.equal(result.headers.get('set-cookie'), null);
    assert.ok(result.body.accessToken); assert.ok(result.body.refreshToken);
    assert.ok(result.body.user.roles.includes('admin'));
    assert.equal((await api.request('/api/auth/social/complete', { id, proof, mode: 'login' })).status, 400);
  }
});

test('social: configuración cerrada, pares completos y destinos exactos', () => {
  assert.deepEqual(readSocialConfig({}, [], true), { providers: {} });
  assert.throws(() => readSocialConfig({ SOCIAL_GOOGLE_CLIENT_ID: 'id' }, [], true));
  const env = { SOCIAL_GOOGLE_CLIENT_ID: 'id', SOCIAL_GOOGLE_CLIENT_SECRET: 'secret', SOCIAL_WEB_ORIGIN: 'https://web.example.com' };
  assert.equal(readSocialConfig(env, [env.SOCIAL_WEB_ORIGIN], true).providers.google.clientId, 'id');
  for (const origin of ['http://web.example.com', 'https://web.example.com/path', 'https://web.example.com/']) assert.throws(() => readSocialConfig({ ...env, SOCIAL_WEB_ORIGIN: origin }, [origin], true));
  assert.throws(() => readSocialConfig(env, [], true));
});

test('social: autorizaciones tienen state y retorno fijo; PKCE donde corresponde', () => {
  for (const provider of ['google', 'discord', 'github']) {
    const url = new URL(authorizationUrl(socialConfig, provider, 'state', 'verifier'));
    assert.equal(url.searchParams.get('state'), 'state');
    assert.equal(url.searchParams.get('redirect_uri'), `${testConfig.origins[0]}/api/auth/social/${provider}/callback`);
    assert.equal(url.searchParams.get('response_type'), 'code');
    assert.equal(url.searchParams.has('client_secret'), false);
    assert.equal(url.searchParams.has('code_challenge'), provider !== 'discord');
  }
});

for (const provider of ['google', 'discord', 'github']) {
  test(`social ${provider}: intercambio confidencial y correo verificado`, async () => {
    const calls = [];
    const responses = [{ access_token: 'transient-provider-token', token_type: 'Bearer' },
      provider === 'google' ? { sub: 'google-user', email: 'SOCIAL@example.com', email_verified: true } : provider === 'discord' ? { id: '1234567', email: 'SOCIAL@example.com', verified: true } : { id: 1234 },
      [{ email: 'other@example.com', primary: false, verified: true }, { email: 'SOCIAL@example.com', primary: true, verified: true }]];
    const exchange = createProviderExchange(socialConfig, async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => responses.shift() }; });
    assert.deepEqual(await exchange(provider, 'code', 'verifier'), { subject: provider === 'google' ? 'google-user' : provider === 'discord' ? '1234567' : '1234', email: 'social@example.com' });
    assert.equal(calls[0].options.body.get('client_secret'), 'test-only-client-secret');
    assert.equal(calls[0].options.body.get('code_verifier'), provider === 'discord' ? null : 'verifier');
    assert.equal(calls[1].options.headers.Authorization, 'Bearer transient-provider-token');
    assert.ok(calls.every(call => call.options.redirect === 'error' && call.url.startsWith('https:')));
    const invalid = createProviderExchange(socialConfig, async url => ({ ok: true, json: async () => url.includes('token') ? { access_token: 'token', token_type: 'bearer' } : provider === 'github' && url.endsWith('/user') ? { id: 1234 } : {} }));
    await assert.rejects(invalid(provider, 'code', 'verifier'), error => error.code === 'SOCIAL_FAILED' && !error.message.includes('token'));
  });
}

test('social: prueba de pestaña, estado de un uso y errores sin códigos ni tokens', async () => {
  const rows = new Map();
  const repo = {
    async start(value) { rows.set(value.id, { ...value, status: 'started' }); },
    async claim(provider, stateHash, bindingHash) {
      const row = [...rows.values()].find(value => value.stateHash === stateHash && value.bindingHash === bindingHash && value.provider === provider && value.status === 'started');
      if (!row) throw new Error('invalid-state');
      row.status = 'processing'; return row;
    },
    async failed(id) { rows.get(id).status = 'failed'; },
  };
  const service = createSocialService(repo, {}, socialConfig, async () => { throw new Error('private-provider-token'); });
  await assert.rejects(service.start({ provider: '__proto__', challenge: tokenHash('x') }), error => error.status === 404);
  await assert.rejects(service.start({ provider: 'google', challenge: 'invalid' }));
  await assert.rejects(service.start({ provider: 'google', challenge: tokenHash('x'), returnUrl: 'https://evil.example' }));
  const start = await service.start({ provider: 'google', challenge: tokenHash('x') }, binding);
  const state = new URL(start.url).searchParams.get('state');
  assert.equal(rows.get(start.id).stateHash, tokenHash(state));
  await assert.rejects(service.callback('google', { state, code: 'secret-code' }, 'v'.repeat(43)));
  assert.equal(rows.get(start.id).status, 'started');
  assert.equal(await service.callback('google', { state, code: 'secret-code' }, binding), `${socialConfig.social.webOrigin}/#social=${start.id}`);
  assert.equal(rows.get(start.id).status, 'failed');
  await assert.rejects(service.callback('google', { state, code: 'secret-code' }, binding));
});

test('social HTTP: proveedores sin secretos, inicio y final exigen origen y JSON', async t => {
  const repo = { start: async () => {} };
  const api = await listen(createApp(memoryRepository(), socialConfig, console, undefined, undefined, undefined, undefined, undefined, undefined, repo));
  t.after(api.close);
  const list = await api.request('/api/auth/social/providers/query');
  assert.equal(list.status, 200);
  assert.equal(list.body.providers.length, 3);
  assert.equal(JSON.stringify(list.body).includes('secret'), false);
  const input = { provider: 'google', challenge: tokenHash('test') };
  const native = await api.request('/api/auth/social/google/native/start', { challenge: input.challenge });
  assert.equal(native.status, 200);
  assert.match(native.body.nonce, /^[a-f0-9]{64}$/);
  assert.equal(native.body.webClientId, socialConfig.social.providers.google.clientId);
  assert.equal(JSON.stringify(native.body).includes('secret'), false);
  const invalidNative = await api.request('/api/auth/social/google/native/verify', { id: native.body.id, proof: 'invalid', idToken: 'private-token' });
  assert.equal(invalidNative.status, 400);
  assert.equal(JSON.stringify(invalidNative.body).includes('private-token'), false);
  assert.equal((await api.request('/api/auth/browser/social/start', input)).status, 403);
  const started = await api.request('/api/auth/browser/social/start', input, undefined, { headers: { Origin: testConfig.origins[0] } });
  assert.equal(started.status, 200);
  assert.match(started.headers.get('set-cookie'), /expotec-social=.*HttpOnly.*SameSite=Lax/);
  assert.equal((await api.request('/api/auth/social/google/callback?state=' + 's'.repeat(43) + '&code=code', {}, undefined, { method: 'GET' })).status, 400);
  assert.equal((await api.request('/api/auth/browser/social/complete', { id: randomUUID(), proof: 'x'.repeat(43) }, undefined, { headers: { Origin: 'https://evil.example' } })).status, 403);
  const disabled = createSocialService({}, {}, testConfig);
  assert.deepEqual(disabled.providers(), { providers: [] });
  await assert.rejects(disabled.start(input), error => error.status === 404);
});

test('social: vinculación limita intentos por cuenta antes de verificar la contraseña', async () => {
  let credentialReads = 0;
  const repository = { inspect: async () => ({ provider: 'google', email: 'owner@example.com' }), mode: async () => 'link' };
  const auth = { consumeRate: async (bucket, limit, seconds) => {
    assert.match(bucket, /^[a-f0-9]{64}$/); assert.equal(limit, 10); assert.equal(seconds, 900); return 60;
  }, findCredentials: async () => { credentialReads++; } };
  const service = createSocialService(repository, auth, socialConfig);
  await assert.rejects(service.complete({ id: randomUUID(), proof: 'x'.repeat(43), mode: 'link', password: 'attempt' }), error => error.status === 429);
  assert.equal(credentialReads, 0);
});

test('social HTTP: cookie de navegador en producción es host-only, HttpOnly y Secure', async t => {
  const origin = 'https://web.example.com';
  const config = { ...socialConfig, production: true, origins: [origin], social: { ...socialConfig.social, webOrigin: origin } };
  const api = await listen(createApp(memoryRepository(), config, console, undefined, undefined, undefined, undefined, undefined, undefined, { start: async () => {} }));
  t.after(api.close);
  const response = await api.request('/api/auth/browser/social/start', { provider: 'google', challenge: tokenHash('temporary-proof') }, undefined, { headers: { Origin: origin } });
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /^__Host-expotec-social=[A-Za-z0-9_-]{43};/);
  for (const value of ['Path=/', 'HttpOnly', 'Secure', 'SameSite=Lax', 'Max-Age=600']) assert.ok(cookie.includes(value));
  assert.equal(cookie.includes('Domain='), false);
  assert.ok(response.body.url.startsWith('https://accounts.google.com/'));
});
