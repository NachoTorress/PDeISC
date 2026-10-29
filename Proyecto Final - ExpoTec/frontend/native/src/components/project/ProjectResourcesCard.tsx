/**
 * Elementos del inventario pedidos o reservados por un proyecto, con su
 * disponibilidad, unidades sin devolver y unidades fuera de servicio.
 */
import { Text, View } from "react-native";
import { Card, Heading } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";
import type { SharedProject } from "../../lib/sharedProjects";

export function ProjectResourcesCard({
  project,
}: {
  /** Proyecto con `resources` (vista privada). */
  project: SharedProject & {
    resources: NonNullable<SharedProject["resources"]>;
  };
}) {
  const { colors } = useTheme();
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 23 };
  return (
    <Card>
      <Heading
        title={
          project.status === "approved"
            ? "Elementos reservados"
            : "Elementos solicitados"
        }
      />
      {!project.resources.length && (
        <Text style={paragraph}>
          Este proyecto no solicita elementos del inventario.
        </Text>
      )}
      {project.resources.map((item) => (
        <View key={item.resourceId} style={{ gap: 4 }}>
          <Text
            style={{
              color: colors.text,
              fontWeight: "600",
              fontSize: 16,
            }}
          >
            {item.name} · {item.quantity}{" "}
            {item.quantity === 1 ? "unidad" : "unidades"}
          </Text>
          <Text style={paragraph}>
            {project.status === "approved"
              ? `Reservadas para este proyecto: ${item.reservedQuantity}.`
              : project.status === "cancelled"
                ? "El pedido se conserva como historial; no reserva stock."
                : `Disponibles para reservar ahora: ${item.available} de ${item.total}.`}
            {item.archivedAt ? " Elemento dado de baja." : ""}
            {` Sin devolver de este proyecto: ${item.outstanding}. Fuera de servicio en el inventario: ${item.unavailable}.`}
          </Text>
        </View>
      ))}
      {project.status !== "approved" &&
        project.status !== "cancelled" &&
        !!project.resources.length && (
          <Text style={paragraph}>
            El pedido no descuenta stock. La confirmación comprueba y reserva
            todos los elementos junto con el puesto.
          </Text>
        )}
    </Card>
  );
}
