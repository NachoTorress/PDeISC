/** Aplica las migraciones SQL pendientes (`npm run db:migrate`). */
import { createDatabase } from '../src/config/database.mjs';
import { migrate } from './migrations.mjs';

const pool = createDatabase();
try {
  const files = await migrate(pool);
  console.log(`Esquema actualizado: ${files.join(', ')}.`);
} catch (error) {
  console.error(`No se pudo migrar (${error.code ?? 'MIGRATION_ERROR'}). Revisá la configuración y el esquema.`);
  process.exitCode = 1;
} finally { await pool.end(); }
