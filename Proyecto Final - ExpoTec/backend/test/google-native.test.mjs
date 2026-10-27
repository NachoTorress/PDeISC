/** Prueba unitaria (sin base de datos real): verificación del ID token de Google nativo. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT } from 'jose';
import { createNativeGoogleVerifier } from '../src/services/google-native.mjs';
import { createSocialService } from '../src/services/social.mjs';
import { tokenHash } from '../src/services/crypto.mjs';
import { socialFailure } from '../src/services/social-providers.mjs';
import { testConfig } from './support.mjs';

const config = { ...testConfig, social: { providers: { google: { clientId: 'test.apps.googleusercontent.com', clientSecret: 'test-only' } } } };

test('Google Android: valida firma, emisor, destinatario, nonce, vigencia y correo verificado', async () => {
  const keys = await generateKeyPair('RS256');
  const other = await generateKeyPair('RS256');
  const verify = createNativeGoogleVerifier(config, keys.publicKey);
  const nonce = 'a'.repeat(64), now = Math.floor(Date.now() / 1000);
  const sign = (claims = {}, key = keys.privateKey) => new SignJWT({ sub: '123456789', email: 'Owner@Example.com', email_verified: true, nonce,
    iss: 'https://accounts.google.com', aud: config.social.providers.google.clientId, iat: now, exp: now + 3600, ...claims })
    .setProtectedHeader({ alg: 'RS256' }).sign(key);
  assert.deepEqual(await verify(await sign(), nonce), { subject: '123456789', email: 'owner@example.com' });
  for (const claims of [{ iss: 'https://evil.example' }, { aud: 'another-app' }, { nonce: 'b'.repeat(64) },
    { exp: now - 60 }, { iat: now - 1200 }, { iat: now + 60 }, { email_verified: false }, { email_verified: 'true' },
    { sub: null }, { email: 'invalid' }, { nonce: undefined }, { exp: undefined }])
    await assert.rejects(verify(await sign(claims), nonce), error => error.code === 'SOCIAL_FAILED');
  await assert.rejects(verify(await sign({}, other.privateKey), nonce));
  for (const token of ['', 'x'.repeat(8193), 'not-a-jwt']) await assert.rejects(verify(token, nonce));
});

test('Google Android: prueba privada y nonce de un uso; conserva el flujo de vinculación existente', async () => {
  const rows = new Map();
  let verifications = 0;
  const repository = {
    async start(input) { rows.set(input.id, { ...input, status: 'started' }); },
    async claim(provider, stateHash, bindingHash) {
      const row = [...rows.values()].find(row => row.provider === provider && row.stateHash === stateHash && row.bindingHash === bindingHash && row.status === 'started' && row.expiresAt > new Date());
      if (!row) throw socialFailure();
      row.status = 'processing'; return { ...row };
    },
    async verified(id, identity) { Object.assign(rows.get(id), identity, { status: 'verified' }); },
    async failed(id) { rows.get(id).status = 'failed'; },
    async inspect(id, hash) { const row = rows.get(id); if (!row || row.status !== 'verified' || row.proofHash !== hash) throw socialFailure(); return row; },
    async mode() { return 'link'; },
  };
  const service = createSocialService(repository, {}, config, undefined, async (token, nonce) => {
    verifications++; assert.equal(token, 'signed-id-token'); assert.match(nonce, /^[a-f0-9]{64}$/);
    return { subject: '123456789', email: 'owner@example.com' };
  });
  const proof = 'p'.repeat(43), start = await service.startNativeGoogle({ challenge: tokenHash(proof) });
  assert.equal(start.webClientId, config.social.providers.google.clientId);
  assert.equal(JSON.stringify(start).includes('secret'), false);
  const input = { id: start.id, proof, idToken: 'signed-id-token' };
  await assert.rejects(service.verifyNativeGoogle({ ...input, proof: 'x'.repeat(43) }));
  assert.equal(verifications, 0);
  assert.deepEqual(await service.verifyNativeGoogle(input), { id: start.id });
  assert.equal((await service.status({ id: start.id, proof })).mode, 'link');
  await assert.rejects(service.verifyNativeGoogle(input));
  assert.equal(verifications, 1);
  await assert.rejects(service.startNativeGoogle({ challenge: 'invalid' }));
  await assert.rejects(service.startNativeGoogle({ challenge: tokenHash(proof), email: 'untrusted@example.com' }));
  const failed = await service.startNativeGoogle({ challenge: tokenHash(proof) });
  const rejecting = createSocialService(repository, {}, config, undefined, async () => { throw new Error('private-token'); });
  await assert.rejects(rejecting.verifyNativeGoogle({ ...input, id: failed.id }), error => error.code === 'SOCIAL_FAILED' && !error.message.includes('private-token'));
  assert.equal(rows.get(failed.id).status, 'failed');
  const expired = await service.startNativeGoogle({ challenge: tokenHash(proof) });
  rows.get(expired.id).expiresAt = new Date(0);
  await assert.rejects(service.verifyNativeGoogle({ ...input, id: expired.id }));
});
