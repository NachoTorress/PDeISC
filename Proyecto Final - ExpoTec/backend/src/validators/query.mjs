/**
 * Lectura de los datos de una consulta enviados en el cuerpo JSON.
 *
 * La API no usa GET: las consultas se hacen con POST y sus filtros (límite,
 * página, jornada...) viajan en el cuerpo, nunca en la URL. Las bajas
 * (DELETE) también reciben la versión en el cuerpo.
 *
 * Estas funciones solo comprueban la forma general del cuerpo; cada
 * validador específico decide qué campos admite y con qué valores.
 */
import { HttpError } from '../lib/errors.mjs';

/**
 * Devuelve el cuerpo de una consulta como objeto plano.
 * Un cuerpo ausente equivale a `{}` (consulta sin filtros).
 *
 * @param {unknown} body Cuerpo JSON recibido (`req.body`).
 * @returns {Record<string, unknown>} Objeto listo para pasar a un validador.
 * @throws {HttpError} 400 si el cuerpo no es un objeto JSON.
 */
export function queryInput(body) {
  if (body === undefined || body === null) return {};
  if (typeof body !== 'object' || Array.isArray(body))
    throw new HttpError(400, 'VALIDATION_ERROR', 'Los datos de la consulta deben ser un objeto JSON.');
  return body;
}

/**
 * Lee el número de versión obligatorio de una baja (`DELETE` con `{ version }`).
 * La versión evita borrar un registro que otra persona modificó mientras tanto.
 *
 * @param {unknown} body Cuerpo JSON recibido.
 * @returns {{ version: unknown }} Versión sin convertir: la valida cada recurso.
 */
export function versionInput(body) {
  const { version, ...rest } = queryInput(body);
  if (Object.keys(rest).length)
    throw new HttpError(400, 'VALIDATION_ERROR', 'Hay campos que esta operación no admite.');
  return { version };
}

/**
 * Rechaza cualquier dato en consultas que no admiten filtros.
 * Un campo desconocido es un error 400 y no se ignora en silencio.
 *
 * @param {unknown} body Cuerpo JSON recibido.
 * @throws {HttpError} 400 si se envió algún campo.
 */
export function noInput(body) {
  if (Object.keys(queryInput(body)).length)
    throw new HttpError(400, 'VALIDATION_ERROR', 'Hay campos que esta operación no admite.');
}
