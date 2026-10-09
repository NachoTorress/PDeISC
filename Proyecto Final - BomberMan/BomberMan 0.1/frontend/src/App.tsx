import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { GamePage } from './pages/GamePage';

function Screen() {
  const { theme } = useTheme();
  return <><StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} /><GamePage /></>;
}

export default function App() {
  return <ThemeProvider><Screen /></ThemeProvider>;
}
