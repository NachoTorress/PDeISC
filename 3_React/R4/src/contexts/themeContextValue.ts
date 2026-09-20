import { createContext } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeContextValue {
  themeMode: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
