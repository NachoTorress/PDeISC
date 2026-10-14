import app, { config, pool } from './app.mjs';

const server = app.listen(config.port, () => {
  console.log(`ExpoTec API disponible en http://localhost:${config.port}`);
});
async function shutdown() {
  server.close(async () => { await pool.end(); process.exit(0); });
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
