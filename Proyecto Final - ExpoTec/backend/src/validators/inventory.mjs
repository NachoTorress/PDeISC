/** Validación de elementos del inventario y pedidos de elementos. */
import { HttpError } from '../lib/errors.mjs';
import { objectBody, pagination, userId } from './auth.mjs';

/** Valida la versión del elemento (control de cambios simultáneos). */
export function inventoryVersion(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 2147483646)
    throw new HttpError(400, 'VALIDATION_ERROR', 'La versión del elemento no es válida.');
  return value;
}
/** Datos de un elemento: nombre, descripción, total y unidades fuera de servicio. */
export function resourceBody(body, editing = false) {
  objectBody(body, ['name', 'description', 'total', 'unavailable', 'note', ...(editing ? ['version'] : [])]);
  const fields = {};
  const name = typeof body.name === 'string' ? body.name.trim().normalize('NFC') : '';
  const description = typeof body.description === 'string' ? body.description.trim().normalize('NFC') : '';
  if (name.length < 2 || name.length > 100 || /\p{Cc}/u.test(name)) fields.name = 'Usá entre 2 y 100 caracteres.';
  if (typeof body.description !== 'string' || description.length > 250) fields.description = 'Usá hasta 250 caracteres.';
  if (!Number.isSafeInteger(body.total) || body.total < 0 || body.total > 100000) fields.total = 'Usá un entero de 0 a 100000.';
  if (body.unavailable !== undefined && (!Number.isSafeInteger(body.unavailable) || body.unavailable < 0 || body.unavailable > body.total)) fields.unavailable = 'Las unidades fuera de servicio deben ser un entero entre 0 y el total.';
  if (body.note !== undefined && (typeof body.note !== 'string' || body.note.trim().length > 1000)) fields.note = 'Usá hasta 1000 caracteres.';
  if (Object.keys(fields).length) throw new HttpError(400, 'VALIDATION_ERROR', 'Revisá los datos del elemento.', fields);
  return { name, description, total: body.total, unavailable: body.unavailable ?? (editing ? undefined : 0), note: body.note?.trim().normalize('NFC') ?? '', ...(editing ? { version: inventoryVersion(body.version) } : {}) };
}
/** Paginación y vista de elementos dados de baja. */
export function inventoryQuery(body) {
  objectBody(body, ['limit', 'offset', 'archived']);
  if (body.archived !== undefined && typeof body.archived !== 'boolean') throw new HttpError(400, 'VALIDATION_ERROR', 'La vista de inventario no es válida.');
  return { ...pagination({ limit: body.limit, offset: body.offset }), archived: body.archived ?? false };
}
/** Pedido de hasta 50 elementos distintos con cantidades de 1 a 10000. */
export function resourceRequests(value, editing = false) {
  if (value === undefined) return editing ? undefined : [];
  const invalid = () => new HttpError(400, 'VALIDATION_ERROR', 'Revisá los elementos solicitados.', { resources: 'Elegí hasta 50 elementos distintos con cantidades enteras de 1 a 10000.' });
  if (!Array.isArray(value) || value.length > 50) throw invalid();
  const seen = new Set();
  return value.map(item => {
    try { objectBody(item, ['resourceId', 'quantity']); userId(item.resourceId); }
    catch { throw invalid(); }
    if (seen.has(item.resourceId) || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000) throw invalid();
    seen.add(item.resourceId);
    return { resourceId: item.resourceId, quantity: item.quantity };
  });
}
