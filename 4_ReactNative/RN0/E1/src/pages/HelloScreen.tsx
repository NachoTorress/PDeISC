import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

/** Pantalla 1: "Hola Mundo" limpia. Origen: App.tsx (tab "inicio"). */
export default function HelloScreen() {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.top}><ThemeToggle /></View>
      <View style={styles.center}>
        <Text style={[styles.title, { color: colors.text }]}>¡Hola Mundo!</Text>
        <Text style={[styles.sub, { color: colors.muted }]}>Mi primer proyecto con React Native y Expo</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 20 },
  top: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 40, fontWeight: '800' },
  sub: { fontSize: 16, marginTop: 8, textAlign: 'center' },
});
