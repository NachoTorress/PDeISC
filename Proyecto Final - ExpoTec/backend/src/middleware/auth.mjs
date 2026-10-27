/**
 * Middlewares de seguridad: sesión obligatoria, permiso de administrador y
 * límite de solicitudes (protección contra fuerza bruta y abuso).
 */
import { HttpError, unauthorized } from '../lib/errors.mjs';
import { rateKey } from '../services/crypto.mjs';

/**
 * Exige un token de acceso válido en `Authorization: Bearer <token>`.
 * Deja en `req.auth` la cuenta actual con sus roles.
 * @param {object} service Servicio de autenticación.
 */
export function requireSession(service) {
  return async (req, res, next) => {
    const header = req.get('Authorization') ?? '';
    const match = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(header);
    if (!match || header.length > 2048) throw unauthorized();
    req.auth = await service.authenticate(match[1]);
    next();
  };
}

/** Permite continuar solo a cuentas con rol `admin` (si no, 403). */
export function requireAdmin(req, res, next) {
  if (!req.auth.user.roles.includes('admin'))
    throw new HttpError(403, 'FORBIDDEN', 'Necesitás permiso de administrador.');
  next();
}

/**
 * Limita los intentos por IP, por correo o por usuario dentro de una ventana de tiempo.
 * Al superar el límite responde 429 con el encabezado Retry-After.
 * @param {object} repository Repositorio que guarda los contadores en la base.
 * @param {object} config Configuración (se usa el secreto para anonimizar la clave).
 * @param {{ scope: string, limit: number, seconds: number, byEmail?: boolean, byUser?: boolean }} options
 */
export function rateLimit(repository, config, { scope, limit, seconds, byEmail = false, byUser = false }) {
  return async (req, res, next) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : '';
    const key = rateKey(config.secret, `${scope}:${byEmail ? email : byUser ? req.auth.user.id : req.ip}`);
    const retryAfter = await repository.consumeRate(key, limit, seconds);
    if (retryAfter) {
      res.set('Retry-After', String(retryAfter));
      throw new HttpError(429, 'RATE_LIMITED', 'Hubo demasiados intentos. Esperá unos minutos y probá de nuevo.');
    }
    next();
  };
}
