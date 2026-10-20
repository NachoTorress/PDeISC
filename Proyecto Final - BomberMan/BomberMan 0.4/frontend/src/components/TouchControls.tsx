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
    style={({ pressed }) => [styles.direction, { width: size, height: size, backgroundColor: theme.surface, borderColor: theme.border, opacity: disabled ? 0.45 : pressed ? 0.68 : 1 }]}
  ><Text style={[styles.arrow, { color: theme.text, fontSize: size === 44 ? 23 : 27 }]}>{label}</Text></Pressable>;
}

/** Muestra el pad de dirección; el tamaño compacto se usa al lado del tablero. */
export function DirectionPad({ theme, disabled, move, compact = false }: DirectionProps) {
  const size = compact ? 44 : 51;
  const spacer = { width: size, height: size };
  return <View style={styles.pad}>
    <View style={styles.row}><View style={[styles.spacer, spacer]} /><MoveButton direction="up" label="↑" theme={theme} disabled={disabled} move={move} size={size} /><View style={[styles.spacer, spacer]} /></View>
    <View style={styles.row}>
      <MoveButton direction="left" label="←" theme={theme} disabled={disabled} move={move} size={size} />
      <View style={[styles.spacer, spacer]} />
      <MoveButton direction="right" label="→" theme={theme} disabled={disabled} move={move} size={size} />
    </View>
    <View style={styles.row}><View style={[styles.spacer, spacer]} /><MoveButton direction="down" label="↓" theme={theme} disabled={disabled} move={move} size={size} /><View style={[styles.spacer, spacer]} /></View>
  </View>;
}

/** Muestra el botón de bomba separado del pad para flanquear el tablero. */
export function BombButton({ theme, disabled, bomb, compact = false }: BombProps) {
  const bombSize = compact ? 88 : 106;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Colocar bomba" disabled={disabled} onPress={bomb}
      style={({ pressed }) => [styles.bombButton, { width: bombSize, height: bombSize, borderRadius: bombSize / 2, backgroundColor: theme.accent, opacity: disabled ? 0.45 : pressed ? 0.7 : 1 }]}
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
  pad: { gap: 3 }, row: { flexDirection: 'row', gap: 3 }, spacer: { width: 51, height: 51 },
  direction: { width: 51, height: 51, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  arrow: { fontSize: 27, fontWeight: '700', lineHeight: 33 },
  bombButton: { width: 106, height: 106, borderRadius: 53, alignItems: 'center', justifyContent: 'center', gap: 7 },
  bombIcon: { width: 25, height: 25, borderRadius: 13, backgroundColor: '#1e3037', borderWidth: 3, borderColor: '#f8e5ac' },
  bombText: { fontSize: 13, fontWeight: '900', letterSpacing: 1 },
});
