/** Enlace para pasar de "Ingresar" a "Crear una cuenta" y viceversa. */
import { Text, View } from "react-native";
import { Button } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";

export function AccountSwitch({
  register,
  busy,
  onSwitch,
}: {
  register: boolean;
  busy: boolean;
  onSwitch: () => void;
}) {
  const { colors } = useTheme();
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  return (
    <View
      style={{
        gap: 2,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        flexWrap: "wrap",
      }}
    >
      <Text style={{ ...paragraph, fontSize: 14 }}>
        {register ? "¿Ya tenés una cuenta?" : "¿Primera vez en ExpoTec?"}
      </Text>
      <Button
        title={register ? "Ya tengo una cuenta" : "Crear una cuenta"}
        variant="quiet"
        disabled={busy}
        style={{ alignSelf: "center" }}
        onPress={onSwitch}
      />
    </View>
  );
}
