export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function unauthorized() {
  return new HttpError(401, 'SESSION_INVALID', 'La sesión venció o ya no es válida. Ingresá de nuevo.');
}
