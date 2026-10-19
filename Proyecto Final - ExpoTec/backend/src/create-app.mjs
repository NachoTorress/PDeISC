import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { HttpError } from './lib/errors.mjs';
import { createAuthService } from './services/auth.mjs';
import { authRoutes, adminRoutes } from './routes/auth.mjs';
import { objectBody } from './validators/auth.mjs';
import { spacesRoutes } from './routes/spaces.mjs';
import { projectsRoutes } from './routes/projects.mjs';
import { inventoryRoutes } from './routes/inventory.mjs';

export function createApp(repository, config, logger = console, app = express(), spacesRepository, projectsRepository, inventoryRepository) {
  app.disable('x-powered-by');
  // Solo Vercel es el proxy de confianza; en ejecución local no se aceptan IP reenviadas.
  if (config.onVercel) app.set('trust proxy', 1);
  app.use((req, res, next) => {
    req.requestId = randomUUID();
    res.set({ 'X-Request-Id': req.requestId, 'Cache-Control': 'no-store' });
    next();
  });
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.origins.includes(origin)) return callback(null, true);
      callback(new HttpError(403, 'ORIGIN_FORBIDDEN', 'Ese origen no está autorizado.'));
    },
    credentials: true,
    methods: ['POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Retry-After', 'X-Request-Id'], maxAge: 600,
  }));
  app.use('/api/spaces', express.json({ limit: '128kb' }));
  app.use('/api/projects', express.json({ limit: '64kb' }));
  app.use(express.json({ limit: '16kb' }));
  app.post('/api/health', (req, res) => {
    objectBody(req.body, []);
    res.json({ status: 'ok', service: 'expotec-api' });
  });
  app.post('/api/health/ready', async (req, res) => {
    objectBody(req.body, []);
    await repository.ready();
    res.json({ status: 'ok', database: 'connected' });
  });
  const service = createAuthService(repository, config);
  app.use('/api/auth', authRoutes(repository, service, config));
  app.use('/api/admin', adminRoutes(repository, service));
  if (spacesRepository) app.use('/api/spaces', spacesRoutes(spacesRepository, repository, service, config));
  if (projectsRepository) app.use('/api/projects', projectsRoutes(projectsRepository, repository, service, config));
  if (inventoryRepository) app.use('/api/inventory', inventoryRoutes(inventoryRepository, repository, service, config));
  app.use((req, res, next) => next(new HttpError(404, 'NOT_FOUND', 'No encontramos esa operación.')));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    let status = 500, code = 'INTERNAL_ERROR', message = 'No pudimos completar la operación.', fields;
    if (error instanceof HttpError) ({ status, code, message, fields } = error);
    else if (error.type === 'entity.parse.failed') {
      status = 400; code = 'INVALID_JSON'; message = 'El cuerpo debe contener JSON válido.';
    } else if (error.type === 'entity.too.large') {
      status = 413; code = 'BODY_TOO_LARGE'; message = `La solicitud supera los ${Math.round(error.limit / 1024)} KB permitidos.`;
    } else if (['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'PROTOCOL_CONNECTION_LOST', 'ER_CON_COUNT_ERROR'].includes(error.code)) {
      status = 503; code = 'DATABASE_UNAVAILABLE'; message = 'La base no está disponible. Probá de nuevo más tarde.';
    }
    if (status >= 500) logger.error({ requestId: req.requestId, code: error.code ?? code });
    res.status(status).json({ error: { code, message, ...(fields ? { fields } : {}) }, requestId: req.requestId });
  });
  return app;
}
