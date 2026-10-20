import type { DeviceRecord, RecordPayload, Vector3 } from '../types';

/** Validación compartida: se usa al escribir, guardar y recuperar datos locales. */
export function validateTitle(value: string): string {
  if (!value.trim()) return 'Escribí un título para identificar este registro.';
  if (value.trim().length < 3) return 'El título debe tener al menos 3 caracteres.';
  if (value.length > 60) return 'El título no puede superar los 60 caracteres.';
  if (/[\u0000-\u001F\u007F]/u.test(value))
    return 'El título no puede contener saltos de línea ni caracteres de control.';
  return '';
}

export function validateNotes(value: string): string {
  return value.length > 400 ? 'Las notas no pueden superar los 400 caracteres.' : '';
}

/** Admite únicamente los nombres generados por Pulso, sin rutas relativas o codificadas. */
export function isOwnedPhotoUri(uri: string, directory: string): boolean {
  const base = `${directory.replace(/\/$/u, '')}/`;
  return (
    uri.startsWith(base) &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/iu.test(
      uri.slice(base.length),
    )
  );
}

const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const validDate = (value: unknown): value is string =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));
const vector = (value: unknown): value is Vector3 =>
  object(value) && finite(value.x) && finite(value.y) && finite(value.z);

export function isPayload(value: unknown): value is RecordPayload {
  if (!object(value)) return false;
  switch (value.kind) {
    case 'camera':
      return (
        typeof value.uri === 'string' &&
        /^(file:|data:image\/|blob:|\/)/u.test(value.uri) &&
        finite(value.width) &&
        value.width > 0 &&
        finite(value.height) &&
        value.height > 0
      );
    case 'scanner':
      return (
        typeof value.content === 'string' &&
        value.content.length > 0 &&
        value.content.length <= 4096 &&
        typeof value.format === 'string'
      );
    case 'location':
      return (
        finite(value.latitude) &&
        Math.abs(value.latitude) <= 90 &&
        finite(value.longitude) &&
        Math.abs(value.longitude) <= 180 &&
        (value.accuracy === null || (finite(value.accuracy) && value.accuracy >= 0)) &&
        (value.altitude === null || finite(value.altitude))
      );
    case 'accelerometer':
    case 'gyroscope':
      return (
        vector(value.vector) && value.unit === (value.kind === 'accelerometer' ? 'g' : 'rad/s')
      );
    case 'biometrics':
      return (
        typeof value.method === 'string' && value.method.length > 0 && validDate(value.verifiedAt)
      );
    default:
      return false;
  }
}

export function isDeviceRecord(value: unknown): value is DeviceRecord {
  return (
    object(value) &&
    typeof value.id === 'string' &&
    /^[a-zA-Z0-9-]{8,80}$/u.test(value.id) &&
    typeof value.title === 'string' &&
    !validateTitle(value.title) &&
    typeof value.notes === 'string' &&
    !validateNotes(value.notes) &&
    validDate(value.createdAt) &&
    validDate(value.updatedAt) &&
    isPayload(value.payload)
  );
}
