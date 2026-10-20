import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { GameBoard } from '../components/GameBoard';
import { BombButton, DirectionPad, TouchControls } from '../components/TouchControls';
import { useTheme } from '../contexts/ThemeContext';
import { HEIGHT, WIDTH } from '../game/engine';
import { useGame } from '../hooks/useGame';

const soloMessages = {
  playing: { title: 'Partida en curso', description: 'Evitá las explosiones y eliminá a los dos bots.' },
  won: { title: '¡Ganaste!', description: 'Los dos bots quedaron fuera de juego.' },
  lost: { title: 'Perdiste', description: 'La explosión te alcanzó. Probá otra ruta.' },
  draw: { title: 'Empate', description: 'Todos quedaron fuera de juego.' },
};
const duelMessages = {
  playing: { title: 'Duelo en curso', description: 'Cada jugador debe escapar de las bombas del otro.' },
  won: { title: '¡Ganó J1!', description: 'El jugador 2 quedó fuera de juego.' },
  lost: { title: '¡Ganó J2!', description: 'El jugador 1 quedó fuera de juego.' },
  draw: { title: 'Empate', description: 'Ambos jugadores quedaron fuera de juego.' },
};

const landscapeSideWidth = 140;
const landscapeGap = 8;

export function GamePage() {
  const { theme, toggleTheme } = useTheme();
  const { state, move, bomb, restart, selectMode } = useGame();
  const mode = state.mode;
  const { width, height } = useWindowDimensions();
  const phoneLandscape = Platform.OS === 'android' && width > height;
  const wide = width >= 900 && !phoneLandscape;
  const roomWidth = phoneLandscape ? width - 16 - 2 * landscapeSideWidth - 2 * landscapeGap : wide ? Math.min(width - 430, 930) : width - 32;
  const roomHeight = phoneLandscape ? height - 20 : wide ? height - 170 : height - 300;
  const cellSize = Math.max(phoneLandscape ? 12 : 20,
    Math.min(56, Math.floor((roomWidth - 8) / WIDTH), Math.floor((roomHeight - 8) / HEIGHT)));
  const status = (state.mode === 'solo' ? soloMessages : duelMessages)[state.status];
  const actor = state.actors.find(a => a.id === 'player')!;
  const rival = state.actors.find(a => a.id === 'player2');
  const botsRemaining = state.actors.filter(a => a.id.startsWith('bot') && a.alive).length;
  const remaining = state.board.flat().filter(cell => cell === 'crate').length;

  if (phoneLandscape) return <ScrollView contentContainerStyle={[styles.landscapePage, { backgroundColor: theme.background }]}>
    <View style={[styles.landscapeStage, { minHeight: height - 16 }]}>
      <View style={styles.controlLane}>
        <Text style={[styles.landscapeLabel, { color: theme.muted }]}>MOVER</Text>
        <DirectionPad theme={theme} disabled={state.status !== 'playing'} move={move} compact />
      </View>
      <GameBoard state={state} cellSize={cellSize} theme={theme} />
      <View style={[styles.controlLane, styles.landscapeActions]}>
        <Text accessibilityLiveRegion="polite" style={[styles.landscapeStatus, { color: theme.text }]}>{status.title}</Text>
        <BombButton theme={theme} disabled={state.status !== 'playing'} bomb={bomb} compact />
        <Pressable accessibilityRole="button" accessibilityLabel="Iniciar una partida nueva" onPress={restart}
          style={({ pressed }) => [styles.landscapeActionButton, { backgroundColor: theme.accent, opacity: pressed ? 0.7 : 1 }]}>
          <Text style={[styles.landscapeActionText, { color: theme.accentText }]}>Nueva partida</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Cambiar a modo ${theme.mode === 'light' ? 'oscuro' : 'claro'}`} onPress={toggleTheme}
          style={({ pressed }) => [styles.landscapeActionButton, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1, opacity: pressed ? 0.7 : 1 }]}>
          <Text style={[styles.landscapeActionText, { color: theme.text }]}>{theme.mode === 'light' ? 'Modo oscuro' : 'Modo claro'}</Text>
        </Pressable>
      </View>
    </View>
    <View style={[styles.landscapeSummary, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={[styles.statusDescription, { color: theme.muted }]}>{status.description}</Text>
      <Text style={[styles.help, { color: theme.muted }]}>Bloques restantes: {remaining} · Tiempo: {Math.floor(state.elapsed)} s</Text>
    </View>
  </ScrollView>;

  return <ScrollView contentContainerStyle={[styles.page, { backgroundColor: theme.background }]}
    keyboardShouldPersistTaps="handled">
    <View style={styles.shell}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <View style={styles.brandRow}><View style={[styles.brandMark, { backgroundColor: theme.accent }]}><View style={styles.brandDot} /></View>
          <Text style={[styles.brand, { color: theme.text }]}>BOMBERMAN</Text></View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Cambiar a modo ${theme.mode === 'light' ? 'oscuro' : 'claro'}`}
          onPress={toggleTheme} style={({ pressed }) => [styles.themeButton, { borderColor: theme.border, backgroundColor: theme.surface, opacity: pressed ? 0.65 : 1 }]}>
          <Text style={[styles.themeButtonText, { color: theme.text }]}>{theme.mode === 'light' ? 'Modo oscuro' : 'Modo claro'}</Text>
        </Pressable>
      </View>

      {Platform.OS === 'web' && <View style={styles.modeSelector}>
        <Text style={[styles.modeLabel, { color: theme.text }]}>Modo de juego</Text>
        {([{ id: 'solo', label: '1P contra bots' }, { id: 'local2p', label: '2P local' }] as const).map(option =>
          <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: mode === option.id }} onPress={() => selectMode(option.id)}
            style={({ pressed }) => [styles.modeButton, { backgroundColor: mode === option.id ? theme.accent : theme.surface, borderColor: theme.border, opacity: pressed ? 0.75 : 1 }]}>
            <Text style={[styles.modeButtonText, { color: mode === option.id ? theme.accentText : theme.text }]}>{option.label}</Text>
          </Pressable>)}
      </View>}

      <View style={[styles.content, wide && styles.contentWide]}>
        <View style={styles.arenaColumn}>
          <View style={styles.arenaTitleRow}>
            <View><Text style={[styles.title, { color: theme.text }]}>La arena</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>{state.mode === 'solo' ? 'Vos contra dos bots' : 'Dos jugadores en el mismo teclado'}</Text></View>
            <View style={[styles.liveBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}><View style={[styles.liveDot, { backgroundColor: state.status === 'playing' ? theme.accent : theme.danger }]} /><Text style={[styles.liveText, { color: theme.text }]}>{state.status === 'playing' ? 'EN JUEGO' : 'FINALIZADA'}</Text></View>
          </View>
          <View>
            <GameBoard state={state} cellSize={cellSize} theme={theme} />
            {Platform.OS === 'android' && <TouchControls theme={theme} disabled={state.status !== 'playing'} move={move} bomb={bomb} />}
          </View>
          {Platform.OS === 'web' && <Text style={[styles.keyboardHint, { color: theme.muted }]}>{state.mode === 'solo' ?
            'Mover: flechas o WASD · Bomba: espacio o X' :
            'J1: flechas o WASD, bomba espacio/X · J2: IJKL, bomba O'}</Text>}
        </View>

        <View style={[styles.side, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text accessibilityLiveRegion="polite" style={[styles.statusTitle, { color: state.status === 'playing' ? theme.text : theme.accent }]}>{status.title}</Text>
          <Text style={[styles.statusDescription, { color: theme.muted }]}>{status.description}</Text>
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <View style={styles.statRow}><Text style={[styles.statLabel, { color: theme.muted }]}>J1 posición</Text><Text style={[styles.statValue, { color: theme.text }]}>{actor.x} / {actor.y}</Text></View>
          {state.mode === 'solo' ?
            <View style={styles.statRow}><Text style={[styles.statLabel, { color: theme.muted }]}>Bots restantes</Text><Text style={[styles.statValue, { color: theme.text }]}>{botsRemaining}</Text></View> :
            <View style={styles.statRow}><Text style={[styles.statLabel, { color: theme.muted }]}>J2 posición</Text><Text style={[styles.statValue, { color: theme.text }]}>{rival?.x} / {rival?.y}</Text></View>}
          <View style={styles.statRow}><Text style={[styles.statLabel, { color: theme.muted }]}>Bloques restantes</Text><Text style={[styles.statValue, { color: theme.text }]}>{remaining}</Text></View>
          <View style={styles.statRow}><Text style={[styles.statLabel, { color: theme.muted }]}>Tiempo</Text><Text style={[styles.statValue, { color: theme.text }]}>{Math.floor(state.elapsed)} s</Text></View>
          <View style={[styles.separator, { backgroundColor: theme.border }]} />
          <Text style={[styles.sectionLabel, { color: theme.text }]}>Cómo jugar</Text>
          <Text style={[styles.help, { color: theme.muted }]}>Colocá una bomba junto a un bloque y salí de su fila o columna antes de que explote. Las paredes de piedra resisten; las cajas se destruyen.</Text>
          <View style={styles.legend}><View style={[styles.legendSwatch, { backgroundColor: '#54bfd0' }]} /><Text style={[styles.legendText, { color: theme.text }]}>J1</Text><View style={[styles.legendSwatch, { backgroundColor: state.mode === 'solo' ? '#ee806c' : '#8d8df0' }]} /><Text style={[styles.legendText, { color: theme.text }]}>{state.mode === 'solo' ? 'Bots' : 'J2'}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Iniciar una partida nueva" onPress={restart}
            style={({ pressed }) => [styles.restart, { backgroundColor: theme.accent, opacity: pressed ? 0.7 : 1 }]}>
            <Text style={[styles.restartText, { color: theme.accentText }]}>Nueva partida</Text>
          </Pressable>
        </View>
      </View>
      <Text style={[styles.footer, { color: theme.muted }]}>Proyecto académico · Hito 2: juego local</Text>
    </View>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { flexGrow: 1, paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 20 : 44, paddingBottom: 28 },
  landscapePage: { flexGrow: 1, paddingHorizontal: 8, paddingVertical: 8 },
  landscapeStage: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: landscapeGap },
  landscapeLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 8 },
  landscapeActions: { gap: 8 },
  landscapeStatus: { fontSize: 12, fontWeight: '800', textAlign: 'center' },
  landscapeActionButton: { minHeight: 30, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderRadius: 8, paddingHorizontal: 4 },
  landscapeActionText: { fontSize: 11, fontWeight: '800' },
  landscapeSummary: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 },
  shell: { width: '100%', maxWidth: 1280, alignSelf: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, paddingBottom: 17, marginBottom: 24 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  brandDot: { width: 11, height: 11, backgroundColor: '#fff1bf', borderRadius: 6 },
  brand: { fontSize: 17, fontWeight: '900', letterSpacing: 1.3 },
  themeButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 9 },
  themeButtonText: { fontSize: 12, fontWeight: '700' },
  modeSelector: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 20 },
  modeLabel: { fontSize: 14, fontWeight: '800', marginRight: 4 },
  modeButton: { borderWidth: 1, borderRadius: 10, minHeight: 40, justifyContent: 'center', paddingHorizontal: 14 },
  modeButtonText: { fontSize: 14, fontWeight: '800' },
  content: { gap: 20 }, contentWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 28 },
  arenaColumn: { flex: 1, minWidth: 0 },
  arenaTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  subtitle: { fontSize: 14, marginTop: 3 },
  controlLane: { width: landscapeSideWidth, alignItems: 'center', justifyContent: 'center' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 4 }, liveText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  keyboardHint: { textAlign: 'center', fontSize: 14, marginTop: 16 },
  side: { width: '100%', maxWidth: 350, borderWidth: 1, borderRadius: 16, padding: 22, alignSelf: 'center' },
  statusTitle: { fontSize: 25, fontWeight: '900' }, statusDescription: { fontSize: 14, lineHeight: 21, marginTop: 5 },
  separator: { height: 1, marginVertical: 19 }, statRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 5 },
  statLabel: { fontSize: 14 }, statValue: { fontSize: 14, fontWeight: '800' },
  sectionLabel: { fontSize: 16, fontWeight: '800' }, help: { fontSize: 14, lineHeight: 21, marginTop: 8 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 18 },
  legendSwatch: { width: 13, height: 13, borderRadius: 7 }, legendText: { marginRight: 14, fontSize: 13 },
  restart: { marginTop: 24, minHeight: 45, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  restartText: { fontSize: 15, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 31 },
});
