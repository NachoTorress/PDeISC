import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { light, dark, type Palette } from '../styles/palettes';
import { applyWebTheme } from '../services/webTheme';
import type { ThemeMode } from '../types';

const KEY = '@pulso/theme/v1';
const ThemeContext = createContext<{
  mode: ThemeMode;
  colors: Palette;
  toggleTheme: () => Promise<void>;
  themeError: string;
} | null>(null);

/** Preferencia local → paleta nativa y atributos CSS del navegador. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(system === 'dark' ? 'dark' : 'light');
  const [themeError, setThemeError] = useState('');
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY)
      .then((saved) => {
        if (active && (saved === 'light' || saved === 'dark')) setMode(saved);
      })
      .catch(() => {
        if (active) setThemeError('No se pudo recuperar el tema.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    applyWebTheme(mode);
  }, [mode]);
  async function toggleTheme() {
    if (!ready || saving) return;
    setSaving(true);
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    try {
      await AsyncStorage.setItem(KEY, next);
      setThemeError('');
    } catch {
      setThemeError('El tema cambió, pero no se pudo guardar la preferencia.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <ThemeContext.Provider
      value={{ mode, colors: mode === 'light' ? light : dark, toggleTheme, themeError }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme requiere ThemeProvider.');
  return context;
}
