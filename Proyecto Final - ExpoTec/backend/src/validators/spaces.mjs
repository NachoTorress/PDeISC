import { HttpError } from '../lib/errors.mjs';
import { objectBody } from './auth.mjs';

function invalid(fields) {
  if (Object.keys(fields).length)
    throw new HttpError(400, 'VALIDATION_ERROR', 'Revisá los datos del espacio.', fields);
}
export function spaceDetails(body) {
  const fields = {};
  const name = typeof body.name === 'string' ? body.name.trim().normalize('NFC') : '';
  const description = typeof body.description === 'string' ? body.description.trim().normalize('NFC') : '';
  if (name.length < 2 || name.length > 80) fields.name = 'Usá entre 2 y 80 caracteres.';
  if (typeof body.description !== 'string' || description.length > 150) fields.description = 'Usá una descripción de hasta 150 caracteres.';
  invalid(fields);
  return { name, description };
}
export function createSpaceBody(body) {
  objectBody(body, ['name', 'description']);
  return spaceDetails(body);
}
export function spaceVersion(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 2147483646)
    throw new HttpError(400, 'VALIDATION_ERROR', 'La versión del espacio no es válida.');
  return value;
}
export function saveSpaceBody(body) {
  objectBody(body, ['version', 'name', 'description', 'furniture', 'boothFurnitureIds']);
  const details = spaceDetails(body), version = spaceVersion(body.version);
  if (!Array.isArray(body.furniture) || body.furniture.length > 150)
    throw new HttpError(400, 'VALIDATION_ERROR', 'El plano admite hasta 150 elementos.');
  const seen = new Set();
  const furniture = body.furniture.map(item => {
    objectBody(item, ['id', 'type', 'x', 'y', 'rotation', 'width', 'height', 'text']);
    const fields = {};
    if (typeof item.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(item.id) || seen.has(item.id))
      fields.furniture = 'Cada elemento necesita un código único de hasta 64 letras, números o guiones.';
    seen.add(item.id);
    if (!['table', 'bench', 'power', 'label'].includes(item.type)) fields.furniture = 'El tipo de elemento no es válido.';
    if (![item.x, item.y].every(value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100) ||
        !Number.isInteger(item.rotation) || item.rotation < 0 || item.rotation >= 360) fields.furniture = 'La ubicación o el giro no son válidos. Usá un giro entero entre 0 y 359 grados.';
    if (item.type === 'table') {
      if (typeof item.width !== 'number' || !Number.isFinite(item.width) || item.width < 6 || item.width > 30 ||
          typeof item.height !== 'number' || !Number.isFinite(item.height) || item.height < 4 || item.height > 25)
        fields.furniture = 'Las dimensiones de la mesa no son válidas.';
    } else if (item.width !== undefined || item.height !== undefined) fields.furniture = 'Solo las mesas tienen dimensiones ajustables.';
    const text = typeof item.text === 'string' ? item.text.trim().normalize('NFC') : '';
    if (item.type === 'label' ? text.length < 2 || text.length > 60 : item.text !== undefined)
      fields.furniture = 'Las etiquetas requieren un texto de 2 a 60 caracteres.';
    invalid(fields);
    return { id: item.id, type: item.type, x: item.x, y: item.y, rotation: item.rotation,
      ...(item.type === 'table' ? { width: item.width, height: item.height } : {}),
      ...(item.type === 'label' ? { text } : {}) };
  });
  const ids = body.boothFurnitureIds;
  if (!Array.isArray(ids) || ids.length > 150 || new Set(ids).size !== ids.length ||
      ids.some(id => typeof id !== 'string' || !furniture.some(item => item.id === id && item.type === 'table')))
    throw new HttpError(400, 'VALIDATION_ERROR', 'Los puestos deben corresponder a mesas distintas del plano.');
  return { ...details, version, furniture, boothFurnitureIds: ids };
}
