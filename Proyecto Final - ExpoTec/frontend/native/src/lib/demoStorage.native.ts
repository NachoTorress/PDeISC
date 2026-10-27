/**
 * Persistencia de la demostración en Android: archivo JSON con copia de respaldo para no perder datos si la app se cierra al guardar.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from "expo-file-system";
import { parseSavedState } from "./persistence";

const STORAGE_KEY = "expotec-design-v1";
const CURRENT = "expotec-demo.json";
const BACKUP = "expotec-demo.backup.json";
const PENDING = "expotec-demo.pending.json";

type Stored = { raw: string | null; source: File | null };

/** Prefiere el último archivo confirmado; un archivo incompleto conserva su respaldo anterior. */
async function readStored(): Promise<Stored> {
  let foundFile = false;
  for (const name of [CURRENT, BACKUP, PENDING]) {
    const file = new File(Paths.document, name);
    if (!file.exists) continue;
    foundFile = true;
    try {
      const raw = await file.text();
      parseSavedState(raw);
      return { raw, source: file };
    } catch {
      // Se busca otra copia completa sin borrar ni reparar el archivo recibido.
    }
  }
  if (foundFile)
    throw new Error(
      "No pudimos leer una copia completa de los datos guardados. Los archivos se conservaron.",
    );
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw !== null) parseSavedState(raw);
  return { raw, source: null };
}

/** Restaura archivos grandes en Android o lee los datos anteriores; nunca borra la copia legacy. */
export async function loadDemo(): Promise<string | null> {
  return (await readStored()).raw;
}

/** Guarda fuera de SQLite, conserva una copia válida y reemplaza el actual solo tras verificar el temporal.
 * El contexto serializa llamadas; los tres nombres fijos evitan acumular archivos por cada cambio.
 */
export async function saveDemo(raw: string): Promise<void> {
  parseSavedState(raw);
  const previous = await readStored();
  const backup = new File(Paths.document, BACKUP);
  if (previous.source && previous.source.uri !== backup.uri) {
    await previous.source.copy(backup, { overwrite: true });
  } else if (previous.raw !== null && !previous.source) {
    // La primera migración conserva también la entrada de AsyncStorage, sin eliminarla.
    backup.create({ overwrite: true });
    backup.write(previous.raw);
  }
  const pending = new File(Paths.document, PENDING);
  pending.create({ overwrite: true });
  pending.write(raw);
  if ((await pending.text()) !== raw)
    throw new Error(
      "La copia temporal no se guardó completa. Conservamos el respaldo anterior.",
    );
  await pending.move(new File(Paths.document, CURRENT), { overwrite: true });
}
