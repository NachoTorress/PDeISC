/**
 * Detalle del espacio o de la pieza elegida en el plano (modo consulta):
 * puesto libre u ocupado, proyecto confirmado, fecha de creación y, para
 * administración, el botón para dar de baja el espacio.
 */
import { Text } from "react-native";
import { Button, Card, Heading } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDate } from "../../lib/format";
import type { Furniture, Space } from "../../lib/types";
import type { SharedSpace } from "../../lib/sharedSpaces";

type Booth = SharedSpace["booths"][number];

/** Título visible de la pieza elegida. */
function title(chosen: Furniture | undefined, booth: boolean) {
  if (!chosen) return "Distribución compartida";
  if (chosen.type === "table")
    return `${booth ? "Puesto" : "Mesa"} ${chosen.id}`;
  if (chosen.type === "label") return chosen.text ?? "Zona";
  return chosen.type === "bench" ? "Banco" : "Punto eléctrico";
}

export function SpaceDetailsCard({
  space,
  chosen,
  chosenBooth,
  boothIds,
  canEdit,
  busy,
  onSelectProject,
  onArchive,
}: {
  space: Space;
  chosen?: Furniture;
  chosenBooth?: Booth;
  boothIds: string[];
  canEdit: boolean;
  busy: boolean;
  onSelectProject: (id: string) => void;
  onArchive: () => void;
}) {
  const { colors } = useTheme();
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  const isBooth = !!chosen && boothIds.includes(chosen.id);
  return (
    <Card>
      <Heading title={title(chosen, isBooth)} />
      <Text style={paragraph}>
        {chosen
          ? chosen.type === "table"
            ? isBooth
              ? chosenBooth?.projectId
                ? `Proyecto confirmado: ${chosenBooth.projectName}`
                : "Disponible para solicitarlo al presentar un proyecto. El puesto se reserva cuando un profesor confirma la propuesta."
              : "Mesa de mobiliario, sin inscripción de proyectos."
            : "Elemento de la distribución del espacio."
          : `${space.furniture.length} ${space.furniture.length === 1 ? "elemento" : "elementos"} · ${boothIds.length} ${boothIds.length === 1 ? "puesto habilitado" : "puestos habilitados"}`}
      </Text>
      {chosenBooth?.projectId && (
        <Button
          title="Ver proyecto confirmado"
          variant="secondary"
          onPress={() => onSelectProject(chosenBooth.projectId!)}
        />
      )}
      <Text style={paragraph}>Creado el {formatDate(space.createdAt)}</Text>
      <Text style={paragraph}>
        Las posiciones son relativas al plano. Los puntos eléctricos requieren
        revisión de personal habilitado.
      </Text>
      {canEdit && (
        <Button
          title="Dar de baja espacio"
          variant="danger"
          icon="trash"
          disabled={busy}
          onPress={onArchive}
        />
      )}
    </Card>
  );
}
