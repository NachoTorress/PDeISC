/** Botón de un proveedor social (Google, Discord o GitHub) con su ícono. */
import { useState } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { SocialProviderIcon } from "../SocialProviderIcon";
import { useTheme } from "../../contexts/ThemeContext";
import type { Provider } from "./types";

export function ProviderButton({
  provider,
  disabled,
  busy,
  onPress,
}: {
  provider: Provider;
  disabled: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Continuar con ${provider.name}`}
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={({ pressed }) => ({
        minHeight: 50,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: focused ? colors.primary : colors.controlOutline,
        backgroundColor:
          pressed || hovered ? colors.surfaceVariant : colors.surface,
        opacity: disabled ? 0.55 : 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      })}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <SocialProviderIcon
          provider={provider.id}
          color={
            provider.id === "discord"
              ? colors.dark
                ? "#a4adff"
                : "#5865F2"
              : colors.text
          }
        />
      )}
      <Text
        style={{
          color: colors.text,
          fontSize: 15,
          fontWeight: "600",
          flexShrink: 1,
          textAlign: "center",
        }}
      >
        Continuar con {provider.name}
      </Text>
    </Pressable>
  );
}
