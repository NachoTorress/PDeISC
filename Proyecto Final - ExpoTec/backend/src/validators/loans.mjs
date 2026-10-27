/** Validación de entregas, devoluciones y consultas de préstamos. */
import { HttpError } from '../lib/errors.mjs';
import { objectBody, pagination, userId } from './auth.mjs';

const invalid = (message = 'Revisá los datos del préstamo.', fields) => new HttpError(400, 'VALIDATION_ERROR', message, fields);
/** Valida la versión del préstamo. */
export function loanVersion(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 2147483646) throw invalid('La versión no es válida.');
  return value;
}
/** Jornada de la exposición: 1, 2 o 3. */
export function loanDay(value) {
  if (![1, 2, 3].includes(value)) throw invalid('Elegí una jornada entre 1 y 3.');
  return value;
}
/** Observación opcional de hasta 1000 caracteres. */
function noteText(value) {
  if (value !== undefined && (typeof value !== 'string' || value.trim().length > 1000)) throw invalid('La observación admite hasta 1000 caracteres.');
  return (value ?? '').trim().normalize('NFC');
}
/** Paginación, jornada y filtro de pendientes. */
export function loansQuery(body, projects = false) {
  objectBody(body, ['limit', 'offset', 'day', ...(projects ? [] : ['openOnly'])]);
  if (!projects && body.openOnly !== undefined && typeof body.openOnly !== 'boolean') throw invalid();
  return { ...pagination({ limit: body.limit, offset: body.offset }),
    day: projects || body.day !== undefined ? loanDay(body.day) : undefined,
    ...(!projects ? { openOnly: body.openOnly ?? false } : {}) };
}
/** Datos de una entrega. */
export function deliveryBody(body) {
  objectBody(body, ['projectId', 'projectVersion', 'resourceId', 'day', 'quantity', 'recipientId', 'note']);
  if (!Number.isSafeInteger(body.quantity) || body.quantity < 1 || body.quantity > 10000) throw invalid('Indicá una cantidad entera de 1 a 10000.', { quantity: 'Usá un entero de 1 a 10000.' });
  return { projectId: userId(body.projectId), projectVersion: loanVersion(body.projectVersion), resourceId: userId(body.resourceId),
    day: loanDay(body.day), quantity: body.quantity, recipientId: userId(body.recipientId), note: noteText(body.note) };
}
/** Datos de una devolución; las novedades y daños exigen explicación. */
export function returnBody(body) {
  objectBody(body, ['version', 'quantity', 'damagedQuantity', 'note']);
  const note = noteText(body.note), damagedQuantity = body.damagedQuantity ?? 0;
  if (!Number.isSafeInteger(body.quantity) || body.quantity < 0 || body.quantity > 10000 || !Number.isSafeInteger(damagedQuantity) || damagedQuantity < 0 || damagedQuantity > body.quantity)
    throw invalid('Revisá las cantidades recibidas y dañadas.', { quantity: 'Usá cantidades enteras entre 0 y 10000; las dañadas no pueden superar las recibidas.' });
  if ((body.quantity === 0 || damagedQuantity > 0) && note.length < 10) throw invalid('Para una novedad o unidades dañadas, explicá el motivo con al menos 10 caracteres.', { note: 'Escribí entre 10 y 1000 caracteres.' });
  return { version: loanVersion(body.version), quantity: body.quantity, damagedQuantity, note };
}
