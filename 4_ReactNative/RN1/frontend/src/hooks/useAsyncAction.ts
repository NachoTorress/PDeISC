import { useState } from 'react';

// Centraliza carga y error de cada acción; cada pantalla decide qué mostrar luego.
export function useAsyncAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    setError('');
    setBusy(true);
    try { return await action(); }
    catch (problem) { setError(problem instanceof Error ? problem.message : 'Ocurrió un error.'); }
    finally { setBusy(false); }
  }
  return { busy, error, setError, run };
}
