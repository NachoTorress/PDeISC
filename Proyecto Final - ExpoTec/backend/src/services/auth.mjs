/**
 * Servicio de autenticación: registro, ingreso, renovación, validación del token
 * de acceso y cierre de sesión. Usa JWT firmados (HS256) y rotación de tokens de renovación.
 */
import { HttpError, unauthorized } from '../lib/errors.mjs';
import { hashPassword, verifyPassword, dummyPasswordHash, newRefreshToken, tokenHash, accessToken, verifyAccessToken, verifyRefreshToken } from './crypto.mjs';

/**
 * Crea el servicio.
 * @param {object} repository Repositorio de cuentas y sesiones.
 * @param {object} config Configuración (secreto y duraciones de los tokens).
 */
export function createAuthService(repository, config) {
  /** Respuesta estándar de sesión: cuenta, token de acceso, renovación y vencimiento. */
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
    /** Crea la cuenta guardando solo el hash scrypt de la contraseña. */
    async register(input) {
      const token = await newRefreshToken(config);
      const passwordHash = await hashPassword(input.password);
      const { password, ...account } = input;
      const result = await repository.register({ ...account, passwordHash }, tokenHash(token), expiration());
      return response(result, token);
    },
    /** Ingreso con correo y contraseña; el mensaje de error no revela si el correo existe. */
    async login(input) {
      const account = await repository.findCredentials(input.email);
      const matches = await verifyPassword(input.password, account?.passwordHash ?? dummyPasswordHash);
      if (!account || !account.active || !matches)
        throw new HttpError(401, 'INVALID_CREDENTIALS', 'El correo o la contraseña no son correctos.');
      const token = await newRefreshToken(config);
      return response(await repository.openSession(account.id, tokenHash(token), expiration()), token);
    },
    /** Entrega un acceso nuevo y rota el token de renovación. */
    async refresh(token) {
      await checkRefresh(token);
      const next = await newRefreshToken(config);
      return response(await repository.rotate(tokenHash(token), tokenHash(next)), next);
    },
    /** Valida el token de acceso y que su sesión siga activa. */
    async authenticate(token) {
      let claims;
      try { claims = await verifyAccessToken(config, token); } catch { throw unauthorized(); }
      if (typeof claims.sub !== 'string' || typeof claims.sid !== 'string') throw unauthorized();
      const user = await repository.session(claims.sub, claims.sid);
      return { user, sessionId: claims.sid };
    },
    /** Revoca la sesión. */
    async logout(token) {
      await checkRefresh(token);
      await repository.logout(tokenHash(token));
    },
  };
}
