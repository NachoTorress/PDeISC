import { useCallback, useEffect, useRef } from "react";
import { lockGestureSelection } from "../lib/gestureSelection";

/** Une bloqueo de scroll, cancelación y limpieza: termina al soltar, cancelar o desmontar. */
export function useGestureGuard(
  onActive?: (active: boolean) => void,
  onCancel?: () => void,
) {
  const callbacks = useRef({ onActive, onCancel });
  callbacks.current = { onActive, onCancel };
  const release = useRef<(() => void) | null>(null);
  const end = useCallback(() => {
    if (!release.current) return;
    release.current();
    release.current = null;
    callbacks.current.onActive?.(false);
  }, []);
  const cancel = useCallback(() => {
    callbacks.current.onCancel?.();
    end();
  }, [end]);
  const begin = useCallback(() => {
    if (release.current) return;
    release.current = lockGestureSelection(cancel);
    callbacks.current.onActive?.(true);
  }, [cancel]);
  useEffect(() => cancel, [cancel]);
  return { begin, end, cancel, isActive: () => release.current !== null };
}
