/** Obtiene el contexto de demostración y exige su proveedor. */
import { useContext } from 'react';
import { DemoContext } from '../contexts/demoContextValue';

/** Obtiene el contexto de demostración y exige su proveedor. */
export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo debe usarse dentro de DemoProvider.');
  return value;
}
