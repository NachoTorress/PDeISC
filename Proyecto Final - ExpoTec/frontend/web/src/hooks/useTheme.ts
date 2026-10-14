import { useEffect, useState } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('expotec-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      /* El cambio de tema funciona sin persistencia. */
    }
    return 'light';
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('expotec-theme', theme);
    } catch {
      /* Persistencia opcional. */
    }
  }, [theme]);
  return { theme, toggleTheme: () => setTheme(theme === 'light' ? 'dark' : 'light') };
}
