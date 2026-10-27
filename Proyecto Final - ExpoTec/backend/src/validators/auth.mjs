/**
 * Validación de datos de cuentas y utilidades comunes de validación.
 * Todas las validaciones del servidor se aplican aunque el formulario ya las haya hecho.
 */
import { HttpError } from '../lib/errors.mjs';

/** Roles del sistema: alumno, profesor, préstamos, administrador e invitado. */
export const roles = ['student', 'teacher', 'loans', 'admin', 'guest'];
/** Exige un objeto JSON y rechaza campos no admitidos (400). */
export function objectBody(body, allowed) {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    throw new HttpError(400, 'VALIDATION_ERROR', 'Enviá un objeto JSON.');
  if (Object.keys(body).some(key => !allowed.includes(key)))
    throw new HttpError(400, 'VALIDATION_ERROR', 'Hay campos que esta operación no admite.');
}

/** Lanza 400 con los errores por campo, si los hay. */
function invalid(fields) {
  if (Object.keys(fields).length)
    throw new HttpError(400, 'VALIDATION_ERROR', 'Revisá los campos indicados.', fields);
}

/** Valida correo y contraseña; en el registro también nombre, apellido y tipo de cuenta. */
export function credentials(body, register = false) {
  objectBody(body, register ? ['email', 'password', 'firstName', 'lastName', 'accountType'] : ['email', 'password']);
  const fields = {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(email))
    fields.email = 'Ingresá un correo válido de hasta 254 caracteres.';
  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < (register ? 12 : 1) || password.length > 128)
    fields.password = register ? 'Usá entre 12 y 128 caracteres.' : 'Ingresá tu contraseña.';
  const names = {};
  if (register) {
    if (body.accountType !== undefined && !['student', 'guest'].includes(body.accountType))
      fields.accountType = 'Elegí alumno o invitado.';
    if (body.accountType !== undefined) names.accountType = body.accountType;
    for (const key of ['firstName', 'lastName']) {
      names[key] = typeof body[key] === 'string' ? body[key].trim().normalize('NFC') : '';
      if (!/^[\p{L}\p{M}]+(?:[ '’][\p{L}\p{M}]+)*$/u.test(names[key]) || names[key].length > 80)
        fields[key] = 'Usá letras, espacios o apóstrofes; hasta 80 caracteres.';
    }
  }
  invalid(fields);
  return { email, password, ...names };
}

/** Valida el formato del token de renovación. */
export function refreshToken(body) {
  objectBody(body, ['refreshToken']);
  if (typeof body.refreshToken !== 'string' || body.refreshToken.length > 1024 ||
      !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(body.refreshToken))
    throw new HttpError(401, 'SESSION_INVALID', 'El token de renovación no es válido.');
  return body.refreshToken;
}

/** Valida un identificador UUID v4. */
export function userId(value) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value ?? ''))
    throw new HttpError(400, 'VALIDATION_ERROR', 'El identificador del usuario no es válido.');
  return value;
}

/** Valida una lista de roles sin repetir. */
export function roleList(body) {
  objectBody(body, ['roles']);
  if (!Array.isArray(body.roles) || !body.roles.length || body.roles.length > roles.length ||
      body.roles.some(role => !roles.includes(role)) || new Set(body.roles).size !== body.roles.length)
    throw new HttpError(400, 'VALIDATION_ERROR', 'Elegí uno o varios permisos distintos: student, teacher, loans, admin, guest.');
  return body.roles;
}

/** Valida limit (1-100) y offset (0-100000). */
export function pagination(body) {
  objectBody(body, ['limit', 'offset']);
  const { limit = 25, offset = 0 } = body;
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0 || offset > 100000)
    throw new HttpError(400, 'VALIDATION_ERROR', 'limit debe estar entre 1 y 100; offset entre 0 y 100000.');
  return { limit, offset };
}

/** Valida la búsqueda de cuentas de administración. */
export function usersQuery(body) {
  objectBody(body, ['limit', 'offset', 'search']);
  const { limit, offset } = pagination({
    ...(body.limit === undefined ? {} : { limit: body.limit }),
    ...(body.offset === undefined ? {} : { offset: body.offset }),
  });
  const search = body.search === undefined ? '' : body.search;
  if (typeof search !== 'string' || search.length > 100)
    throw new HttpError(400, 'VALIDATION_ERROR', 'La búsqueda admite hasta 100 caracteres.');
  return { limit, offset, search: search.trim().normalize('NFC') };
}

/** Valida el cambio de roles junto con los roles esperados. */
export function rolesChange(body) {
  objectBody(body, ['roles', 'expectedRoles']);
  const next = roleList({ roles: body.roles });
  // Una cuenta histórica puede no tener permisos; el nuevo conjunto nunca puede quedar vacío.
  const expected = body.expectedRoles;
  if (!Array.isArray(expected) || expected.length > roles.length ||
      expected.some(role => !roles.includes(role)) || new Set(expected).size !== expected.length)
    throw new HttpError(400, 'VALIDATION_ERROR', 'Recargá los permisos actuales antes de guardar.');
  return { roles: next, expectedRoles: expected };
}
