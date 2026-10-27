/** Pantalla completa de la presentación TV en Android (sin API de pantalla completa). */
import { useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";

/** Estado y alternancia de pantalla completa. */
export function usePresentationDisplay() {
  const ref = useRef<View>(null);
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
    toggle: async () => {},
    exit: async () => {},
  };
}
