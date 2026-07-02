/**
 * alumnosModel.js
 * Capa de acceso a datos para la tabla "alumnos".
 * De dónde viene: recibe llamadas desde routes/alumnosRoutes.js.
 * A dónde va: ejecuta queries contra MySQL a través del pool de db.js.
 */

import { pool } from './db.js';

/** Devuelve todos los alumnos ordenados por id. */
export async function obtenerTodos() {
  const [filas] = await pool.query('SELECT * FROM alumnos ORDER BY id ASC');
  return filas;
}

/** Devuelve un alumno por id, o null si no existe. */
export async function obtenerPorId(id) {
  const [filas] = await pool.query('SELECT * FROM alumnos WHERE id = ?', [id]);
  return filas[0] || null;
}

/** Inserta un nuevo alumno y devuelve el registro creado. */
export async function crear({ nombre, apellido, edad }) {
  const [resultado] = await pool.query(
    'INSERT INTO alumnos (nombre, apellido, edad) VALUES (?, ?, ?)',
    [nombre.trim(), apellido.trim(), edad]
  );
  return obtenerPorId(resultado.insertId);
}

/** Actualiza un alumno existente. Devuelve el registro actualizado o null. */
export async function actualizar(id, { nombre, apellido, edad }) {
  const [resultado] = await pool.query(
    'UPDATE alumnos SET nombre = ?, apellido = ?, edad = ? WHERE id = ?',
    [nombre.trim(), apellido.trim(), edad, id]
  );
  if (resultado.affectedRows === 0) return null;
  return obtenerPorId(id);
}

/** Elimina un alumno por id. Devuelve true si se eliminó. */
export async function eliminar(id) {
  const [resultado] = await pool.query('DELETE FROM alumnos WHERE id = ?', [id]);
  return resultado.affectedRows > 0;
}
