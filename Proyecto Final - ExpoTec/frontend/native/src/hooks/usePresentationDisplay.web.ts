/** Pantalla completa de la presentación TV en el navegador (Fullscreen API). */
import { useEffect, useRef, useState } from "react";
import type { View } from "react-native";

/** Estado, entrada y salida de pantalla completa. */
export function usePresentationDisplay() {
  const ref = useRef<View>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [visible, setVisible] = useState(
    document.visibilityState === "visible",
  );
  const supported = document.fullscreenEnabled;
  useEffect(() => {
    const node = ref.current as unknown as HTMLElement;
    const changed = () => setFullscreen(document.fullscreenElement === node);
    const visibility = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("fullscreenchange", changed);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("fullscreenchange", changed);
      document.removeEventListener("visibilitychange", visibility);
      if (document.fullscreenElement === node)
        void document.exitFullscreen().catch(() => {});
    };
  }, []);
  async function exit() {
    if (document.fullscreenElement === (ref.current as unknown as HTMLElement))
      await document.exitFullscreen();
  }
  async function toggle() {
    const node = ref.current as unknown as HTMLElement;
    if (document.fullscreenElement === node) await exit();
    else await node.requestFullscreen();
  }
  return { ref, fullscreen, visible, supported, toggle, exit };
}
