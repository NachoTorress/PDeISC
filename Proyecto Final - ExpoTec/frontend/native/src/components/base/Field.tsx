/** Campo de texto con etiqueta visible, ayuda y mensaje de error en tiempo real. */
import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import type { KeyboardTypeOptions, TextInputProps } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { layout } from "../../theme/tokens";
import { styles } from "./styles";

/** Campo de texto con etiqueta, ayuda y mensaje de error asociado. */
export function Field({
  label,
  value,
  onChangeText,
  error,
  hint,
  multiline = false,
  keyboardType,
  editable = true,
  maxLength,
  autoFocus = false,
  secureTextEntry = false,
  autoComplete,
  placeholder,
  onBlur,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  hint?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  editable?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  secureTextEntry?: boolean;
  autoComplete?: TextInputProps["autoComplete"];
  placeholder?: string;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text selectable={false} style={[styles.label, { color: colors.text }]}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error || hint}
        aria-invalid={!!error}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        onSubmitEditing={onSubmitEditing}
        returnKeyType={onSubmitEditing ? "go" : undefined}
        secureTextEntry={secureTextEntry}
        autoComplete={autoComplete}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        editable={editable}
        autoFocus={autoFocus}
        maxLength={maxLength}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={
          secureTextEntry ||
          autoComplete === "current-password" ||
          autoComplete === "new-password" ||
          keyboardType === "url" ||
          keyboardType === "email-address"
            ? "none"
            : "sentences"
        }
        autoCorrect={
          !secureTextEntry &&
          autoComplete !== "current-password" &&
          autoComplete !== "new-password" &&
          keyboardType !== "url" &&
          keyboardType !== "email-address"
        }
        selectionColor={colors.primary}
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error
              ? colors.error
              : focused
                ? colors.primary
                : colors.controlOutline,
            borderWidth: 2,
            minHeight: multiline ? 112 : layout.controlHeight,
            textAlignVertical: multiline ? "top" : "center",
            opacity: editable ? 1 : 0.65,
          },
        ]}
      />
      {!!(error || hint) && (
        <Text
          accessibilityLiveRegion={error ? "polite" : "none"}
          style={{
            color: error ? colors.error : colors.muted,
            fontSize: 13,
            lineHeight: 19,
          }}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
}
