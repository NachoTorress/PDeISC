import { readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { createDatabase } from '../src/config/database.mjs';

const app = parseEnv(await readFile(new URL('../.env', import.meta.url), 'utf8'));
if (!/^expotec_test_[a-z0-9_]+$/.test(app.TEST_DB_NAME ?? '') || app.DB_NAME !== 'expotec')
  throw new Error('Usá expotec y una base expotec_test_ exclusiva para pruebas.');
if (!/^[A-Za-z0-9]+\.[a-z0-9_]+$/.test(app.DB_USER ?? '') || app.DB_USER.length > 32 || !app.DB_PASSWORD)
  throw new Error('Configurá un usuario propio y su contraseña en .env.');

const pool = createDatabase({ ...process.env, DB_NAME: 'sys' });
try {
  await pool.execute('SELECT 1');
  await pool.query('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', [app.DB_NAME]);
  await pool.query('CREATE DATABASE IF NOT EXISTS ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci', [app.TEST_DB_NAME]);
  await pool.query('CREATE USER IF NOT EXISTS ? IDENTIFIED BY ?', [app.DB_USER, app.DB_PASSWORD]);
  await pool.query('GRANT SELECT, INSERT, UPDATE, DELETE ON ??.* TO ?', [app.DB_NAME, app.DB_USER]);
  console.log('Bases de aplicación y pruebas creadas. Usuario de API limitado a lectura y escritura de expotec.');
} catch (error) {
  console.error(`No se pudo preparar TiDB (${error.code ?? 'DATABASE_ERROR'}). No se muestran credenciales ni SQL privado.`);
  process.exitCode = 1;
} finally { await pool.end(); }
