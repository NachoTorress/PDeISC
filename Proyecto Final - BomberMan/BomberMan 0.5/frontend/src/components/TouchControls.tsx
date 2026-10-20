import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Theme } from '../contexts/ThemeContext';
import type { Direction } from '../game/engine';

type DirectionProps = { theme: Theme; disabled: boolean; move: (direction: Direction) => void; compact?: boolean };
type BombProps = { theme: Theme; disabled: boolean; bomb: () => void; compact?: boolean };
type Props = DirectionProps & BombProps;

function MoveButton({ direction, label, theme, disabled, move, size }: DirectionProps & { direction: Direction; label: string; size: number }) {
  const repeatDelay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const stop = () => {
    if (repeatDelay.current) clearTimeout(repeatDelay.current);
    if (interval.current) clearInterval(interval.current);
    repeatDelay.current = null;
    interval.current = null;
  };
  useEffect(() => stop, []);
  return <Pressable
    accessibilityRole="button" accessibilityLabel={`Mover ${label.toLowerCase()}`}
    disabled={disabled} onPressIn={() => {
      stop();
      move(direction);
      repeatDelay.current = setTimeout(() => {
        repeatDelay.current = null;
        move(direction);
        interval.current = setInterval(() => move(direction), 220);
      }, 330);
    }}
    onPressOut={stop}
    style={({ pressed }) => [styles.direction, { width: size, height: size, backgroundColor: pressed ? theme.accent : theme.surface, borderColor: pressed ? theme.accent : theme.border, opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
  >{({ pressed }) => <Text style={[styles.arrow, { color: pressed ? theme.accentText : theme.text, fontSize: size === 44 ? 23 : 27 }]}>{label}</Text>}</Pressable>;
}

/** Replica el pad de dos filas del Snake: arriba; izquierda, abajo y derecha. */
export function DirectionPad({ theme, disabled, move, compact = false }: DirectionProps) {
  const size = compact ? 44 : 51;
  const spacer = { width: size, height: size };
  return <View style={styles.pad}>
    <View style={styles.row}><View style={[styles.spacer, spacer]} /><MoveButton direction="up" label="↑" theme={theme} disabled={disabled} move={move} size={size} /><View style={[styles.spacer, spacer]} /></View>
    <View style={styles.row}>
      <MoveButton direction="left" label="←" theme={theme} disabled={disabled} move={move} size={size} />
      <MoveButton direction="down" label="↓" theme={theme} disabled={disabled} move={move} size={size} />
      <MoveButton direction="right" label="→" theme={theme} disabled={disabled} move={move} size={size} />
    </View>
  </View>;
}

/** Muestra el botón de bomba separado del pad para flanquear el tablero. */
export function BombButton({ theme, disabled, bomb, compact = false }: BombProps) {
  const bombSize = compact ? 88 : 106;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Colocar bomba" disabled={disabled} onPress={bomb}
      style={({ pressed }) => [styles.bombButton, { width: bombSize, height: bombSize, borderRadius: bombSize / 2, backgroundColor: theme.accent, opacity: disabled ? 0.45 : 1, transform: [{ scale: pressed ? 0.92 : 1 }] }]}
    ><View style={styles.bombIcon} /><Text style={[styles.bombText, { color: theme.accentText }]}>BOMBA</Text></Pressable>
  );
}

export function TouchControls({ theme, disabled, move, bomb, compact = false }: Props) {
  return <View style={[styles.wrap, compact && styles.wrapCompact]}>
    <DirectionPad theme={theme} disabled={disabled} move={move} compact={compact} />
    <BombButton theme={theme} disabled={disabled} bomb={bomb} compact={compact} />
  </View>;
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 28, paddingVertical: 12 },
  wrapCompact: { gap: 12, paddingVertical: 0 },
  pad: { gap: 4 }, row: { flexDirection: 'row', gap: 4 }, spacer: { width: 51, height: 51 },
  direction: { width: 51, height: 51, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 27, fontWeight: '700', lineHeight: 33 },
  bombButton: { width: 106, height: 106, borderRadius: 53, alignItems: 'center', justifyContent: 'center', gap: 7 },
  bombIcon: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#1e3037', borderWidth: 3, borderColor: '#f8e5ac' },
  bombText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});
