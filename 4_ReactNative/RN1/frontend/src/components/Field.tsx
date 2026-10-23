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
  placeholder?: string;
  icon?: React.ComponentProps<typeof FontAwesome5>['name'];
  onSubmit?: () => void;
  labelAction?: { title: string; onPress: () => void };
  palette: Palette;
};

export function Field({ label, value, onChange, validate, secret, revealLabel, keyboard, autoCapitalize = 'none', autoComplete, placeholder, icon, onSubmit, labelAction, palette }: Props) {
  const [touched, setTouched] = useState(false);
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const s = stylesFor(palette);
  const error = touched ? validate?.(value) : '';
  return <View style={s.field}>
    {labelAction ? <View style={s.fieldLabelRow}>
      <Text style={[s.label, { marginBottom: 0 }]}>{label}</Text>
      <Pressable accessibilityRole="button" onPress={labelAction.onPress} style={s.textButton}>
        <Text style={s.textButtonText}>{labelAction.title}</Text>
      </Pressable>
    </View> : <Text style={s.label}>{label}</Text>}
    <View style={[s.inputShell, focused ? s.inputFocused : undefined, error ? s.inputError : undefined]}>
      {icon ? <View style={s.inputIcon}><FontAwesome5 name={icon} size={15} color={focused ? palette.accent : palette.muted} /></View> : null}
      <TextInput
        accessibilityLabel={label}
        aria-invalid={Boolean(error)}
        accessibilityHint={error || undefined}
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => { setFocused(false); setTouched(true); }}
        secureTextEntry={Boolean(secret && !revealed)}
        keyboardType={keyboard}
        autoCapitalize={autoCapitalize}
        autoComplete={autoComplete}
        autoCorrect={false}
        placeholder={placeholder}
        placeholderTextColor={palette.muted}
        onSubmitEditing={onSubmit}
        returnKeyType={onSubmit ? 'go' : 'next'}
        selectionColor={palette.accent}
        style={[s.inputControl, icon ? s.inputWithIcon : undefined]}
      />
      {secret ? <Pressable accessibilityRole="button" accessibilityLabel={`${revealed ? 'Ocultar' : 'Mostrar'} ${revealLabel ?? label.toLowerCase()}`}
        onPress={() => setRevealed((current) => !current)} style={({ pressed }) => [s.revealButton, pressed ? { opacity: 0.65 } : undefined]}>
        <FontAwesome5 name={revealed ? 'eye-slash' : 'eye'} size={17} color={palette.muted} />
      </Pressable> : null}
    </View>
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
  </View>;
}
