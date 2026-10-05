import React, { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions, TextInputProps } from 'react-native';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import type { Palette } from '../styles/theme';
import { stylesFor } from '../styles/theme';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  validate?: (value: string) => string;
  secret?: boolean;
  revealLabel?: string;
  keyboard?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  autoComplete?: TextInputProps['autoComplete'];
  palette: Palette;
};

export function Field({ label, value, onChange, validate, secret, revealLabel, keyboard, autoCapitalize = 'none', autoComplete, palette }: Props) {
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const s = stylesFor(palette);
  const error = touched ? validate?.(value) : '';
  return <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    <View style={[s.inputShell, focused ? s.inputFocused : undefined, error ? s.inputError : undefined]}>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setTouched(true); }}
        secureTextEntry={Boolean(secret && !revealed)}
        keyboardType={keyboard}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        selectionColor={palette.accent}
        style={s.inputControl}
      />
      {secret ? <Pressable accessibilityRole="button" accessibilityLabel={`${revealed ? 'Ocultar' : 'Mostrar'} ${revealLabel ?? label.toLowerCase()}`}
        onPress={() => setRevealed((current) => !current)} style={({ pressed }) => [s.revealButton, pressed ? { opacity: 0.65 } : undefined]}>
        <FontAwesome5 name={revealed ? 'eye-slash' : 'eye'} size={17} color={palette.muted} />
      </Pressable> : null}
    </View>
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
  </View>;
}
