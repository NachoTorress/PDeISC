import { useContext } from 'react';
import { ThemeContext } from '../contexts/themeContextValue';

export const useThemeMode = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeMode must be used inside PortfolioThemeProvider');
  }

  return context;
};
