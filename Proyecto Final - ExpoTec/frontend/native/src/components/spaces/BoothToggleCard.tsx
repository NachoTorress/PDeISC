/** Casilla para habilitar la mesa elegida como puesto para proyectos (editor del plano). */
import { Text } from "react-native";
import { Card, CheckRow } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";

export function BoothToggleCard({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}) {
  const { colors } = useTheme();
  return (
    <Card>
      <CheckRow
        label="Habilitar esta mesa como puesto para proyectos"
        checked={enabled}
        onChange={onChange}
      />
      <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
        Las mesas se agregan como mobiliario. Habilitá solo las destinadas a
        recibir proyectos.
      </Text>
    </Card>
  );
}
