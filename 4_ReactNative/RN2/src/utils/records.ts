import type { DeviceRecord } from '../types';
import { isDeviceRecord } from './validation';

/** Frontera de confianza: rechaza un archivo inválido completo para evitar pérdida silenciosa. */
export function parseStoredRecords(raw: string): DeviceRecord[] {
  const data: unknown = JSON.parse(raw);
  if (
    !Array.isArray(data) ||
    !data.every(isDeviceRecord) ||
    new Set(data.map((record) => record.id)).size !== data.length
  ) {
    throw new Error('El archivo de registros no es válido. No se sobrescribieron tus datos.');
  }
  return data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
