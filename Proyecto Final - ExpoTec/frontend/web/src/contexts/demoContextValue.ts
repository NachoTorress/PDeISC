/** Contrato del contexto de estado y operaciones de demostración. */
import { createContext } from 'react';
import type { DemoState, Mutation, Role } from '../lib/types';

/** Estado y operaciones disponibles mediante el contexto de demostración. */
export interface DemoContextValue {
  state: DemoState;
  role: Role;
  setRole: (role: Role) => void;
  mutate: (action: Mutation) => string | null;
  notify: (message: string) => void;
  notice: string;
}
export const DemoContext = createContext<DemoContextValue | null>(null);
