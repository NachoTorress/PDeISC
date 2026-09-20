import { ReactNode, useEffect, useMemo, useState } from 'react';
import { ThemeContext, ThemeMode } from './themeContextValue';

/**
 * Reads the saved theme from localStorage and falls back to the user's system preference.
 * Source: browser storage and matchMedia. Destination: React state. Result: a valid theme mode.
 */
const getInitialTheme = (): ThemeMode => {
  const storedTheme = localStorage.getItem('portfolio-theme');

  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export const PortfolioThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    localStorage.setItem('portfolio-theme', themeMode);
  }, [themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      toggleTheme: () => setThemeMode((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark')),
    }),
    [themeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
