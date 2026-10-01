import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';
import type { Palette } from '../styles/theme';
import { stylesFor } from '../styles/theme';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  validate?: (value: string) => string;
  secret?: boolean;
  keyboard?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  palette: Palette;
};

export function Field({ label, value, onChange, validate, secret, keyboard, autoCapitalize = 'none', palette }: Props) {
  const [touched, setTouched] = useState(false);
  const s = stylesFor(palette);
  const error = touched || value.length ? validate?.(value) : '';
  return <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    <TextInput
      accessibilityLabel={label}
      value={value}
      onChangeText={(text) => { setTouched(true); onChange(text); }}
      onBlur={() => setTouched(true)}
      secureTextEntry={secret}
      keyboardType={keyboard}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      selectionColor={palette.accent}
      style={[s.input, error ? s.inputError : undefined]}
    />
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
  </View>;
}
