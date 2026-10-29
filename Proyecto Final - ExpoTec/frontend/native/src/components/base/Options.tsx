/** Etiquetas de estado, opciones excluyentes y casillas de verificación. */
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../Icon";
import { choiceLayout } from "../../lib/choiceLayout";
import { styles } from "./styles";

/** Etiqueta de estado (con texto, no solo color). */
export function Chip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "error";
}) {
  const { colors } = useTheme();
  const fill =
    tone === "success"
      ? colors.successContainer
      : tone === "warning"
        ? colors.warning
        : tone === "error"
          ? colors.errorContainer
          : colors.surfaceVariant;
  const ink =
    tone === "success"
      ? colors.success
      : tone === "warning"
        ? colors.onWarning
        : tone === "error"
          ? colors.error
          : colors.onSecondaryContainer;
  return (
    <View style={[styles.chip, { backgroundColor: fill }]}>
      <Text
        selectable={false}
        style={{
          color: ink,
          fontSize: 12,
          fontWeight: "600",
        }}
      >
        {label}
      </Text>
    </View>
  );
}
/** Grupo de opciones excluyentes. */
export function Choice({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const { optionWidth } = choiceLayout(width, options.length);
  return (
    <View style={styles.field}>
      <Text selectable={false} style={[styles.label, { color: colors.text }]}>
        {label}
      </Text>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        style={[styles.wrap, { maxWidth: 760 }]}
      >
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            aria-checked={value === option.value}
            accessibilityState={{ checked: value === option.value, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={[
              styles.choice,
              { width: optionWidth },
              {
                opacity: disabled ? 0.45 : 1,
                backgroundColor:
                  value === option.value
                    ? colors.selectedContainer
                    : colors.surface,
                borderColor:
                  value === option.value
                    ? colors.primary
                    : colors.controlOutline,
              },
            ]}
          >
            <View style={{ width: 18, height: 18 }}>
              {value === option.value && (
                <Icon name="check" color={colors.primary} size={18} />
              )}
            </View>
            <Text
              selectable={false}
              style={{
                color:
                  value === option.value
                    ? colors.onSelectedContainer
                    : colors.text,
                fontSize: 14,
                fontWeight: value === option.value ? "600" : "400",
                textAlign: "center",
                flexShrink: 1,
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
/** Casilla de verificación con texto. */
export function CheckRow({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      aria-checked={checked}
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      onPress={() => onChange(!checked)}
      style={styles.checkRow}
    >
      <View
        style={[
          styles.checkbox,
          {
            backgroundColor: checked ? colors.primary : colors.surface,
            borderColor: checked ? colors.primary : colors.controlOutline,
          },
        ]}
      >
        {checked && <Icon name="check" color={colors.onPrimary} size={18} />}
      </View>
      <Text
        selectable={false}
        style={{ flex: 1, color: colors.text, fontSize: 15, lineHeight: 21 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
