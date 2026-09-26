import React from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useScrollTop } from '../hooks/useScrollTop';
import { CATALOG } from '../data/catalog';
import { DEMOS } from '../components/Demos';
import ComponentCard from '../components/ComponentCard';
import ThemeToggle from '../components/ThemeToggle';

/** Pantalla única: lista los componentes nativos con uso y demo. Datos: CATALOG. Demos: DEMOS. Incluye botón "subir". */
export default function HomeScreen() {
  const { colors } = useTheme();
  const { ref, visible, onScroll, goTop } = useScrollTop();
  return (
    <View style={styles.flex}>
      <ScrollView ref={ref} onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={styles.wrap}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={[styles.title, { color: colors.text }]}>Componentes nativos</Text>
            <Text style={{ color: colors.muted }}>React Native · {CATALOG.length} componentes</Text>
          </View>
          <ThemeToggle />
        </View>
        <View style={styles.grid}>
          {CATALOG.map((c) => {
            const Demo = DEMOS[c.name];
            return (
              <View key={c.name} style={styles.cell}>
                <ComponentCard name={c.name} use={c.use}>{Demo && <Demo />}</ComponentCard>
              </View>
            );
          })}
        </View>
      </ScrollView>
      {visible && (
        <Pressable onPress={goTop} accessibilityLabel="Subir al inicio" style={[styles.fab, { backgroundColor: colors.primary }]}>
          <Text style={{ color: colors.onPrimary, fontSize: 22, fontWeight: '800' }}>↑</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { padding: 16, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 26, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  cell: { flexGrow: 1, flexBasis: 320 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 6 },
});
