import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { Palette } from '../styles/theme';
import { stylesFor } from '../styles/theme';

export function ActionButton({ title, onPress, palette, busy, secondary, disabled }: {
  title: string; onPress: () => void; palette: Palette; busy?: boolean; secondary?: boolean; disabled?: boolean;
}) {
  const s = stylesFor(palette);
  return <Pressable accessibilityRole="button" accessibilityLabel={busy ? `${title}. En proceso` : title}
    accessibilityState={{ disabled: Boolean(busy || disabled), busy: Boolean(busy) }}
    disabled={busy || disabled} onPress={onPress}
    style={({ pressed }) => [s.button, secondary ? s.secondaryButton : undefined, busy || disabled ? s.buttonDisabled : undefined,
      pressed ? { transform: [{ scale: 0.96 }] } : undefined]}>
    {busy ? <ActivityIndicator size="small" color={palette.muted} /> : null}
    <Text style={[secondary ? s.secondaryText : s.buttonText, busy || disabled ? { color: palette.muted } : undefined]}>{busy ? 'Un momento…' : title}</Text>
  </Pressable>;
}
