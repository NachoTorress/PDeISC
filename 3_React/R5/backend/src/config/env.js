import dotenv from 'dotenv';

dotenv.config();

const rawOrigins = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
const clientOrigins = rawOrigins.split(',').map((origin) => origin.trim());

export const env = {
  port: Number(process.env.PORT ?? 3001),
  clientOrigins,
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'user_system_r5_db',
  },
  jwtSecret: process.env.JWT_SECRET ?? 'supersecretjwtkey_r5_change_me_in_production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
  oauth: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUrl: process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/auth/github/callback',
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      callbackUrl: process.env.DISCORD_CALLBACK_URL || 'http://localhost:3001/api/auth/discord/callback',
    },
  },
};
