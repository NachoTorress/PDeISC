import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Palette, lightPalette, darkPalette } from '../theme/colors';

type ThemeValue = { isDark: boolean; colors: Palette; toggle: () => void };
const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * Provee el tema claro/oscuro a toda la app.
 * Origen: App.tsx. Destino: componentes que usan useTheme().
 * Arranca con el modo del sistema y se puede alternar a mano.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [isDark, setIsDark] = useState(system === 'dark');
  const value = useMemo<ThemeValue>(
    () => ({ isDark, colors: isDark ? darkPalette : lightPalette, toggle: () => setIsDark((d) => !d) }),
    [isDark]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Devuelve el tema actual. Solo dentro de ThemeProvider. */
export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return ctx;
}
