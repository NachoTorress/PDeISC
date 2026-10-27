/**
 * Servidor HTTP local (`npm run dev` / `npm start`).
 * Escucha en el puerto configurado (PORT, 3001 por defecto) y cierra el pool de
 * la base de datos al recibir SIGINT o SIGTERM.
 */
import app, { config, pool } from './app.mjs';

const server = app.listen(config.port, () => {
  console.log(`ExpoTec API disponible en http://localhost:${config.port}`);
});
/** Cierre ordenado: deja de aceptar conexiones y libera la base de datos. */
async function shutdown() {
  server.close(async () => { await pool.end(); process.exit(0); });
}
process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
