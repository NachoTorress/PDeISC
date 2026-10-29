/**
 * Franja de la demostración: perfil ficticio activo, selector "Probar vista
 * como" y aviso del último cambio local. Solo se muestra fuera de las
 * secciones conectadas a la API.
 */
import { Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { useDemo } from "../../hooks/useDemo";
import { Button } from "../ui";
import { Icon } from "../Icon";
import type { Role } from "../../lib/types";
import { profiles } from "./routes";

export function DemoBar({
  menu,
  onToggleMenu,
  onChooseProfile,
  onShared,
}: {
  /** true si el selector de perfiles está abierto. */
  menu: boolean;
  onToggleMenu: () => void;
  onChooseProfile: (role: Role) => void;
  /** Vuelve a las secciones conectadas a la API. */
  onShared: () => void;
}) {
  const { colors } = useTheme();
  const { role, notice } = useDemo();
  const { width } = useWindowDimensions();
  const profile = profiles.find((item) => item.role === role)!;
  return (
    <>
      {menu && (
        <View
          style={{
            padding: 16,
            gap: 8,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderColor: colors.outline,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "600" }}>
            Probar vista como
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {profiles.map((item) => (
              <Button
                key={item.role}
                title={item.label}
                icon={item.role === role ? "check" : "users"}
                variant={item.role === role ? "primary" : "secondary"}
                onPress={() => onChooseProfile(item.role)}
              />
            ))}
          </View>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            Perfiles ficticios para probar datos locales. Los permisos de tu
            cuenta real se consultan desde el botón de cuenta de la barra
            superior.
          </Text>
          <Button
            title="Ver espacios compartidos"
            variant="secondary"
            onPress={onShared}
          />
        </View>
      )}
      {
        <View
          style={{
            paddingHorizontal: width > 700 ? 32 : 18,
            paddingVertical: 8,
            backgroundColor: colors.surfaceVariant,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 12, flex: 1 }}>
            Demostración · {profile.identity}
          </Text>
          <Button
            title="Cambiar vista"
            variant="quiet"
            endIcon={menu ? "chevronUp" : "chevronDown"}
            onPress={onToggleMenu}
          />
        </View>
      }
      {!!notice && (
        <View
          style={{
            paddingHorizontal: 18,
            paddingVertical: 12,
            backgroundColor: colors.surfaceVariant,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon name="check" color={colors.success} size={20} />
          <Text
            accessibilityLiveRegion="polite"
            style={{ color: colors.text, flex: 1, lineHeight: 21 }}
          >
            {notice}
          </Text>
        </View>
      )}
    </>
  );
}
