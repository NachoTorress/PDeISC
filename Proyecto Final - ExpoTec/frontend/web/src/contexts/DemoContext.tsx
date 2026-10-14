import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { DemoState, Mutation, Role } from '../lib/types';
import { seed } from '../lib/seed';
import { applyMutation } from '../lib/model';
import { migrateProjectTeams } from '../lib/team';
import { DemoContext } from './demoContextValue';

const STORAGE_KEY = 'expotec-design-v1';

/** Lee el estado local del prototipo. El servidor real reemplazará esta persistencia. */
function loadState(): DemoState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const value = JSON.parse(saved);
      if (['spaces', 'projects', 'resources', 'loans'].every((key) => Array.isArray(value[key])))
        return migrateProjectTeams(value);
    }
  } catch {
    /* El prototipo también abre con almacenamiento bloqueado. */
  }
  return structuredClone(seed);
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(loadState);
  const [role, setRole] = useState<Role>('admin');
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  function mutate(action: Mutation) {
    try {
      const next = applyMutation(state, action, role);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setStorageError(false);
      } catch {
        setStorageError(true);
      }
      setState(next);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'No pudimos guardar el cambio.';
    }
  }

  return (
    <DemoContext.Provider value={{ state, role, setRole, mutate, notify: setNotice, notice }}>
      {children}
      {storageError && (
        <div className="storage-warning" role="status">
          El navegador no permite guardar. Los cambios de esta prueba se perderán al cerrar.
        </div>
      )}
    </DemoContext.Provider>
  );
}
