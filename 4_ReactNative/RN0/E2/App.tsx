import React from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import HomeScreen from './src/pages/HomeScreen';

/** Contenedor con fondo según el tema. */
function Shell() {
  const { colors, isDark } = useTheme();
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <HomeScreen />
    </SafeAreaView>
  );
}

/** Componente raíz. */
export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Shell />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
