import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

/** Pantalla 2 (nuevo tab): distintas formas de estilar (sombra, color, borde punteado, texto). Origen: App.tsx. */
export default function StyledScreen() {
  const { colors } = useTheme();
  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <View style={styles.top}><ThemeToggle /></View>
      <Text style={[styles.h1, { color: colors.text }]}>Estilos diferentes</Text>

      <View style={[styles.shadowCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.h2, { color: colors.text }]}>Tarjeta con sombra</Text>
        <Text style={{ color: colors.muted }}>Bordes redondeados y elevación.</Text>
      </View>

      <View style={[styles.colorBlock, { backgroundColor: colors.primary }]}>
        <Text style={[styles.h2, { color: colors.onPrimary }]}>Bloque de color</Text>
        <Text style={{ color: colors.onPrimary }}>Fondo con el color principal.</Text>
      </View>

      <View style={[styles.dashed, { borderColor: colors.primary }]}>
        <Text style={[styles.h2, { color: colors.text }]}>Borde punteado</Text>
        <Text style={{ color: colors.muted }}>Sin fondo, solo contorno.</Text>
      </View>

      <Text style={[styles.fancy, { color: colors.primary }]}>Texto grande e itálico</Text>
      <Text style={[styles.upper, { color: colors.muted }]}>texto en mayúsculas espaciado</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 16 },
  top: { alignItems: 'flex-end' },
  h1: { fontSize: 28, fontWeight: '800' },
  h2: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  shadowCard: { padding: 18, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  colorBlock: { padding: 18, borderRadius: 4 },
  dashed: { padding: 18, borderWidth: 2, borderStyle: 'dashed', borderRadius: 24 },
  fancy: { fontSize: 26, fontStyle: 'italic', fontWeight: '300' },
  upper: { textTransform: 'uppercase', letterSpacing: 3, fontSize: 12 },
});
