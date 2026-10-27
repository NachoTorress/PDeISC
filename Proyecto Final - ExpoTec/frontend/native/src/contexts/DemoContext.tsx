/** Estado global de la demostración: perfil ficticio, datos locales y avisos. */
import { createContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { loadDemo, saveDemo } from "../lib/demoStorage";
import type { DemoState, Mutation, Role } from "../lib/types";
import { seed } from "../lib/seed";
import { applyMutation } from "../lib/model";
import { parseSavedState } from "../lib/persistence";
import { cloneData } from "../lib/clone";
import { newId } from "../lib/helpers";
import { useTheme } from "./ThemeContext";

interface DemoValue {
  state: DemoState;
  role: Role;
  setRole: (role: Role) => void;
  mutate: (action: Mutation) => string | null;
  notify: (message: string) => void;
  notice: string;
}
/** Contexto de la demostración. */
export const DemoContext = createContext<DemoValue | null>(null);

/** Conserva el esquema del prototipo y serializa escrituras locales; la API real reemplazará este proveedor. */
export function DemoProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const [state, setState] = useState<DemoState>(() => cloneData(seed));
  const current = useRef(state);
  const [ready, setReady] = useState(false);
  const [role, setRole] = useState<Role>("admin");
  const [notice, notify] = useState("");
  const [storageError, setStorageError] = useState(false);
  const writes = useRef<Promise<void>>(Promise.resolve());
  const canPersist = useRef(true);
  useEffect(() => {
    let mounted = true;
    loadDemo()
      .then((saved) => {
        if (!mounted || !saved) return;
        const loaded = parseSavedState(saved);
        current.current = loaded;
        setState(loaded);
      })
      .catch(() => {
        if (mounted) {
          canPersist.current = false;
          setStorageError(true);
        }
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => notify(""), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  /** Aplica una acción de la demo, valida el perfil y guarda el resultado. */
  function mutate(action: Mutation) {
    try {
      const next = applyMutation(current.current, action, role, newId);
      current.current = next;
      setState(next);
      if (canPersist.current)
        writes.current = writes.current
          .then(() => saveDemo(JSON.stringify(next)))
          .then(() => setStorageError(false))
          .catch(() => setStorageError(true));
      return null;
    } catch (error) {
      return error instanceof Error
        ? error.message
        : "No pudimos guardar el cambio.";
    }
  }
  if (!ready)
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.page,
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
        }}
      >
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.text }}>Preparando ExpoTec…</Text>
      </View>
    );
  return (
    <DemoContext.Provider
      value={{ state, role, setRole, mutate, notify, notice }}
    >
      {children}
      {storageError && (
        <View style={{ backgroundColor: colors.warning, padding: 12 }}>
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.onWarning }}
          >
            No pudimos guardar en este dispositivo. Conservá la app abierta para
            mantener estos cambios.
          </Text>
        </View>
      )}
    </DemoContext.Provider>
  );
}
