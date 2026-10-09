import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { GamePage } from './pages/GamePage';

function Screen() {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  return <><StatusBar hidden={Platform.OS === 'android' && width > height} style={theme.mode === 'dark' ? 'light' : 'dark'} /><GamePage /></>;
}

export default function App() {
  return <ThemeProvider><Screen /></ThemeProvider>;
}
