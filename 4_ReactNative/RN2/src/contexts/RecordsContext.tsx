import { randomUUID } from 'expo-crypto';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { loadRecords, writeRecords } from '../services/recordStorage';
import { persistPhoto, removePhoto } from '../services/photos';
import { isPayload, validateNotes, validateTitle } from '../utils/validation';
import type { DeviceRecord, RecordInput } from '../types';

type RecordsContextValue = {
  records: DeviceRecord[];
  loading: boolean;
  loadError: string;
  busy: boolean;
  retry: () => Promise<void>;
  create: (input: RecordInput) => Promise<void>;
  update: (id: string, title: string, notes: string) => Promise<void>;
  remove: (id: string) => Promise<boolean>;
};
const RecordsContext = createContext<RecordsContextValue | null>(null);

/** Valida y persiste antes de publicar cambios: una escritura fallida conserva la UI anterior. */
export function RecordsProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<DeviceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const current = useRef<DeviceRecord[]>([]);
  const locked = useRef(false);
  const ready = useRef(false);

  const read = useCallback(() => {
    ready.current = false;
    return loadRecords()
      .then((saved) => {
        current.current = saved;
        setRecords(saved);
        setLoadError('');
        ready.current = true;
      })
      .catch(() => {
        setLoadError(
          'No pudimos leer los registros locales. Tus datos se conservaron. Reintentá antes de guardar cambios.',
        );
      })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    void read();
  }, [read]);
  async function retry() {
    setLoading(true);
    await read();
  }

  function lock() {
    if (!ready.current) throw new Error('Primero se deben cargar los registros.');
    if (locked.current) throw new Error('Hay un cambio en curso. Esperá un momento.');
    locked.current = true;
    setBusy(true);
  }
  function unlock() {
    locked.current = false;
    setBusy(false);
  }
  async function commit(next: DeviceRecord[]) {
    await writeRecords(next);
    current.current = next;
    setRecords(next);
  }

  async function create(input: RecordInput) {
    const error = validateTitle(input.title) || validateNotes(input.notes);
    if (error || !isPayload(input.payload))
      throw new Error(error || 'La medición recibida no es válida.');
    lock();
    let ownedPhoto: string | undefined;
    try {
      const id = randomUUID();
      let payload = input.payload;
      if (payload.kind === 'camera') {
        ownedPhoto = await persistPhoto(payload.uri, id);
        payload = { ...payload, uri: ownedPhoto };
      }
      const now = new Date().toISOString();
      await commit([
        {
          id,
          title: input.title.trim(),
          notes: input.notes.trim(),
          payload,
          createdAt: now,
          updatedAt: now,
        },
        ...current.current,
      ]);
    } catch (error) {
      if (ownedPhoto) await removePhoto(ownedPhoto).catch(() => undefined);
      throw error;
    } finally {
      unlock();
    }
  }

  async function update(id: string, title: string, notes: string) {
    const error = validateTitle(title) || validateNotes(notes);
    if (error) throw new Error(error);
    lock();
    try {
      if (!current.current.some((record) => record.id === id))
        throw new Error('Este registro ya no existe.');
      await commit(
        current.current.map((record) =>
          record.id === id
            ? {
                ...record,
                title: title.trim(),
                notes: notes.trim(),
                updatedAt: new Date().toISOString(),
              }
            : record,
        ),
      );
    } finally {
      unlock();
    }
  }

  async function remove(id: string) {
    lock();
    try {
      const record = current.current.find((item) => item.id === id);
      if (!record) throw new Error('Este registro ya no existe.');
      await commit(current.current.filter((item) => item.id !== id));
      if (record.payload.kind === 'camera') {
        try {
          await removePhoto(record.payload.uri);
        } catch {
          return false;
        }
      }
      return true;
    } finally {
      unlock();
    }
  }

  return (
    <RecordsContext.Provider
      value={{ records, loading, loadError, busy, retry, create, update, remove }}
    >
      {children}
    </RecordsContext.Provider>
  );
}

export function useRecords() {
  const context = useContext(RecordsContext);
  if (!context) throw new Error('useRecords requiere RecordsProvider.');
  return context;
}
