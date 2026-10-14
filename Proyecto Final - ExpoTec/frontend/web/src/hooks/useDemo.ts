import { useContext } from 'react';
import { DemoContext } from '../contexts/demoContextValue';

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error('useDemo debe usarse dentro de DemoProvider.');
  return value;
}
