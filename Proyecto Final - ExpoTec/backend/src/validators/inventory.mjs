import { HttpError } from '../lib/errors.mjs';
import { objectBody, pagination, userId } from './auth.mjs';

export function inventoryVersion(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 2147483646)
    throw new HttpError(400, 'VALIDATION_ERROR', 'La versión del elemento no es válida.');
  return value;
}
export function resourceBody(body, editing = false) {
  objectBody(body, ['name', 'description', 'total', ...(editing ? ['version'] : [])]);
  const fields = {};
  const name = typeof body.name === 'string' ? body.name.trim().normalize('NFC') : '';
  const description = typeof body.description === 'string' ? body.description.trim().normalize('NFC') : '';
  if (name.length < 2 || name.length > 100 || /\p{Cc}/u.test(name)) fields.name = 'Usá entre 2 y 100 caracteres.';
  if (typeof body.description !== 'string' || description.length > 250) fields.description = 'Usá hasta 250 caracteres.';
  if (!Number.isSafeInteger(body.total) || body.total < 0 || body.total > 100000) fields.total = 'Usá un entero de 0 a 100000.';
  if (Object.keys(fields).length) throw new HttpError(400, 'VALIDATION_ERROR', 'Revisá los datos del elemento.', fields);
  return { name, description, total: body.total, ...(editing ? { version: inventoryVersion(body.version) } : {}) };
}
export function inventoryQuery(body) {
  objectBody(body, ['limit', 'offset', 'archived']);
  if (body.archived !== undefined && typeof body.archived !== 'boolean') throw new HttpError(400, 'VALIDATION_ERROR', 'La vista de inventario no es válida.');
  return { ...pagination({ limit: body.limit, offset: body.offset }), archived: body.archived ?? false };
}
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
