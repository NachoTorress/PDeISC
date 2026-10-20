import { useId, useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { Type } from './Typography';

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  hint?: string;
  multiline?: boolean;
  editable?: boolean;
};

export function Field({
  label,
  value,
  onChangeText,
  error,
  hint,
  multiline,
  editable = true,
}: Props) {
  const { colors } = useTheme();
  const id = useId();
  const [focused, setFocused] = useState(false);
  const message = error || hint;
  // React Native Web admite estas relaciones ARIA; Android usa label e hint nativos.
  const webAccessibility =
    Platform.OS === 'web'
      ? { 'aria-invalid': !!error, 'aria-describedby': message ? `${id}-message` : undefined }
      : {};
  return (
    <View style={{ gap: 6 }}>
      <Type nativeID={`${id}-label`} size={14} weight="medium">
        {label}
      </Type>
      <TextInput
        {...webAccessibility}
        nativeID={`${id}-input`}
        accessibilityLabel={label}
        accessibilityLabelledBy={`${id}-label`}
        accessibilityHint={error || hint}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={editable}
        multiline={multiline}
        autoCapitalize="sentences"
        style={{
          minHeight: multiline ? 98 : 50,
          borderRadius: 10,
          borderWidth: 2,
          borderColor: error ? colors.error : focused ? colors.accent : colors.line,
          backgroundColor: colors.background,
          color: colors.text,
          paddingHorizontal: 13,
          paddingVertical: 11,
          textAlignVertical: 'top',
          fontFamily: 'Outfit_400Regular',
          fontSize: 16,
          opacity: editable ? 1 : 0.6,
        }}
      />
      {!!message && (
        <Type
          nativeID={`${id}-message`}
          accessibilityLiveRegion="polite"
          size={12}
          style={{ color: error ? colors.error : colors.muted }}
        >
          {message}
        </Type>
      )}
    </View>
  );
}
