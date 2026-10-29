/** Contenedores y títulos: tarjeta, sección, encabezado y encabezado de página. */
import type { ReactNode } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../Icon";
import type { IconName } from "../Icon";
import { layout } from "../../theme/tokens";
import { styles } from "./styles";

/** Tarjeta contenedora. */
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
/** Sección con título. */
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
/** Título de nivel intermedio. */
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

/** Encabezado de página con descripción y acciones. */
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
