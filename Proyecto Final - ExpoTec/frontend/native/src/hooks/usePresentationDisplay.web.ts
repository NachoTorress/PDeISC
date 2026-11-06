/** Pantalla completa de la presentación TV en el navegador (Fullscreen API). */
import { useCallback, useEffect, useRef, useState } from "react";
import type { View } from "react-native";

/** Estado, entrada y salida de pantalla completa. */
export function usePresentationDisplay() {
  const ref = useRef<View>(null);
  const owned = useRef(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [visible, setVisible] = useState(
    document.visibilityState === "visible",
  );
  const supported = document.fullscreenEnabled;
  useEffect(() => {
    const changed = () =>
      setFullscreen(owned.current && !!document.fullscreenElement);
    const visibility = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("fullscreenchange", changed);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      document.removeEventListener("visibilitychange", visibility);
      const shouldExit = owned.current;
      owned.current = false;
      if (shouldExit && document.fullscreenElement)
        void document.exitFullscreen().catch(() => {});
    };
  }, []);
  const exit = useCallback(async () => {
    if (owned.current && document.fullscreenElement)
      await document.exitFullscreen();
    owned.current = false;
  }, []);
  const enter = useCallback(async () => {
    if (!document.fullscreenEnabled) return;
    owned.current = true;
    try {
      await document.documentElement.requestFullscreen();
      if (!owned.current && document.fullscreenElement)
        await document.exitFullscreen();
    } catch (error) {
      owned.current = false;
      throw error;
    }
  }, []);
  async function toggle() {
    if (owned.current && document.fullscreenElement) await exit();
    else await enter();
  }
  return { ref, fullscreen, visible, supported, enter, toggle, exit };
}

/** Atajos del visor; Escape también sale cuando lo gestiona el navegador. */
export function usePresentationKeyboard(
  enabled: boolean,
  actions: {
    close: () => void;
    next: () => void;
    previous: () => void;
    toggle: () => void;
  },
) {
  const latest = useRef(actions);
  latest.current = actions;
  useEffect(() => {
    if (!enabled) return;
    let entered = !!document.fullscreenElement;
    const fullscreenChanged = () => {
      if (document.fullscreenElement) entered = true;
      else if (entered) latest.current.close();
    };
    const key = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        (event.target.matches("input, textarea, select") ||
          event.target.isContentEditable)
      )
        return;
      if (event.code === "Escape") latest.current.close();
      else if (event.code === "ArrowRight") latest.current.next();
      else if (event.code === "ArrowLeft") latest.current.previous();
      else if (
        event.code === "Space" &&
        !(
          event.target instanceof HTMLElement &&
          event.target.closest('button,[role="button"]')
        )
      )
        latest.current.toggle();
      else return;
      event.preventDefault();
    };
    document.addEventListener("keydown", key);
    document.addEventListener("fullscreenchange", fullscreenChanged);
    return () => {
      document.removeEventListener("keydown", key);
      document.removeEventListener("fullscreenchange", fullscreenChanged);
    };
  }, [enabled]);
}
