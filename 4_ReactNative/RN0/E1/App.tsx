import React, { useState } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import TabBar, { TabItem } from './src/components/TabBar';
import HelloScreen from './src/pages/HelloScreen';
import StyledScreen from './src/pages/StyledScreen';

const TABS: TabItem[] = [
  { key: 'inicio', label: 'Inicio', icon: '👋' },
  { key: 'estilos', label: 'Estilos', icon: '🎨' },
];

/** Elige la pantalla según el tab activo. */
function Shell() {
  const { colors, isDark } = useTheme();
  const [tab, setTab] = useState('inicio');
  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.flex}>{tab === 'inicio' ? <HelloScreen /> : <StyledScreen />}</View>
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

/** Componente raíz: envuelve con áreas seguras y tema. */
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
