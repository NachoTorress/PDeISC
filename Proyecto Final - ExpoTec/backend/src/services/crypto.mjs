/**
 * Criptografía: hash de contraseñas con scrypt y emisión/verificación de JWT.
 * Token de acceso: JWT HS256 de 15 minutos con la cuenta (`sub`) y la sesión (`sid`).
 * Token de renovación: JWT HS256 de 30 días con identificador aleatorio; en la
 * base solo se guarda su hash SHA-256.
 */
import { randomBytes, scrypt, timingSafeEqual, createHash, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
import { SignJWT, jwtVerify } from 'jose';

const derive = promisify(scrypt);
const parameters = { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 };
/** Hash scrypt con sal aleatoria; formato `scrypt$N$r$p$sal$hash`. */
export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = await derive(password, salt, 64, parameters);
  return `scrypt$${parameters.N}$8$1$${salt}$${hash.toString('hex')}`;
}

/** Compara la contraseña con el hash en tiempo constante. */
export async function verifyPassword(password, encoded) {
  const [algorithm, n, r, p, salt, hex] = (encoded ?? '').split('$');
  if (algorithm !== 'scrypt' || n !== String(parameters.N) || r !== '8' || p !== '1' ||
      !/^[a-f0-9]{32}$/.test(salt ?? '') || !/^[a-f0-9]{128}$/.test(hex ?? '')) return false;
  const hash = await derive(password, salt, 64, parameters);
  return timingSafeEqual(hash, Buffer.from(hex, 'hex'));
}

// Se compara también cuando el correo no existe para no dar una respuesta inmediata distinta.
export const dummyPasswordHash = `scrypt$${parameters.N}$8$1$${'0'.repeat(32)}$${'0'.repeat(128)}`;
/** SHA-256 de un token: lo que se guarda en la base en lugar del token. */
export const tokenHash = token => createHash('sha256').update(token).digest('hex');
/** Clave anónima (HMAC) para los contadores del límite de solicitudes. */
export const rateKey = (secret, value) => createHmac('sha256', secret).update(value).digest('hex');

/** Firma el token de acceso de una sesión. */
export async function accessToken(config, userId, sessionId) {
  return new SignJWT({ sid: sessionId })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer(config.issuer).setAudience(config.audience)
    .setSubject(userId).setIssuedAt().setExpirationTime(`${config.accessSeconds}s`)
    .sign(new TextEncoder().encode(config.secret));
}

/** Firma un token de renovación nuevo. */
export async function newRefreshToken(config) {
  return new SignJWT({ tokenUse: 'refresh' })
    .setProtectedHeader({ alg: 'HS256', typ: 'refresh+jwt' })
    .setIssuer(config.issuer).setAudience(`${config.audience}:refresh`)
    .setJti(randomBytes(32).toString('base64url'))
    .setIssuedAt().setExpirationTime(`${config.sessionSeconds}s`)
    .sign(new TextEncoder().encode(config.secret));
}

/** Verifica firma, emisor, audiencia y tipo del token de renovación. */
export async function verifyRefreshToken(config, token) {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(config.secret), {
    algorithms: ['HS256'], issuer: config.issuer, audience: `${config.audience}:refresh`,
    requiredClaims: ['jti', 'iat', 'exp'], typ: 'refresh+jwt',
  });
  if (payload.tokenUse !== 'refresh' || typeof payload.jti !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(payload.jti))
    throw new Error('INVALID_REFRESH');
}

/** Verifica el token de acceso y devuelve sus datos. */
export async function verifyAccessToken(config, token) {
  const { payload } = await jwtVerify(token, new TextEncoder().encode(config.secret), {
    algorithms: ['HS256'], issuer: config.issuer, audience: config.audience,
    requiredClaims: ['sub', 'sid', 'iat', 'exp'], typ: 'JWT',
  });
  return payload;
}
