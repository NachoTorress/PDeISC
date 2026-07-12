/**
 * modules/db.js
 * -------------------------------------------------------
 * De donde viene: es el punto unico de conexion a MySQL,
 *                  lee las credenciales desde las variables
 *                  de entorno (.env).
 * A donde va:     lo importan modules/scoreService.js y
 *                  cualquier otro modulo que necesite
 *                  ejecutar consultas SQL.
 * Que hace:       expone un "pool" de conexiones reutilizable
 *                  (mas eficiente que abrir/cerrar conexion
 *                  en cada consulta).
 * -------------------------------------------------------
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3310,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'Score',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

/**
 * Verifica que la conexion con MySQL este funcionando.
 * Se llama una unica vez al levantar el servidor (server.js)
 * para avisar por consola si algo esta mal configurado.
 */
export async function verificarConexion() {
    try {
        const conexion = await pool.getConnection();
        await conexion.ping();
        conexion.release();
        console.log('✅ Conexion a MySQL exitosa (Base de datos: Score)');
    } catch (error) {
        console.error('❌ No se pudo conectar a MySQL:', error.message);
        console.error('   Revisa tu archivo .env y que MySQL este corriendo.');
    }
}

export default pool;
