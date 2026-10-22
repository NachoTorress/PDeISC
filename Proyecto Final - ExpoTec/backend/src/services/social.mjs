import { randomBytes, randomUUID } from 'node:crypto';
import { HttpError } from '../lib/errors.mjs';
import { objectBody, credentials, userId } from '../validators/auth.mjs';
import { tokenHash, rateKey, hashPassword, verifyPassword, dummyPasswordHash, newRefreshToken, accessToken } from './crypto.mjs';
import { authorizationUrl, providerNames, createProviderExchange, socialFailure } from './social-providers.mjs';
import { createNativeGoogleVerifier } from './google-native.mjs';

function opaque(value) { return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value); }
function proof(body, allowed = []) {
  objectBody(body, ['id', 'proof', ...allowed]);
  userId(body.id);
  if (!opaque(body.proof)) throw socialFailure();
  return { id: body.id, proofHash: tokenHash(body.proof) };
}
export function createSocialService(repository, authRepository, config, exchange = createProviderExchange(config), verifyGoogle = createNativeGoogleVerifier(config)) {
  const enabled = provider => Object.hasOwn(config.social?.providers ?? {}, provider);
  return {
    providers() { return { providers: Object.keys(providerNames).filter(enabled).map(id => ({ id, name: providerNames[id] })) }; },
    async startNativeGoogle(body) {
      objectBody(body, ['challenge']);
      if (!enabled('google')) throw new HttpError(404, 'SOCIAL_DISABLED', 'Google todavía no está disponible.');
      if (typeof body.challenge !== 'string' || !/^[a-f0-9]{64}$/.test(body.challenge)) throw socialFailure();
      const id = randomUUID(), nonce = randomBytes(32).toString('hex');
      await repository.start({ id, provider: 'google', stateHash: tokenHash(id), proofHash: body.challenge,
        bindingHash: body.challenge, verifier: nonce, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
      return { id, nonce, webClientId: config.social.providers.google.clientId };
    },
    async verifyNativeGoogle(body) {
      const input = proof(body, ['idToken']);
      if (!enabled('google')) throw socialFailure();
      if (typeof body.idToken !== 'string' || !body.idToken || body.idToken.length > 8192) throw socialFailure();
      const current = await repository.claim('google', tokenHash(input.id), input.proofHash);
      try {
        await repository.verified(current.id, await verifyGoogle(body.idToken, current.verifier));
      } catch {
        await repository.failed(current.id);
        throw socialFailure();
      }
      return { id: current.id };
    },
    async start(body, binding) {
      objectBody(body, ['provider', 'challenge']);
      if (typeof body.provider !== 'string' || !enabled(body.provider)) throw new HttpError(404, 'SOCIAL_DISABLED', 'Este proveedor todavía no está disponible.');
      if (!opaque(binding) || typeof body.challenge !== 'string' || !/^[a-f0-9]{64}$/.test(body.challenge)) throw socialFailure();
      const id = randomUUID(), state = randomBytes(32).toString('base64url'), verifier = randomBytes(32).toString('base64url');
      await repository.start({ id, provider: body.provider, stateHash: tokenHash(state), proofHash: body.challenge, bindingHash: tokenHash(binding), verifier, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
      return { id, url: authorizationUrl(config, body.provider, state, verifier) };
    },
    async callback(provider, query, binding) {
      if (!enabled(provider) || !opaque(query.state) || !opaque(binding)) throw socialFailure();
      const current = await repository.claim(provider, tokenHash(query.state), tokenHash(binding));
      try {
        if (query.error || typeof query.code !== 'string' || !query.code || query.code.length > 2048) throw socialFailure();
        await repository.verified(current.id, await exchange(provider, query.code, current.verifier));
      } catch {
        await repository.failed(current.id);
      }
      return `${config.social.webOrigin}/#social=${current.id}`;
    },
    async status(body) {
      const input = proof(body), current = await repository.inspect(input.id, input.proofHash);
      if (!enabled(current.provider)) throw socialFailure();
      return { provider: current.provider, email: current.email, mode: await repository.mode(current) };
    },
    async complete(body) {
      const input = proof(body, ['mode', 'password', 'firstName', 'lastName', 'accountType']);
      const current = await repository.inspect(input.id, input.proofHash);
      if (!enabled(current.provider)) throw socialFailure();
      const mode = await repository.mode(current);
      if (body.mode !== mode) throw new HttpError(409, 'SOCIAL_CHANGED', 'La cuenta cambió. Volvé a iniciar el acceso.');
      input.mode = mode;
      if (mode === 'signup') {
        const account = credentials({ email: current.email, password: body.password, firstName: body.firstName, lastName: body.lastName, accountType: body.accountType }, true);
        Object.assign(input, { firstName: account.firstName, lastName: account.lastName, accountType: account.accountType ?? 'student', passwordHash: await hashPassword(account.password) });
      } else if (mode === 'link') {
        if (await authRepository.consumeRate(rateKey(config.secret, `social-link:${current.email}`), 10, 900))
          throw new HttpError(429, 'RATE_LIMITED', 'Hubo demasiados intentos. Esperá unos minutos.');
        const candidate = credentials({ email: current.email, password: body.password });
        const account = await authRepository.findCredentials(candidate.email);
        const matches = await verifyPassword(candidate.password, account?.passwordHash ?? dummyPasswordHash);
        if (!account?.active || !matches) throw new HttpError(401, 'INVALID_CREDENTIALS', 'La contraseña de ExpoTec no es correcta.');
        Object.assign(input, { accountId: account.id, expectedPasswordHash: account.passwordHash });
      }
      const refreshToken = await newRefreshToken(config);
      const result = await repository.complete(input, tokenHash(refreshToken), new Date(Date.now() + config.sessionSeconds * 1000));
      return { user: result.user, accessToken: await accessToken(config, result.user.id, result.sessionId), refreshToken, tokenType: 'Bearer', expiresIn: config.accessSeconds };
    },
  };
}
