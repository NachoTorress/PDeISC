/** Aplica el tema al documento y permite alternar la preferencia de la sesión. */
import { useEffect, useState, useSyncExternalStore } from 'react';

const preference = '(prefers-color-scheme: dark)';
/** Suscribe los cambios de la consulta de medios y devuelve la función de limpieza. */
function subscribe(listener: () => void) {
  const media = window.matchMedia(preference);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
/** Lee la preferencia de color del navegador. */
function systemTheme(): 'light' | 'dark' {
  return window.matchMedia(preference).matches ? 'dark' : 'light';
}
/** Devuelve el tema claro cuando no hay navegador disponible. */
function serverTheme(): 'light' | 'dark' {
  return 'light';
}

/** Aplica el tema al documento y permite alternar la preferencia de la sesión. */
export function useTheme() {
  const system = useSyncExternalStore(subscribe, systemTheme, serverTheme);
  const [choice, setChoice] = useState<'light' | 'dark' | null>(null);
  const theme = choice ?? system;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return { theme, toggleTheme: () => setChoice(theme === 'light' ? 'dark' : 'light') };
}
