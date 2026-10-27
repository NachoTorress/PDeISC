/** Persistencia de la demostración en el navegador (localStorage). */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "expotec-design-v1";

/** Conserva los datos del prototipo anterior en el almacenamiento del mismo navegador. */
export function loadDemo(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEY);
}

/** Propaga errores de cuota o escritura para que el contexto mantenga los cambios en memoria. */
export function saveDemo(raw: string): Promise<void> {
  return AsyncStorage.setItem(STORAGE_KEY, raw);
}
