import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

export type Theme = {
  mode: 'light' | 'dark';
  background: string; surface: string; board: string; floor: string; wall: string;
  crate: string; crateEdge: string; text: string; muted: string; accent: string;
  accentText: string; border: string; danger: string; flame: string;
};

const themes: Record<'light' | 'dark', Theme> = {
  light: {
    mode: 'light', background: '#f4f1e9', surface: '#fffdf7', board: '#d8d6cc',
    floor: '#eae8df', wall: '#536c76', crate: '#bd8757', crateEdge: '#8a603d',
    text: '#222c32', muted: '#4d5c63', accent: '#17675c', accentText: '#ffffff',
    border: '#c8cdc7', danger: '#ab3e37', flame: '#eea546',
  },
  dark: {
    mode: 'dark', background: '#101e28', surface: '#192d38', board: '#0d1922',
    floor: '#213642', wall: '#517584', crate: '#9b6745', crateEdge: '#d19b67',
    text: '#f3f2e9', muted: '#bed0d0', accent: '#84dbc2', accentText: '#11242a',
    border: '#43606d', danger: '#ffa28a', flame: '#f1ad53',
  },
};

type ThemeContextValue = { theme: Theme; toggleTheme: () => void };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<'light' | 'dark' | null>(null);
  const mode = override ?? (system === 'dark' ? 'dark' : 'light');
  const value = useMemo(() => ({
    theme: themes[mode],
    toggleTheme: () => setOverride(mode === 'light' ? 'dark' : 'light'),
  }), [mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('ThemeProvider es obligatorio');
  return context;
}
