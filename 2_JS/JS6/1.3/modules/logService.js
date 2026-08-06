/**
 * modules/logService.js
 * -------------------------------------------------------
 * De donde viene: modules/routes/pdfRoutes.js llama a
 *                  registrarDescarga() cada vez que alguien
 *                  descarga un PDF; modules/routes/authRoutes.js
 *                  llama a registrarLoginAdmin() cada vez que
 *                  un administrador inicia sesion con exito.
 * A donde va:     escribe/lee las tablas "log_descargas" y
 *                  "log_logins_admin" en MySQL. Las lecturas
 *                  las usa modules/routes/logRoutes.js para
 *                  mostrarlas en el panel de administracion.
 * Que hace:       centraliza el registro de auditoria basico
 *                  del sistema (quien descarga que, quien entra
 *                  y cuando).
 * -------------------------------------------------------
 */

import pool from './db.js';

/**
 * Registra una descarga de PDF en el log.
 * @param {{tipo: string, detalle?: string}} datos
 */
export async function registrarDescarga({ tipo, detalle }) {
    await pool.query(
        'INSERT INTO log_descargas (tipo, detalle) VALUES (?, ?)',
        [tipo, detalle || null]
    );
}

/**
 * Registra un login exitoso de administrador en el log.
 * @param {string} usuario
 */
export async function registrarLoginAdmin(usuario) {
    await pool.query('INSERT INTO log_logins_admin (usuario) VALUES (?)', [usuario]);
}

/**
 * Devuelve el historial de descargas, mas recientes primero.
 * @returns {Promise<Array>}
 */
export async function obtenerLogsDescargas() {
    const [filas] = await pool.query(
        'SELECT id, tipo, detalle, fecha FROM log_descargas ORDER BY fecha DESC LIMIT 200'
    );
    return filas;
}

/**
 * Devuelve el historial de logins de administrador, mas recientes primero.
 * @returns {Promise<Array>}
 */
export async function obtenerLogsLogins() {
    const [filas] = await pool.query(
        'SELECT id, usuario, fecha FROM log_logins_admin ORDER BY fecha DESC LIMIT 200'
    );
    return filas;
}
