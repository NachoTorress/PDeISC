/** Confirmación dentro de la tarjeta (reemplaza a alert/confirm del navegador). */
import { Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { ActionRow } from "./ActionRow";
import { Button } from "./Button";
import { styles } from "./styles";

/** Confirmación dentro de la pantalla para acciones destructivas. */
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
