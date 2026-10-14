import { HttpError, unauthorized } from '../lib/errors.mjs';
import { rateKey } from '../services/crypto.mjs';

export function requireSession(service) {
  return async (req, res, next) => {
    const header = req.get('Authorization') ?? '';
    const match = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(header);
    if (!match || header.length > 2048) throw unauthorized();
    req.auth = await service.authenticate(match[1]);
    next();
  };
}

export function requireAdmin(req, res, next) {
  if (!req.auth.user.roles.includes('admin'))
    throw new HttpError(403, 'FORBIDDEN', 'Necesitás permiso de administrador.');
  next();
}

export function rateLimit(repository, config, { scope, limit, seconds, byEmail = false }) {
  return async (req, res, next) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase().slice(0, 254) : '';
    const key = rateKey(config.secret, `${scope}:${byEmail ? email : req.ip}`);
    const retryAfter = await repository.consumeRate(key, limit, seconds);
    if (retryAfter) {
      res.set('Retry-After', String(retryAfter));
      throw new HttpError(429, 'RATE_LIMITED', 'Hubo demasiados intentos. Esperá unos minutos y probá de nuevo.');
    }
    next();
  };
}
