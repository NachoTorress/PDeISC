import { useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import type {
  KeyboardTypeOptions,
  StyleProp,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

// Reservar la barra evita que bloquear el scroll cambie el ancho durante un gesto.
const scrollLayoutStyle: ViewStyle & { scrollbarGutter?: string } =
  Platform.OS === "web" ? { scrollbarGutter: "stable" } : {};

/** Primitivas compartidas: reciben datos y acciones de cada pantalla; nunca cambian el modelo. */
export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  icon,
  endIcon,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "quiet" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  icon?: IconName;
  endIcon?: IconName;
  accessibilityLabel?: string;
}) {
  const { colors } = useTheme();
  const fill =
    variant === "primary"
      ? colors.primary
      : variant === "danger"
        ? colors.errorContainer
        : variant === "secondary"
          ? colors.secondaryContainer
          : "transparent";
  const ink =
    variant === "primary"
      ? colors.onPrimary
      : variant === "danger"
        ? colors.error
        : variant === "secondary"
          ? colors.onSecondaryContainer
          : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      android_ripple={{ color: `${ink}20` }}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor:
            pressed && variant === "quiet" ? colors.surfaceVariant : fill,
          borderColor: variant === "secondary" ? colors.outline : "transparent",
          borderWidth: variant === "secondary" ? 1 : 0,
          opacity: disabled ? 0.45 : 1,
        },
        style,
      ]}
    >
      {icon && <Icon name={icon} color={ink} size={20} />}
      <Text
        selectable={false}
        style={{
          color: ink,
          fontSize: 15,
          fontWeight: "600",
          textAlign: "center",
          flexShrink: 1,
        }}
      >
        {title}
      </Text>
      {endIcon && <Icon name={endIcon} color={ink} size={18} />}
    </Pressable>
  );
}

export function RefreshButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const unavailable = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: unavailable, busy: loading }}
      disabled={unavailable}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        alignSelf: "flex-start",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 22,
        borderWidth: 2,
        borderColor: focused ? colors.primary : "transparent",
        backgroundColor:
          pressed || hovered ? colors.surfaceVariant : "transparent",
        opacity: unavailable ? 0.45 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <Icon name="refresh" color={colors.text} size={22} />
      )}
    </Pressable>
  );
}

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
            borderWidth: focused || error ? 2 : 1,
            minHeight: multiline ? 88 : 44,
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

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.outline },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text
        selectable={false}
        style={{
          color: colors.text,
          fontSize: 18,
          fontWeight: "600",
          marginBottom: 4,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}
export function Heading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.heading}>
      <Text
        accessibilityRole="header"
        selectable={false}
        style={{
          color: colors.text,
          fontSize: 24,
          fontWeight: "700",
          letterSpacing: -0.6,
        }}
      >
        {title}
      </Text>
      {!!subtitle && (
        <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
          {subtitle}
        </Text>
      )}
    </View>
  );
}
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
  return (
    <View style={styles.field}>
      <Text selectable={false} style={[styles.label, { color: colors.text }]}>
        {label}
      </Text>
      <View style={styles.wrap}>
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
            {value === option.value && (
              <Icon name="check" color={colors.primary} size={18} />
            )}
            <Text
              selectable={false}
              style={{
                color:
                  value === option.value
                    ? colors.onSelectedContainer
                    : colors.text,
                fontSize: 14,
                fontWeight: value === option.value ? "600" : "400",
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
export function InlineConfirm({
  text,
  onConfirm,
  onCancel,
  confirmLabel = "Sí, eliminar",
  tone = "danger",
}: {
  text: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  tone?: "success" | "danger";
}) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.confirm,
        {
          backgroundColor:
            tone === "success" ? colors.successContainer : colors.errorContainer,
        },
      ]}
    >
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>
        {text}
      </Text>
      <View style={styles.wrap}>
        <Button
          title={confirmLabel}
          icon="check"
          variant={tone === "success" ? "primary" : "danger"}
          onPress={onConfirm}
        />
        <Button
          title="Cancelar"
          icon="close"
          variant="quiet"
          onPress={onCancel}
        />
      </View>
    </View>
  );
}
export function Screen({
  children,
  scrollEnabled = true,
}: {
  children: ReactNode;
  scrollEnabled?: boolean;
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const scroll = useRef<ScrollView>(null);
  const [showTop, setShowTop] = useState(false);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.page }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        ref={scroll}
        style={scrollLayoutStyle}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={160}
        onScroll={(e) => setShowTop(e.nativeEvent.contentOffset.y > 550)}
        contentContainerStyle={{
          paddingHorizontal: width > 700 ? 20 : 12,
          paddingTop: 12,
          paddingBottom: 24,
          gap: 12,
          flexGrow: 1,
        }}
      >
        {children}
      </ScrollView>
      {showTop && (
        <Button
          title="Subir"
          icon="arrowUp"
          variant="secondary"
          onPress={() => scroll.current?.scrollTo({ y: 0, animated: true })}
          style={{
            position: "absolute",
            right: 18,
            bottom: 14,
            borderWidth: 1,
            borderColor: colors.outline,
          }}
        />
      )}
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  field: { gap: 4 },
  label: { fontSize: 14, fontWeight: "600" },
  card: { padding: 12, gap: 10, borderWidth: 1, borderRadius: 14 },
  section: { gap: 10 },
  heading: { gap: 4 },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 24,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  confirm: { borderRadius: 12, padding: 12, gap: 10 },
});
