import { useEffect, useState, useSyncExternalStore } from 'react';

const preference = '(prefers-color-scheme: dark)';
function subscribe(listener: () => void) {
  const media = window.matchMedia(preference);
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}
function systemTheme(): 'light' | 'dark' {
  return window.matchMedia(preference).matches ? 'dark' : 'light';
}
function serverTheme(): 'light' | 'dark' {
  return 'light';
}

export function useTheme() {
  const system = useSyncExternalStore(subscribe, systemTheme, serverTheme);
  const [choice, setChoice] = useState<'light' | 'dark' | null>(null);
  const theme = choice ?? system;
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return { theme, toggleTheme: () => setChoice(theme === 'light' ? 'dark' : 'light') };
}
