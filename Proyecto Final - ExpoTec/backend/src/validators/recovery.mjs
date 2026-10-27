/** Validación de la recuperación de contraseña. */
import { objectBody } from './auth.mjs';
import { HttpError } from '../lib/errors.mjs';

/** Correo para enviar el enlace. */
export function recoveryEmail(body) {
  objectBody(body, ['email']);
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email))
    throw new HttpError(400, 'VALIDATION_ERROR', 'Revisá el correo.', { email: 'Ingresá un correo válido.' });
  return email;
}
/** Token del enlace y contraseña nueva repetida. */
export function recoveryPassword(body) {
  objectBody(body, ['token', 'password', 'confirmation']);
  const fields = {};
  if (typeof body.token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(body.token))
    throw new HttpError(400, 'RESET_INVALID', 'El enlace no es válido. Solicitá uno nuevo.');
  if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) fields.password = 'Usá entre 12 y 128 caracteres.';
  if (typeof body.confirmation !== 'string' || body.password !== body.confirmation) fields.confirmation = 'Las contraseñas deben coincidir.';
  if (Object.keys(fields).length) throw new HttpError(400, 'VALIDATION_ERROR', 'Revisá los campos indicados.', fields);
  return { token: body.token, password: body.password };
}
