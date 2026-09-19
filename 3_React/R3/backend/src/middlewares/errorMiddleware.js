export function notFound(req, _res, next) {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status ?? 500;

  res.status(status).json({
    message: status === 500 ? 'Error interno del servidor.' : error.message,
    details: error.details ?? null,
  });
}

