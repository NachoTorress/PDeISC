import {
  Children,
  Fragment,
  createContext,
  isValidElement,
  useContext,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FormScrollView } from "./KeyboardLayout";
import { layout } from "../theme/tokens";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { choiceLayout } from "../lib/choiceLayout";

const ActionRowContext = createContext<boolean | number>(false);

function actionCount(children: ReactNode): number {
  return Children.toArray(children).reduce<number>(
    (total, child) =>
      total +
      (isValidElement<{ children?: ReactNode }>(child) &&
      child.type === Fragment
        ? actionCount(child.props.children)
        : 1),
    0,
  );
}

/** Acciones equivalentes comparten ancho y se apilan cuando falta espacio. */
export function ActionRow({
  children,
  footer = false,
  compact = false,
}: {
  children: ReactNode;
  footer?: boolean;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const columns = Math.max(
    1,
    Math.min(actionCount(children), Math.floor((width + 8) / 108)),
  );
  const compactWidth = width
    ? Math.floor(Math.min(144, (width - (columns - 1) * 8) / columns))
    : 144;
  return (
    <ActionRowContext.Provider value={compact ? compactWidth : true}>
      <View
        testID={compact ? "compact-actions" : undefined}
        onLayout={
          compact
            ? (event) => setWidth(event.nativeEvent.layout.width)
            : undefined
        }
        style={[
          styles.wrap,
          { alignItems: "stretch" },
          footer && {
            marginTop: "auto",
            paddingTop: compact ? 8 : 12,
            borderTopWidth: 1,
            borderColor: colors.outline,
          },
        ]}
      >
        {children}
      </View>
    </ActionRowContext.Provider>
  );
}

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
  const grouped = useContext(ActionRowContext);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
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
      hitSlop={Platform.OS === "android" ? 2 : undefined}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      android_ripple={{ color: `${ink}20` }}
      style={({ pressed }) => [
        styles.button,
        grouped === true && {
          flexGrow: 1,
          flexBasis: 144,
          alignSelf: "stretch",
        },
        typeof grouped === "number" && {
          width: grouped,
          minWidth: 0,
          paddingHorizontal: 8,
          gap: 6,
          alignSelf: "stretch",
        },
        {
          backgroundColor:
            (pressed || hovered) && !disabled
              ? variant === "primary"
                ? colors.primaryHover
                : colors.surfaceVariant
              : fill,
          borderColor: focused
            ? colors.primary
            : variant === "secondary"
              ? colors.controlOutline
              : "transparent",
          borderWidth: 2,
          ...(Platform.OS === "web" && focused
            ? {
                outlineColor: colors.primary,
                outlineOffset: 3,
                outlineStyle: "solid" as const,
                outlineWidth: 3,
              }
            : {}),
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
          lineHeight: 20,
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
      hitSlop={Platform.OS === "android" ? 2 : undefined}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed }) => ({
        width: layout.controlHeight,
        height: layout.controlHeight,
        alignSelf: "flex-start",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: layout.controlRadius,
        borderWidth: 2,
        borderColor: focused ? colors.primary : colors.outline,
        backgroundColor:
          pressed || hovered ? colors.surfaceVariant : colors.surface,
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

export function Card({
  children,
  style,
  testID,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const { colors } = useTheme();
  return (
    <View
      testID={testID}
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
          fontSize: 19,
          lineHeight: 25,
          flexShrink: 1,
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

export function PageHeading({
  title,
  subtitle,
  icon,
  tone = "brand",
}: {
  title: string;
  subtitle?: string;
  icon: IconName;
  tone?: "brand" | "info" | "accent";
}) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const fill =
    tone === "info"
      ? colors.infoContainer
      : tone === "accent"
        ? colors.accentContainer
        : colors.selectedContainer;
  const ink =
    tone === "info"
      ? colors.info
      : tone === "accent"
        ? colors.accent
        : colors.onSelectedContainer;
  return (
    <View
      style={{
        backgroundColor: colors.dark ? colors.surface : fill,
        padding: 16,
        borderRadius: layout.cardRadius,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={icon} color={ink} size={26} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 6 }}>
        <Text
          accessibilityRole="header"
          style={{
            color: colors.text,
            fontSize: width < 600 ? 22 : 26,
            lineHeight: width < 600 ? 28 : 32,
            fontWeight: "700",
            letterSpacing: -0.7,
          }}
        >
          {title}
        </Text>
        {!!subtitle && (
          <Text
            style={{
              color: colors.muted,
              fontSize: 15,
              lineHeight: 23,
              maxWidth: 720,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
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
            tone === "success"
              ? colors.successContainer
              : colors.errorContainer,
        },
      ]}
    >
      <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>
        {text}
      </Text>
      <ActionRow>
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
      </ActionRow>
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
  const scroll = useRef<Pick<ScrollView, "scrollTo">>(null);
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const [showTop, setShowTop] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: colors.page }}>
      <FormScrollView
        ref={scroll}
        style={[{ flex: 1, minHeight: 0 }, scrollLayoutStyle]}
        scrollEnabled={scrollEnabled}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={160}
        onScroll={(e) => setShowTop(e.nativeEvent.contentOffset.y > 550)}
        contentContainerStyle={{
          paddingHorizontal:
            width >= 1200 ? layout.pagePadding : width > 700 ? 24 : 16,
          paddingTop: width > 700 ? 24 : 16,
          paddingBottom: 24 + insets.bottom,
          gap: 16,
          flexGrow: 1,
        }}
      >
        {children}
      </FormScrollView>
      {showTop && (
        <Button
          title="Subir"
          icon="arrowUp"
          variant="secondary"
          onPress={() =>
            scroll.current?.scrollTo({ y: 0, animated: !reducedMotion })
          }
          style={{
            position: "absolute",
            right: 18,
            bottom: 14,
            borderWidth: 1,
            borderColor: colors.outline,
          }}
        />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: layout.controlHeight,
    minWidth: 132,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: layout.controlRadius,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  input: {
    borderRadius: layout.controlRadius,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  field: { gap: 8, minWidth: 0 },
  label: { fontSize: 14, fontWeight: "600" },
  card: {
    padding: layout.cardPadding,
    gap: 10,
    borderWidth: 1,
    borderRadius: layout.cardRadius,
    minWidth: 0,
  },
  section: { gap: 10 },
  heading: { gap: 4, minWidth: 0, maxWidth: "100%" },
  chip: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  choice: {
    minHeight: layout.controlHeight,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: layout.controlRadius,
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
