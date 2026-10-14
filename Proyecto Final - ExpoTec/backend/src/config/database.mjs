import mysql from 'mysql2';
import { attachDatabasePool } from '@vercel/functions';
import { readDatabaseConfig } from './env.mjs';

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
