import { Router } from 'express';
import { objectBody } from '../validators/auth.mjs';
import { recoveryEmail, recoveryPassword } from '../validators/recovery.mjs';
import { rateLimit } from '../middleware/auth.mjs';
import { HttpError } from '../lib/errors.mjs';

export function recoveryRoutes(authRepository, service, config) {
  const router = Router();
  router.post('/query', (req, res) => {
    objectBody(req.body, []);
    res.json({ enabled: Boolean(service) });
  });
  router.use((req, res, next) => {
    if (!service) throw new HttpError(503, 'RECOVERY_UNAVAILABLE', 'La recuperación por correo todavía no está habilitada.');
    next();
  });
  router.post('/request', rateLimit(authRepository, config, { scope: 'reset-ip', limit: 15, seconds: 3600 }), rateLimit(authRepository, config, { scope: 'reset-email', limit: 3, seconds: 3600, byEmail: true }), async (req, res) => {
    const result = await service.request(recoveryEmail(req.body));
    res.status(202).json(result);
  });
  router.post('/complete', rateLimit(authRepository, config, { scope: 'reset-complete', limit: 10, seconds: 900 }), async (req, res) => {
    const result = await service.complete(recoveryPassword(req.body));
    res.clearCookie(config.production ? '__Secure-expotec-refresh' : 'expotec-refresh', { httpOnly: true, secure: config.production, sameSite: 'strict', path: '/api/auth/browser' });
    res.json(result);
  });
  return router;
}
