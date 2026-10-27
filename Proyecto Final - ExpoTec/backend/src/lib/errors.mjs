/**
 * Errores HTTP de la aplicación.
 * Cualquier `HttpError` lanzado en una ruta llega al manejador central de
 * `create-app.mjs`, que responde `{ error: { code, message, fields } }`.
 */
/**
 * Error con código HTTP, código interno estable y mensaje para el usuario.
 * @param {number} status Código HTTP (400, 401, 403, 404, 409, 429...).
 * @param {string} code Código para el cliente (por ejemplo VALIDATION_ERROR).
 * @param {string} message Mensaje en español para mostrar.
 * @param {Record<string, string>} [fields] Errores por campo del formulario.
 */
export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** Error 401 estándar para sesiones vencidas, revocadas o inválidas. */
export function unauthorized() {
  return new HttpError(401, 'SESSION_INVALID', 'La sesión venció o ya no es válida. Ingresá de nuevo.');
}
