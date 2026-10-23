import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import type { Palette } from '../styles/theme';
import { stylesFor } from '../styles/theme';

export function ActionButton({ title, onPress, palette, busy, secondary, disabled, icon }: {
  title: string; onPress: () => void; palette: Palette; busy?: boolean; secondary?: boolean; disabled?: boolean;
  icon?: React.ComponentProps<typeof FontAwesome5>['name'];
}) {
  const s = stylesFor(palette);
  const [hovered, setHovered] = useState(false);
  const unavailable = Boolean(busy || disabled);
  const color = unavailable ? palette.disabledText : secondary ? palette.secondaryText : palette.accentText;
  return <Pressable accessibilityRole="button" accessibilityLabel={busy ? `${title}. En proceso` : title}
    aria-busy={Boolean(busy)}
    accessibilityState={{ disabled: Boolean(busy || disabled), busy: Boolean(busy) }}
    disabled={unavailable} onPress={onPress} onHoverIn={() => setHovered(true)} onHoverOut={() => setHovered(false)}
    style={({ pressed }) => [s.button, secondary ? s.secondaryButton : undefined, unavailable ? s.buttonDisabled : undefined,
      hovered && !unavailable ? s.controlHovered : undefined, pressed ? s.controlPressed : undefined]}>
    {busy ? <ActivityIndicator size="small" color={color} /> : icon ? <FontAwesome5 name={icon} size={15} color={color} /> : null}
    <Text style={[secondary ? s.secondaryText : s.buttonText, { color }]}>{busy ? 'Un momento…' : title}</Text>
  </Pressable>;
}
