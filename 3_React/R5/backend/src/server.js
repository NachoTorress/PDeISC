import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';

const server = app.listen(env.port, () => {
  console.log(`API escuchando en http://localhost:${env.port}/api`);
});

async function shutdown(signal) {
  console.log(`Recibida senal ${signal}. Cerrando servidor y conexiones...`);

  server.close(async () => {
    await pool.end();
    console.log('Pool de MySQL cerrado correctamente.');
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

