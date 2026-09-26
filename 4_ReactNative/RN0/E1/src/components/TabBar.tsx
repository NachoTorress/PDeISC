import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export type TabItem = { key: string; label: string; icon: string };
type Props = { tabs: TabItem[]; active: string; onChange: (key: string) => void };

/** Barra de tabs inferior. Origen: App.tsx (tabs y activo). Destino: onChange devuelve el tab elegido a App.tsx. */
export default function TabBar({ tabs, active, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Pressable key={t.key} onPress={() => onChange(t.key)} accessibilityRole="tab" accessibilityState={{ selected: on }} style={styles.item}>
            <Text style={styles.icon}>{t.icon}</Text>
            <Text style={{ color: on ? colors.primary : colors.muted, fontWeight: on ? '700' : '500' }}>{t.label}</Text>
            {on && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', borderTopWidth: 1, paddingVertical: 8 },
  item: { flex: 1, alignItems: 'center', gap: 2 },
  icon: { fontSize: 22 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 2 },
});
