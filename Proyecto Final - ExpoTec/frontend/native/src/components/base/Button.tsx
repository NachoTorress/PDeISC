/** Botones de la app: acción principal, secundaria, discreta o destructiva, y botón de actualizar. */
import { useContext, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../Icon";
import type { IconName } from "../Icon";
import { layout } from "../../theme/tokens";
import { ActionRowContext } from "./ActionRow";
import { styles } from "./styles";

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

/** Botón para volver a consultar datos. */
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
