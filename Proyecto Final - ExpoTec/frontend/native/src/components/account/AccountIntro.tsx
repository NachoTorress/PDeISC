/** Encabezado del formulario de cuenta: "Iniciá sesión" o "Creá tu cuenta" con su explicación. */
import { Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export function AccountIntro({ register }: { register: boolean }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  return (
    <View
      style={{
        gap: 10,
        marginBottom: 4,
        backgroundColor: colors.selectedContainer,
        padding: 20,
        borderRadius: 12,
      }}
    >
      {width > 700 && (
        <Text
          style={{
            color: colors.primary,
            fontSize: 22,
            fontWeight: "700",
            letterSpacing: -1,
          }}
        >
          expotec.
        </Text>
      )}
      <Text
        accessibilityRole="header"
        style={{
          color: colors.text,
          fontSize: 30,
          lineHeight: 36,
          fontWeight: "700",
          letterSpacing: -0.9,
        }}
      >
        {register ? "Creá tu cuenta" : "Iniciá sesión"}
      </Text>
      <Text style={paragraph}>
        {register
          ? "Elegí cómo vas a participar. La escuela asigna los permisos de organización."
          : "Ingresá a tu cuenta para participar de la ExpoTec."}
      </Text>
    </View>
  );
}
