import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { GamePage } from './pages/GamePage';

function Screen() {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const phoneLandscape = Platform.OS === 'android' && width > height;
  return <>
    <StatusBar hidden={phoneLandscape} style={theme.mode === 'dark' ? 'light' : 'dark'} />
    {Platform.OS === 'android' && <NavigationBar hidden={phoneLandscape} />}
    <GamePage />
  </>;
}

export default function App() {
  return <ThemeProvider><Screen /></ThemeProvider>;
}
