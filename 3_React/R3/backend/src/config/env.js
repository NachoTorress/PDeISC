import dotenv from 'dotenv';

dotenv.config();

const rawOrigins = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173,http://localhost:5174';
const clientOrigins = rawOrigins.split(',').map((origin) => origin.trim());

export const env = {
  port: Number(process.env.PORT ?? 3001),
  clientOrigins,
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'user_system_db',
  },
  jwtSecret: process.env.JWT_SECRET ?? 'supersecretjwtkey_change_me_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
};
