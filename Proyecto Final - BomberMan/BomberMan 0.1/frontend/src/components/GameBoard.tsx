import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { Theme } from '../contexts/ThemeContext';
import { key } from '../game/engine';
import type { GameState } from '../game/engine';

type Props = { state: GameState; cellSize: number; theme: Theme };

/** Dibuja el tablero a partir del estado del motor, sin modificar sus reglas. */
export function GameBoard({ state, cellSize, theme }: Props) {
  const bombs = new Set(state.bombs.map(key));
  const flames = new Set(state.flames.map(key));
  const actors = new Map(state.actors.filter(a => a.alive).map(a => [key(a), a.id]));
  return (
    <View accessible accessibilityLabel="Tablero de BomberMan" style={[styles.board, { backgroundColor: theme.board, borderColor: theme.border }]}>
      {state.board.map((row, y) => (
        <View key={y} style={styles.row}>
          {row.map((cell, x) => {
            const location = `${x},${y}`;
            const actor = actors.get(location);
            const fire = flames.has(location);
            return (
              <View key={location} style={[styles.cell, {
                width: cellSize, height: cellSize,
                backgroundColor: fire ? theme.flame : cell === 'wall' ? theme.wall : theme.floor,
                borderColor: theme.board,
              }]}>
                {cell === 'wall' && <View style={[styles.wallDetail, { borderColor: theme.board }]} />}
                {cell === 'crate' && <View style={[styles.crate, { backgroundColor: theme.crate, borderColor: theme.crateEdge }]} />}
                {bombs.has(location) && <View style={[styles.bomb, { width: cellSize * 0.59, height: cellSize * 0.59 }]}><View style={styles.fuse} /></View>}
                {actor && <View style={[styles.actor, {
                  width: cellSize * 0.67, height: cellSize * 0.67,
                  backgroundColor: actor === 'player' ? '#54bfd0' : '#ee806c',
                  borderColor: actor === 'player' ? '#176b7c' : '#9c4039',
                }]}><View style={styles.eyes}><View style={styles.eye} /><View style={styles.eye} /></View></View>}
                {fire && <View style={[styles.fireCore, { backgroundColor: '#ffe2a0' }]} />}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  board: { alignSelf: 'center', borderWidth: 4, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row' },
  cell: { alignItems: 'center', justifyContent: 'center', borderWidth: 0.5 },
  wallDetail: { width: '75%', height: '75%', borderTopWidth: 2, borderLeftWidth: 2, opacity: 0.32 },
  crate: { width: '84%', height: '84%', borderWidth: 2, borderRadius: 3, transform: [{ rotate: '45deg' }] },
  bomb: { borderRadius: 999, backgroundColor: '#20242a', alignItems: 'center', justifyContent: 'center' },
  fuse: { position: 'absolute', top: -4, width: 5, height: 6, backgroundColor: '#f4ca69', borderRadius: 3 },
  actor: { borderWidth: 2, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  eyes: { flexDirection: 'row', gap: 4, marginTop: -2 },
  eye: { width: 3, height: 5, borderRadius: 2, backgroundColor: '#193139' },
  fireCore: { position: 'absolute', width: '28%', height: '28%', backgroundColor: '#ffe2a0', borderRadius: 999 },
});
