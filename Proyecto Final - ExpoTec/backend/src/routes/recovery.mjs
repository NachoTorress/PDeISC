/**
 * Rutas de recuperación de contraseña por correo.
 *
 * | Método | Ruta                          | Descripción                                               |
 * | ------ | ----------------------------- | --------------------------------------------------------- |
 * | GET    | /api/auth/recovery            | Indica si la recuperación está configurada ({ enabled }). |
 * | POST   | /api/auth/recovery/request    | Envía el enlace de un solo uso (respuesta 202 genérica).  |
 * | POST   | /api/auth/recovery/complete   | Cambia la contraseña con el token y cierra las sesiones.  |
 *
 * La respuesta de `request` es la misma exista o no el correo, para no revelar
 * qué direcciones están registradas.
 */
import { Router } from 'express';
import { recoveryEmail, recoveryPassword } from '../validators/recovery.mjs';
import { rateLimit } from '../middleware/auth.mjs';
import { HttpError } from '../lib/errors.mjs';

/**
 * Crea el enrutador de recuperación.
 *
 * @param {object} authRepository Repositorio de cuentas (límite de solicitudes).
 * @param {object | null} service Servicio de recuperación; null si falta configurar SMTP.
 * @param {object} config Configuración del servidor.
 * @returns {import('express').Router}
 */
export function recoveryRoutes(authRepository, service, config) {
  const router = Router();
  router.get('/', (req, res) => {
    res.json({ enabled: Boolean(service) });
  });

  // Sin SMTP configurado, las operaciones responden 503 en lugar de fallar más adelante.
  router.use((req, res, next) => {
    if (!service) throw new HttpError(503, 'RECOVERY_UNAVAILABLE', 'La recuperación por correo todavía no está habilitada.');
    next();
  });
  router.post('/request',
    rateLimit(authRepository, config, { scope: 'reset-ip', limit: 15, seconds: 3600 }),
    rateLimit(authRepository, config, { scope: 'reset-email', limit: 3, seconds: 3600, byEmail: true }),
    async (req, res) => {
      const result = await service.request(recoveryEmail(req.body));
      res.status(202).json(result);
    });
  router.post('/complete',
    rateLimit(authRepository, config, { scope: 'reset-complete', limit: 10, seconds: 900 }),
    async (req, res) => {
      const result = await service.complete(recoveryPassword(req.body));
      // Cambiar la contraseña revoca las sesiones: también se borra la cookie web.
      res.clearCookie(config.production ? '__Secure-expotec-refresh' : 'expotec-refresh',
        { httpOnly: true, secure: config.production, sameSite: 'strict', path: '/api/auth/browser' });
      res.json(result);
    });
  return router;
}
