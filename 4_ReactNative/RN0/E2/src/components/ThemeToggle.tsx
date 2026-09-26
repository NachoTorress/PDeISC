import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

/** Botón claro/oscuro. Origen: cabeceras de pantalla. Destino: ThemeContext.toggle. */
export default function ThemeToggle() {
  const { isDark, colors, toggle } = useTheme();
  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="button"
      accessibilityLabel="Cambiar entre modo claro y oscuro"
      style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.card }]}
    >
      <Text style={{ color: colors.text, fontWeight: '600' }}>{isDark ? '☀️ Claro' : '🌙 Oscuro'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
});
