import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeviceRecord } from '../types';
import { parseStoredRecords } from '../utils/records';

const KEY = '@pulso/records/v1';

/** Almacenamiento privado local, sin servidor, cuentas ni consultas HTTP. */
export async function loadRecords(): Promise<DeviceRecord[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  return parseStoredRecords(raw);
}

export async function writeRecords(records: DeviceRecord[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(records));
}
