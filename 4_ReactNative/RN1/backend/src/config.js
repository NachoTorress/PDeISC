import 'dotenv/config';

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Falta configurar ${name}`);
  return value;
};

export const config = {
  port: Number(process.env.PORT || 4000),
  baseUrl: required('APP_BASE_URL').replace(/\/$/, ''),
  scheme: process.env.FRONTEND_SCHEME || 'accesoexpo',
  webBaseUrl: (process.env.WEB_BASE_URL || 'http://localhost:8084').replace(/\/$/, ''),
  jwtSecret: required('JWT_SECRET'),
  hmacSecret: required('TOKEN_HMAC_SECRET'),
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'acceso_usuarios'
  }
};

if (config.jwtSecret.length < 32 || config.hmacSecret.length < 32) {
  throw new Error('JWT_SECRET y TOKEN_HMAC_SECRET deben tener al menos 32 caracteres');
}
