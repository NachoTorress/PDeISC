import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

type Props = { name: string; use: string; children?: ReactNode };

/** Tarjeta de un componente: nombre, uso y demo en vivo. Origen: HomeScreen. */
export default function ComponentCard({ name, use, children }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.name, { color: colors.primary }]}>{`<${name} />`}</Text>
      <Text style={{ color: colors.muted, marginBottom: 12 }}>{use}</Text>
      <View style={[styles.demo, { borderColor: colors.border }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  name: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  demo: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 10, padding: 12 },
});
