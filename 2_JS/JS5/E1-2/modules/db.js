/**
 * db.js
 * Crea y exporta el pool de conexiones a MySQL.
 * De dónde viene: usa las credenciales definidas en config.js.
 * A dónde va: es consumido por alumnosModel.js para ejecutar queries.
 */

import mysql from 'mysql2/promise';
import { DB_CONFIG } from './config.js';

export const pool = mysql.createPool({
  ...DB_CONFIG,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
