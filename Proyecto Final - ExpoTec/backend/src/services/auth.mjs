import { HttpError, unauthorized } from '../lib/errors.mjs';
import { hashPassword, verifyPassword, dummyPasswordHash, newRefreshToken, tokenHash, accessToken, verifyAccessToken, verifyRefreshToken } from './crypto.mjs';

export function createAuthService(repository, config) {
  async function response(result, refreshToken) {
    return {
      user: result.user,
      accessToken: await accessToken(config, result.user.id, result.sessionId),
      refreshToken, tokenType: 'Bearer', expiresIn: config.accessSeconds,
    };
  }
  const expiration = () => new Date(Date.now() + config.sessionSeconds * 1000);
  async function checkRefresh(token) {
    try { await verifyRefreshToken(config, token); } catch { throw unauthorized(); }
  }
  return {
    async register(input) {
      const token = await newRefreshToken(config);
      const passwordHash = await hashPassword(input.password);
      const { password, ...account } = input;
      const result = await repository.register({ ...account, passwordHash }, tokenHash(token), expiration());
      return response(result, token);
    },
    async login(input) {
      const account = await repository.findCredentials(input.email);
      const matches = await verifyPassword(input.password, account?.passwordHash ?? dummyPasswordHash);
      if (!account || !account.active || !matches)
        throw new HttpError(401, 'INVALID_CREDENTIALS', 'El correo o la contraseña no son correctos.');
      const token = await newRefreshToken(config);
      return response(await repository.openSession(account.id, tokenHash(token), expiration()), token);
    },
    async refresh(token) {
      await checkRefresh(token);
      const next = await newRefreshToken(config);
      return response(await repository.rotate(tokenHash(token), tokenHash(next)), next);
    },
    async authenticate(token) {
      let claims;
      try { claims = await verifyAccessToken(config, token); } catch { throw unauthorized(); }
      if (typeof claims.sub !== 'string' || typeof claims.sid !== 'string') throw unauthorized();
      const user = await repository.session(claims.sub, claims.sid);
      return { user, sessionId: claims.sid };
    },
    async logout(token) {
      await checkRefresh(token);
      await repository.logout(tokenHash(token));
    },
  };
}
