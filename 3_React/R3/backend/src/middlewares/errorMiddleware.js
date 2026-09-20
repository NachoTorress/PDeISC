export function notFound(req, _res, next) {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  console.error('[API Error]:', error);

  const status = error.status ?? 500;
  let message = error.message;

  if (status === 500) {
    if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      message = 'No se pudo conectar a la base de datos MySQL (ECONNREFUSED). Verificá que el servicio de MySQL esté iniciado en el puerto 3306.';
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      message = 'La base de datos "user_system_db" no existe. Ejecutá el archivo src/database/schema.sql en MySQL para crearla.';
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      message = 'Acceso denegado a MySQL. Verificá el usuario DB_USER y la contraseña DB_PASSWORD en backend/.env.';
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      message = 'Las tablas no existen en MySQL. Ejecutá el archivo src/database/schema.sql en MySQL.';
    } else {
      message = 'Error interno del servidor.';
    }
  }

  res.status(status).json({
    message,
    details: error.details ?? null,
  });
}

