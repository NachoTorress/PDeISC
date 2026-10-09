import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GameBoard } from '../components/GameBoard';
import { TouchControls } from '../components/TouchControls';
import { useTheme } from '../contexts/ThemeContext';
import { HEIGHT, WIDTH } from '../game/engine';
import { useGame } from '../hooks/useGame';

const messages = {
  playing: { title: 'Partida en curso', description: 'Evitá las explosiones y encerrá al bot.' },
  won: { title: '¡Ganaste!', description: 'El bot quedó fuera de juego.' },
  lost: { title: 'Perdiste', description: 'La explosión te alcanzó. Probá otra ruta.' },
  draw: { title: 'Empate', description: 'Ambos quedaron fuera de juego.' },
};

export function GamePage() {
  const { theme, toggleTheme } = useTheme();
  const { state, move, bomb, restart } = useGame();
  const { width, height } = useWindowDimensions();
  const phoneLandscape = Platform.OS === 'android' && width > height;
  const wide = width >= 900 && !phoneLandscape;
  const roomWidth = phoneLandscape ? width - 282 : wide ? Math.min(width - 430, 730) : width - 32;
  const roomHeight = phoneLandscape ? height - 120 : wide ? height - 170 : height - 300;
  const cellSize = Math.max(phoneLandscape ? 12 : 20,
    Math.min(46, Math.floor((roomWidth - 8) / WIDTH), Math.floor((roomHeight - 8) / HEIGHT)));
  const status = messages[state.status];
  const actor = state.actors.find(a => a.id === 'player')!;
  const remaining = state.board.flat().filter(cell => cell === 'crate').length;

  return <ScrollView contentContainerStyle={[styles.page, phoneLandscape && styles.pageLandscape, { backgroundColor: theme.background }]}
    keyboardShouldPersistTaps="handled">
    <View style={styles.shell}>
      <View style={[styles.header, phoneLandscape && styles.headerLandscape, { borderBottomColor: theme.border }]}>
        <View style={styles.brandRow}><View style={[styles.brandMark, { backgroundColor: theme.accent }]}><View style={styles.brandDot} /></View>
          <Text style={[styles.brand, { color: theme.text }]}>BOMBERMAN</Text></View>
        {phoneLandscape && <Pressable accessibilityRole="button" accessibilityLabel="Iniciar una partida nueva" onPress={restart}
          style={({ pressed }) => [styles.headerRestart, { backgroundColor: theme.accent, opacity: pressed ? 0.7 : 1 }]}>
          <Text style={[styles.restartText, { color: theme.accentText }]}>Nueva partida</Text>
        </Pressable>}
        <Pressable accessibilityRole="button" accessibilityLabel={`Cambiar a modo ${theme.mode === 'light' ? 'oscuro' : 'claro'}`}
          onPress={toggleTheme} style={({ pressed }) => [styles.themeButton, { borderColor: theme.border, backgroundColor: theme.surface, opacity: pressed ? 0.65 : 1 }]}>
          <Text style={[styles.themeButtonText, { color: theme.text }]}>{theme.mode === 'light' ? 'Modo oscuro' : 'Modo claro'}</Text>
        </Pressable>
      </View>

      <View style={[styles.content, wide && styles.contentWide]}>
        <View style={styles.arenaColumn}>
          <View style={[styles.arenaTitleRow, phoneLandscape && styles.arenaTitleLandscape]}>
            <View><Text style={[styles.title, phoneLandscape && styles.titleLandscape, { color: theme.text }]}>La arena</Text>
              <Text style={[styles.subtitle, phoneLandscape && styles.subtitleLandscape, { color: theme.muted }]}>Vos contra un bot · partida local</Text></View>
            <View style={[styles.liveBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}><View style={[styles.liveDot, { backgroundColor: state.status === 'playing' ? theme.accent : theme.danger }]} /><Text style={[styles.liveText, { color: theme.text }]}>{state.status === 'playing' ? 'EN JUEGO' : 'FINALIZADA'}</Text></View>
          </View>
          <View style={phoneLandscape && styles.playAreaLandscape}>
            <GameBoard state={state} cellSize={cellSize} theme={theme} />
            {Platform.OS === 'android' && <TouchControls theme={theme} compact={phoneLandscape} disabled={state.status !== 'playing'} move={move} bomb={bomb} />}
          </View>
          {Platform.OS === 'web' && <Text style={[styles.keyboardHint, { color: theme.muted }]}>Mover: flechas o WASD  ·  Bomba: espacio o X</Text>}
        </View>

        <View style={[styles.side, phoneLandscape && styles.sideLandscape, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text accessibilityLiveRegion="polite" style={[styles.statusTitle, { color: state.status === 'playing' ? theme.text : theme.accent }]}>{status.title}</Text>
          <Text style={[styles.statusDescription, { color: theme.muted }]}>{status.description}</Text>
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <View style={styles.statRow}><Text style={[styles.statLabel, { color: theme.muted }]}>Posición</Text><Text style={[styles.statValue, { color: theme.text }]}>{actor.x} / {actor.y}</Text></View>
          <View style={styles.statRow}><Text style={[styles.statLabel, { color: theme.muted }]}>Bloques restantes</Text><Text style={[styles.statValue, { color: theme.text }]}>{remaining}</Text></View>
          <View style={styles.statRow}><Text style={[styles.statLabel, { color: theme.muted }]}>Tiempo</Text><Text style={[styles.statValue, { color: theme.text }]}>{Math.floor(state.elapsed)} s</Text></View>
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Cómo jugar</Text>
          <Text style={[styles.help, { color: theme.muted }]}>Colocá una bomba junto a un bloque y salí de su fila o columna antes de que explote. Las paredes de piedra resisten; las cajas se destruyen.</Text>
          <View style={styles.legend}><View style={[styles.legendSwatch, { backgroundColor: '#54bfd0' }]} /><Text style={[styles.legendText, { color: theme.text }]}>Vos</Text><View style={[styles.legendSwatch, { backgroundColor: '#ee806c' }]} /><Text style={[styles.legendText, { color: theme.text }]}>Bot</Text></View>
          {!phoneLandscape && <Pressable accessibilityRole="button" accessibilityLabel="Iniciar una partida nueva" onPress={restart}
            style={({ pressed }) => [styles.restart, { backgroundColor: theme.accent, opacity: pressed ? 0.7 : 1 }]}>
            <Text style={[styles.restartText, { color: theme.accentText }]}>Nueva partida</Text>
          </Pressable>}
        </View>
      </View>
      <Text style={[styles.footer, phoneLandscape && styles.footerLandscape, { color: theme.muted }]}>Proyecto académico · Hito 1: partida local contra bot</Text>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 20 : 44, paddingBottom: 28 },
  pageLandscape: { paddingTop: 8, paddingBottom: 14 },
  shell: { width: '100%', maxWidth: 1280, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, paddingBottom: 17, marginBottom: 24 },
  headerLandscape: { paddingBottom: 8, marginBottom: 8 },
  headerRestart: { minHeight: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brandDot: { width: 11, height: 11, backgroundColor: '#fff1bf', borderRadius: 6 },
  brand: { fontSize: 17, fontWeight: '900', letterSpacing: 1.3 },
  themeButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  themeButtonText: { fontSize: 12, fontWeight: '700' },
  content: { gap: 20 }, contentWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 28 },
  arenaColumn: { flex: 1, minWidth: 0 },
  arenaTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 },
  arenaTitleLandscape: { marginBottom: 8 },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  titleLandscape: { fontSize: 24 },
  subtitle: { fontSize: 14, marginTop: 3 },
  subtitleLandscape: { fontSize: 12, marginTop: 0 },
  playAreaLandscape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4 }, liveText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  keyboardHint: { textAlign: 'center', fontSize: 14, marginTop: 16 },
  side: { width: '100%', maxWidth: 350, borderWidth: 1, borderRadius: 16, padding: 22, alignSelf: 'center' },
  sideLandscape: { maxWidth: '100%', padding: 14 },
  statusTitle: { fontSize: 25, fontWeight: '900' }, statusDescription: { fontSize: 14, lineHeight: 21, marginTop: 5 },
  separator: { height: 1, marginVertical: 19 }, statRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  statLabel: { fontSize: 14 }, statValue: { fontSize: 14, fontWeight: '800' },
  sectionLabel: { fontSize: 16, fontWeight: '800' }, help: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 18 },
  legendSwatch: { width: 13, height: 13, borderRadius: 7 }, legendText: { marginRight: 14, fontSize: 13 },
  restart: { marginTop: 24, minHeight: 45, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  restartText: { fontSize: 15, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 31 },
  footerLandscape: { marginTop: 12 },
});
