import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { pool } from './db.js';
import { localAuth } from './localAuth.js';
import { oauth } from './oauth.js';
import { closeLogs, errorFields, logger, requestLogger } from './logger.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');
app.use(requestLogger);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ exposedHeaders: ['X-Request-ID'] }));
app.use(express.json({ limit: '32kb' }));
app.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false,
  skip: (req) => req.path === '/oauth/device-poll' }));
app.use('/auth/oauth/device-poll', rateLimit({ windowMs: 60 * 1000, limit: 30, standardHeaders: 'draft-7', legacyHeaders: false }));
app.use('/auth', localAuth);
app.use('/auth/oauth', oauth);

app.get('/', (req, res) => res.json({ service: 'api', status: 'ok' }));

app.use((error, req, res, next) => {
  // Los errores de parseo pueden incluir el cuerpo recibido en error.message.
  const details = errorFields(error);
  delete details.errorMessage;
  if (res.headersSent) {
    logger.error('http.error_after_headers', { requestId: req.requestId, ...details });
    return next(error);
  }
  const status = error.status || (error.code === 'ER_DUP_ENTRY' ? 409 : 500);
  logger[status >= 500 ? 'error' : 'warn']('http.error', {
    requestId: req.requestId, method: req.method, path: req.path, status, ...details
  });
  res.status(status).json({
    error: status >= 500 ? 'Ocurrió un error. Intentá de nuevo.' : error.message,
    code: error.code,
    requestId: req.requestId
  });
});

const server = app.listen(config.port, '127.0.0.1', () => {
  logger.info('server.started', { port: config.port });
});
server.on('error', (error) => {
  logger.error('server.listen_failed', { port: config.port, ...errorFields(error) });
  process.exitCode = 1;
  void closeLogs();
});
let closing = false;
async function shutdown(signal) {
  if (closing) return;
  closing = true;
  logger.info('server.stopping', { signal });
  try {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await pool.end();
    logger.info('server.stopped', { signal });
  } catch (error) {
    logger.error('server.shutdown_failed', { signal, ...errorFields(error) });
    process.exitCode = 1;
  } finally {
    await closeLogs();
  }
}
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
