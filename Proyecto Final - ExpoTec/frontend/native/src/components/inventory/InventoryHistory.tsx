/**
 * Historial de un elemento del inventario: altas, modificaciones, bajas y
 * devoluciones con daños, con quién y cuándo (DD/MM/AA) y los valores antes
 * y después del cambio.
 */
import { Text, View } from "react-native";
import { Button, Heading } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDate } from "../../lib/format";
import type { InventoryResource } from "../../lib/sharedInventory";

/** Nombre visible de cada acción registrada. */
const actionNames: Record<string, string> = {
  create: "Alta",
  update: "Modificación",
  archive: "Baja",
  damage: "Devolución con daños",
};

export function InventoryHistory({
  resource,
  onClose,
}: {
  /** Elemento consultado con sus eventos (`events`). */
  resource: InventoryResource;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const paragraph = { color: colors.muted, lineHeight: 22 };
  return (
    <View style={{ gap: 10 }}>
      <Heading title="Historial del elemento" />
      {resource.events?.map((event) => (
        <View key={event.id}>
          <Text style={{ color: colors.text }}>
            {actionNames[event.action] ?? event.action} ·{" "}
            {formatDate(event.createdAt)} · {event.firstName} {event.lastName}
          </Text>
          <Text style={paragraph}>
            Total:{" "}
            {event.previousTotal === null
              ? event.total
              : `${event.previousTotal} → ${event.total}`}
          </Text>
          <Text style={paragraph}>
            Fuera de servicio:{" "}
            {event.previousUnavailable === null
              ? event.unavailable
              : `${event.previousUnavailable} → ${event.unavailable}`}
          </Text>
          {!!event.note && <Text style={paragraph}>{event.note}</Text>}
        </View>
      ))}
      <Button title="Cerrar historial" variant="quiet" onPress={onClose} />
    </View>
  );
}
