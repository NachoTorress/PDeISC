/**
 * modules/wordsService.js
 * -------------------------------------------------------
 * De donde viene: reemplaza al viejo modules/words.js
 *                  (que tenia las palabras hardcodeadas).
 *                  Ahora las palabras viven en la tabla
 *                  "palabras" de MySQL.
 * A donde va:     lo usan modules/routes/wordRoutes.js
 *                  (para el juego publico, GET /api/palabra)
 *                  y modules/routes/adminWordRoutes.js
 *                  (para el CRUD del panel de administracion).
 * -------------------------------------------------------
 */

import pool from './db.js';

/**
 * Devuelve una palabra al azar desde la base de datos.
 * @returns {Promise<{id:number, palabra:string, categoria:string, pista:string}|null>}
 */
export async function obtenerPalabraAleatoria() {
    const [filas] = await pool.query(
        'SELECT id, palabra, categoria, pista FROM palabras ORDER BY RAND() LIMIT 1'
    );
    return filas[0] || null;
}

/**
 * Devuelve todas las palabras del banco, ordenadas por fecha de creacion.
 * @returns {Promise<Array>}
 */
export async function obtenerPalabras() {
    const [filas] = await pool.query(
        'SELECT id, palabra, categoria, pista, fecha_creacion FROM palabras ORDER BY fecha_creacion DESC'
    );
    return filas;
}

/**
 * Busca una palabra puntual por id.
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
export async function obtenerPalabraPorId(id) {
    const [filas] = await pool.query('SELECT * FROM palabras WHERE id = ?', [id]);
    return filas[0] || null;
}

/**
 * Inserta una palabra nueva en el banco.
 * @param {{palabra: string, categoria: string, pista: string}} datos
 * @returns {Promise<number>} el id insertado
 */
export async function crearPalabra({ palabra, categoria, pista }) {
    const [resultado] = await pool.query(
        'INSERT INTO palabras (palabra, categoria, pista) VALUES (?, ?, ?)',
        [palabra, categoria, pista]
    );
    return resultado.insertId;
}

/**
 * Actualiza una palabra existente.
 * @param {number} id
 * @param {{palabra: string, categoria: string, pista: string}} datos
 * @returns {Promise<boolean>} true si se actualizo algun registro
 */
export async function actualizarPalabra(id, { palabra, categoria, pista }) {
    const [resultado] = await pool.query(
        'UPDATE palabras SET palabra = ?, categoria = ?, pista = ? WHERE id = ?',
        [palabra, categoria, pista, id]
    );
    return resultado.affectedRows > 0;
}

/**
 * Elimina una palabra del banco.
 * @param {number} id
 * @returns {Promise<boolean>} true si se elimino algun registro
 */
export async function eliminarPalabra(id) {
    const [resultado] = await pool.query('DELETE FROM palabras WHERE id = ?', [id]);
    return resultado.affectedRows > 0;
}

/**
 * Verifica si ya existe una palabra igual (evita duplicados al crear/editar).
 * @param {string} palabra
 * @param {number|null} idExcluido id a excluir de la busqueda (para edicion)
 * @returns {Promise<boolean>}
 */
export async function existePalabra(palabra, idExcluido = null) {
    const query = idExcluido
        ? 'SELECT id FROM palabras WHERE palabra = ? AND id != ?'
        : 'SELECT id FROM palabras WHERE palabra = ?';
    const params = idExcluido ? [palabra, idExcluido] : [palabra];
    const [filas] = await pool.query(query, params);
    return filas.length > 0;
}
