import React from 'react';
import { Pressable, Text } from 'react-native';
import type { Palette } from '../styles/theme';
import { stylesFor } from '../styles/theme';

export function ActionButton({ title, onPress, palette, busy, secondary, disabled }: {
  title: string; onPress: () => void; palette: Palette; busy?: boolean; secondary?: boolean; disabled?: boolean;
}) {
  const s = stylesFor(palette);
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled: Boolean(busy || disabled) }}
    disabled={busy || disabled} onPress={onPress}
    style={({ pressed }) => [s.button, secondary ? s.secondaryButton : undefined, busy || disabled ? s.buttonDisabled : undefined, pressed ? { opacity: 0.8 } : undefined]}>
    <Text style={[secondary ? s.secondaryText : s.buttonText, busy || disabled ? { color: palette.muted } : undefined]}>{busy ? 'Un momento…' : title}</Text>
  </Pressable>;
}
