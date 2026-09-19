import dotenv from 'dotenv';

dotenv.config();

const requiredVariables = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];

for (const variable of requiredVariables) {
  if (!process.env[variable]) {
    throw new Error(`Falta configurar la variable de entorno ${variable}`);
  }
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME,
  },
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '2h',
  saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
};

