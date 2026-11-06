/** Pantalla completa de la presentación TV en Android (sin API de pantalla completa). */
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";

/** Estado y alternancia de pantalla completa. */
export function usePresentationDisplay() {
  const ref = useRef<View>(null);
  const enter = useCallback(async () => {}, []);
  const exit = useCallback(async () => {}, []);
  const [visible, setVisible] = useState(AppState.currentState === "active");
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (value) =>
      setVisible(value === "active"),
    );
    return () => subscription.remove();
  }, []);
  return {
    ref,
    fullscreen: false,
    visible,
    supported: false,
    enter,
    toggle: async () => {},
    exit,
  };
}

/** Android cierra el visor mediante el botón Atrás del Modal. */
export function usePresentationKeyboard(
  _enabled: boolean,
  _actions: {
    close: () => void;
    next: () => void;
    previous: () => void;
    toggle: () => void;
  },
) {
  void _enabled;
  void _actions;
}
