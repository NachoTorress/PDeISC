/**
 * Conversión de parámetros de consulta (query string) para las rutas GET y DELETE.
 *
 * En una URL todos los valores llegan como texto. Este módulo convierte los
 * parámetros conocidos al tipo que esperan los validadores (enteros y
 * booleanos) y deja el resto como texto, para que esos validadores sigan
 * rechazando campos desconocidos o mal formados con un error 400.
 */
import { HttpError } from '../lib/errors.mjs';

/**
 * Convierte `req.query` en un objeto tipado.
 *
 * @param {Record<string, unknown>} query Parámetros recibidos en la URL.
 * @param {Record<string, 'int' | 'bool' | 'string'>} types Tipo esperado de cada parámetro.
 * @returns {Record<string, unknown>} Objeto listo para pasar a un validador.
 * @throws {HttpError} 400 si un parámetro se repite (por ejemplo `?limit=1&limit=2`).
 */
export function queryInput(query = {}, types = {}) {
  const result = {};
  for (const [key, raw] of Object.entries(query)) {
    if (Array.isArray(raw) || (raw !== null && typeof raw === 'object'))
      throw new HttpError(400, 'VALIDATION_ERROR', `El parámetro ${key} se indicó más de una vez.`);
    const value = String(raw);
    if (types[key] === 'int' && /^-?\d{1,15}$/.test(value)) result[key] = Number(value);
    else if (types[key] === 'bool' && ['true', 'false'].includes(value)) result[key] = value === 'true';
    else result[key] = value; // Se conserva el texto: el validador decidirá si es válido.
  }
  return result;
}

/**
 * Lee el número de versión obligatorio de una baja (`DELETE ...?version=N`).
 * La versión evita borrar un registro que otra persona modificó mientras tanto.
 *
 * @param {Record<string, unknown>} query Parámetros de la URL.
 * @returns {{ version: unknown }} Objeto con la versión convertida a número cuando corresponde.
 */
export function versionQuery(query) {
  return queryInput(query, { version: 'int' });
}

/**
 * Rechaza cualquier parámetro en rutas de lectura que no admiten filtros.
 * Mantiene el mismo criterio estricto que los cuerpos JSON: un campo
 * desconocido es un error 400 y no se ignora en silencio.
 *
 * @param {Record<string, unknown>} query Parámetros de la URL.
 * @throws {HttpError} 400 si se envió algún parámetro.
 */
export function noQuery(query = {}) {
  if (Object.keys(query).length)
    throw new HttpError(400, 'VALIDATION_ERROR', 'Hay parámetros que esta operación no admite.');
}
