/** Conexión con la base de datos MySQL (TiDB en producción) mediante mysql2. */
import mysql from 'mysql2';
import { attachDatabasePool } from '@vercel/functions';
import { readDatabaseConfig } from './env.mjs';

/**
 * Crea el pool de conexiones a partir de las variables de entorno.
 * Todas las sesiones usan UTC para que las fechas no dependan del servidor.
 * @param {NodeJS.ProcessEnv} [env] Variables de entorno.
 * @returns {import('mysql2/promise').Pool}
 */
export function createDatabase(env = process.env) {
  const pool = mysql.createPool(readDatabaseConfig(env));
  pool.on('connection', connection => {
    connection.query("SET SESSION time_zone = '+00:00'", error => {
      if (error) connection.destroy();
    });
  });
  if (env.VERCEL === '1') attachDatabasePool(pool);
  return pool.promise();
}

/**
 * Ejecuta `work` dentro de una transacción: confirma si termina bien y revierte ante cualquier error.
 * @param {import('mysql2/promise').Pool} pool Pool de conexiones.
 * @param {(db: import('mysql2/promise').PoolConnection) => Promise<T>} work Operaciones a ejecutar.
 * @returns {Promise<T>} Resultado de `work`.
 * @template T
 */
export async function transaction(pool, work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try { await connection.rollback(); } catch { /* La conexión ya puede estar cerrada. */ }
    throw error;
  } finally {
    connection.release();
  }
}
