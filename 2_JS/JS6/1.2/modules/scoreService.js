/**
 * modules/scoreService.js
 * -------------------------------------------------------
 * De donde viene: lo llaman las rutas de
 *                  modules/routes/scoreRoutes.js con datos
 *                  ya validados.
 * A donde va:     ejecuta las consultas contra MySQL usando
 *                  el pool de modules/db.js y devuelve los
 *                  resultados a quien lo invoco.
 * Que hace:       encapsula todo el CRUD de la tabla "score"
 *                  (crear, leer, actualizar, borrar).
 * -------------------------------------------------------
 */

import pool from './db.js';

/**
 * Inserta un nuevo puntaje en la base de datos.
 * @param {{nombre: string, tiempo: number, puntos: number}} datos
 * @returns {Promise<number>} el id insertado
 */
export async function crearScore({ nombre, tiempo, puntos }) {
    const [resultado] = await pool.query(
        'INSERT INTO score (nombre, tiempo, puntos) VALUES (?, ?, ?)',
        [nombre, tiempo, puntos]
    );
    return resultado.insertId;
}

/**
 * Devuelve todos los puntajes ordenados de mayor a menor.
 * @returns {Promise<Array>}
 */
export async function obtenerScores() {
    const [filas] = await pool.query(
        'SELECT id, nombre, tiempo, puntos, fecha FROM score ORDER BY puntos DESC, tiempo ASC'
    );
    return filas;
}

/**
 * Busca un puntaje puntual por id.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export async function obtenerScorePorId(id) {
    const [filas] = await pool.query('SELECT * FROM score WHERE id = ?', [id]);
    return filas[0] || null;
}

/**
 * Actualiza el nombre y/o los puntos de un registro existente.
 * @param {number} id
 * @param {{nombre: string, puntos: number}} datos
 * @returns {Promise<boolean>} true si se actualizo algun registro
 */
export async function actualizarScore(id, { nombre, puntos }) {
    const [resultado] = await pool.query(
        'UPDATE score SET nombre = ?, puntos = ? WHERE id = ?',
        [nombre, puntos, id]
    );
    return resultado.affectedRows > 0;
}

/**
 * Elimina un registro de la tabla score.
 * @param {number} id
 * @returns {Promise<boolean>} true si se elimino algun registro
 */
export async function eliminarScore(id) {
    const [resultado] = await pool.query('DELETE FROM score WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
}
