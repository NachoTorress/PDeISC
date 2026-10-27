/**
 * Construcción de la aplicación Express de la API de ExpoTec.
 *
 * Recibe los repositorios por parámetro (inyección de dependencias) para que
 * las pruebas puedan reemplazar la base de datos por versiones en memoria.
 * Aplica seguridad común (Helmet, CORS, límites de tamaño), monta las rutas
 * REST de cada dominio y centraliza el manejo de errores en formato JSON:
 *
 *     { "error": { "code": "...", "message": "...", "fields": { ... } }, "requestId": "..." }
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { HttpError } from './lib/errors.mjs';
import { createAuthService } from './services/auth.mjs';
import { authRoutes, adminRoutes } from './routes/auth.mjs';
import { spacesRoutes } from './routes/spaces.mjs';
import { projectsRoutes } from './routes/projects.mjs';
import { inventoryRoutes } from './routes/inventory.mjs';
import { loansRoutes } from './routes/loans.mjs';
import { galleryRoutes } from './routes/gallery.mjs';
import { createSocialService } from './services/social.mjs';
import { uploadsRoutes } from './routes/uploads.mjs';
import { recoveryRoutes } from './routes/recovery.mjs';
import { createRecoveryService } from './services/recovery.mjs';
import { createRecoveryMailer } from './services/recovery-mail.mjs';
import { legacyRoutesMiddleware } from './middleware/legacy-routes.mjs';

/** Códigos de error de red de mysql2 que significan "base no disponible" (503). */
const databaseDownCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR'];

/**
 * Crea la aplicación Express con todas las rutas.
 * Los repositorios opcionales permiten probar un dominio sin montar los demás.
 *
 * @param {object} repository Repositorio de cuentas y sesiones (obligatorio).
 * @param {object} config Configuración leída por `readConfig`.
 * @param {Console} [logger] Destino de los errores internos.
 * @param {import('express').Express} [app] Instancia de Express a configurar.
 * @param {object} [spacesRepository] Repositorio de espacios.
 * @param {object} [projectsRepository] Repositorio de proyectos.
 * @param {object} [inventoryRepository] Repositorio de inventario.
 * @param {object} [loansRepository] Repositorio de préstamos.
 * @param {object} [galleryRepository] Repositorio de galería.
 * @param {object} [socialRepository] Repositorio de accesos sociales.
 * @param {Function} [providerExchange] Intercambio OAuth simulado (pruebas).
 * @param {object} [uploadsRepository] Repositorio de imágenes subidas.
 * @param {object} [uploadStorage] Almacenamiento simulado (pruebas).
 * @param {object} [recoveryRepository] Repositorio de recuperación de contraseña.
 * @param {object} [recoveryMailer] Envío de correo simulado (pruebas).
 * @returns {import('express').Express}
 */
export function createApp(repository, config, logger = console, app = express(), spacesRepository, projectsRepository, inventoryRepository, loansRepository, galleryRepository, socialRepository, providerExchange, uploadsRepository, uploadStorage, recoveryRepository, recoveryMailer) {
  app.disable('x-powered-by');
  // Solo Vercel es el proxy de confianza; en ejecución local no se aceptan IP reenviadas.
  if (config.onVercel) app.set('trust proxy', 1);

  // Identificador por solicitud para rastrear errores sin registrar datos personales.
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set({ 'X-Request-Id': req.requestId, 'Cache-Control': 'no-store' });
    next();
  });
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      // Sin encabezado Origin (app Android, curl) no aplica CORS; los navegadores deben estar autorizados.
      if (!origin || config.origins.includes(origin)) return callback(null, true);
      callback(new HttpError(403, 'ORIGIN_FORBIDDEN', 'Ese origen no está autorizado.'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Retry-After', 'X-Request-Id', 'Deprecation'], maxAge: 600,
  }));

  // Límites de tamaño del cuerpo JSON: los planos y propuestas son más grandes que el resto.
  app.use('/api/spaces', express.json({ limit: '128kb' }));
  app.use('/api/projects', express.json({ limit: '64kb' }));
  app.use(express.json({ limit: '16kb' }));

  // Traduce las rutas POST de la APK 0.4.0 a su equivalente REST.
  app.use(legacyRoutesMiddleware);

  // Salud del servicio: /health no consulta la base; /health/ready sí.
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'expotec-api' });
  });
  app.get('/api/health/ready', async (req, res) => {
    await repository.ready();
    res.json({ status: 'ok', database: 'connected' });
  });

  const service = createAuthService(repository, config);
  const recovery = recoveryRepository && config.recovery
    ? createRecoveryService(recoveryRepository, recoveryMailer ?? createRecoveryMailer(config.recovery), config.recovery, logger)
    : null;
  app.use('/api/auth/recovery', recoveryRoutes(repository, recovery, config));
  const social = socialRepository ? createSocialService(socialRepository, repository, config, providerExchange) : undefined;
  app.use('/api/auth', authRoutes(repository, service, config, social));
  app.use('/api/admin', adminRoutes(repository, service, config));
  if (spacesRepository) app.use('/api/spaces', spacesRoutes(spacesRepository, repository, service, config));
  if (projectsRepository) app.use('/api/projects', projectsRoutes(projectsRepository, repository, service, config));
  if (inventoryRepository) app.use('/api/inventory', inventoryRoutes(inventoryRepository, repository, service, config));
  if (loansRepository) app.use('/api/loans', loansRoutes(loansRepository, repository, service, config));
  if (galleryRepository) app.use('/api/gallery', galleryRoutes(galleryRepository, repository, service, config));
  if (uploadsRepository) app.use('/api/uploads', uploadsRoutes(uploadsRepository, repository, service, config, uploadStorage));

  // Ruta inexistente: 404 con el mismo formato de error que el resto.
  app.use((req, res, next) => next(new HttpError(404, 'NOT_FOUND', 'No encontramos esa operación.')));

  // Manejador central de errores: traduce cada excepción a un código HTTP y un mensaje claro.
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    let status = 500, code = 'INTERNAL_ERROR', message = 'No pudimos completar la operación.', fields;
    if (error instanceof HttpError) ({ status, code, message, fields } = error);
    else if (error.type === 'entity.parse.failed') {
      status = 400; code = 'INVALID_JSON'; message = 'El cuerpo debe contener JSON válido.';
    } else if (error.type === 'entity.too.large') {
      status = 413; code = 'BODY_TOO_LARGE'; message = `La solicitud supera los ${Math.round(error.limit / 1024)} KB permitidos.`;
    } else if (databaseDownCodes.includes(error.code)) {
      status = 503; code = 'DATABASE_UNAVAILABLE'; message = 'La base no está disponible. Probá de nuevo más tarde.';
    }
    // Solo se registran los errores internos, sin cuerpos ni datos de la cuenta.
    if (status >= 500) logger.error({ requestId: req.requestId, code: error.code ?? code });
    res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}) }, requestId: req.requestId });
  });
  return app;
}
