/**
 * Barra superior: botón del menú hamburguesa (cuando el menú no está fijo),
 * marca, lema en pantallas anchas, menú de cuenta y cambio de tema claro/oscuro.
 */
import { useRef } from "react";
import {
  Image,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Icon } from "../Icon";
import AccountMenu from "../AccountMenu";
import brandIcon from "../../../assets/brand/expotec-icon-v1.png";

export function AppHeader({
  desktopNavigation,
  navigationOpen,
  onOpenNavigation,
  onSignIn,
}: {
  /** true cuando el menú lateral está fijo (pantallas de 1200 px o más). */
  desktopNavigation: boolean;
  navigationOpen: boolean;
  onOpenNavigation: () => void;
  onSignIn: () => void;
}) {
  const { colors, toggle } = useTheme();
  const { width } = useWindowDimensions();
  const menuButton = useRef<View>(null);
  return (
    <View
      testID="app-header"
      style={{
        minHeight: width < 600 ? 64 : 72,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        paddingHorizontal: width > 700 ? 24 : 12,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderColor: colors.outline,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: width < 400 ? 6 : 12,
        }}
      >
        {!desktopNavigation && (
          <Pressable
            ref={menuButton}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú de navegación"
            accessibilityState={{ expanded: navigationOpen }}
            onPress={() => {
              (
                menuButton.current as unknown as { focus?: () => void }
              )?.focus?.();
              onOpenNavigation();
            }}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="menu" color={colors.text} />
          </Pressable>
        )}
        {width >= 600 && (
          <Image
            source={brandIcon}
            accessibilityLabel=""
            accessible={false}
            style={{ width: 36, height: 36, borderRadius: 10 }}
          />
        )}
        <Text
          accessibilityRole="header"
          style={{
            color: colors.text,
            fontSize: width < 400 ? 21 : 25,
            fontWeight: "700",
            letterSpacing: -0.6,
          }}
        >
          expotec<Text style={{ color: colors.primary }}>.</Text>
        </Text>
      </View>
      {width > 750 && (
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          Ideas, equipos y espacios conectados.
        </Text>
      )}
      <View
        style={{
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          flexShrink: 1,
          minWidth: 0,
        }}
      >
        <AccountMenu onSignIn={onSignIn} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            colors.dark ? "Activar modo claro" : "Activar modo oscuro"
          }
          onPress={toggle}
          style={{
            minWidth: 48,
            minHeight: 48,
            borderRadius: 10,
            backgroundColor: colors.secondaryContainer,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={colors.dark ? "sun" : "moon"} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}
