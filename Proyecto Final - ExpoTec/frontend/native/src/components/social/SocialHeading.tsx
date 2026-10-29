/**
 * Título del bloque de acceso social: estado del ingreso pendiente, título
 * lateral en pantallas anchas o separador "O continuá con".
 */
import { Text, View } from "react-native";
import { Heading } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";
import type { SocialStatus } from "./types";

export function SocialHeading({
  pending,
  status,
  sideBySide,
}: {
  /** true si hay un acceso social en curso. */
  pending: boolean;
  status: SocialStatus | null;
  sideBySide: boolean;
}) {
  const { colors } = useTheme();
  if (pending)
    return (
      <Heading
        title={
          status?.mode === "signup"
            ? "Creá tu cuenta de ExpoTec"
            : status?.mode === "link"
              ? "Vinculá tu cuenta existente"
              : "Ingresando a ExpoTec"
        }
      />
    );
  if (sideBySide)
    return (
      <View style={{ gap: 8 }}>
        <Text
          accessibilityRole="header"
          style={{
            color: colors.text,
            fontSize: 20,
            fontWeight: "600",
            letterSpacing: -0.4,
          }}
        >
          Continuá con otra cuenta
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21 }}>
          También podés usar estos medios para ingresar.
        </Text>
      </View>
    );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.outline }} />
      <Text style={{ color: colors.muted, fontSize: 13 }}>O continuá con</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.outline }} />
    </View>
  );
}
