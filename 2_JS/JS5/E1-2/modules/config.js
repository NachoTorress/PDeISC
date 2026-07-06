/**
 * config.js
 * Configuración centralizada de la aplicación.
 * De dónde viene: es el primer archivo que se importa desde server.js y db.js.
 * A dónde va: sus valores viajan hacia la conexión MySQL y hacia app.listen().
 * Usar variables de entorno permite cambiar puerto/credenciales sin tocar código.
 */

export const SERVER_PORT = process.env.PORT || 3001;

export const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'alumnosdb',
  port: process.env.DB_PORT || 3310,
};
