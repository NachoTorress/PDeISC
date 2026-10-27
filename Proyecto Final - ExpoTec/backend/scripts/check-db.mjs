/** Comprueba la conexión con la base (`npm run db:check`). */
import { createDatabase } from '../src/config/database.mjs';

const pool = createDatabase();
try {
  const [rows] = await pool.execute('SELECT VERSION() AS version');
  console.log(`Conexión comprobada. Versión: ${rows[0].version}`);
} catch (error) {
  console.error(`No se pudo conectar (${error.code ?? 'DATABASE_ERROR'}). Revisá las variables DB_ y TLS.`);
  process.exitCode = 1;
} finally { await pool.end(); }
