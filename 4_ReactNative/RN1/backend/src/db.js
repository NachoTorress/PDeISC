import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({ ...config.mysql, connectionLimit: 10, waitForConnections: true });

// Cada llamada libera su conexión automáticamente. Las transacciones la liberan en finally.
export async function transaction(action) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await action(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
