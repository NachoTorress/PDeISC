/**
 * Resumen lateral del espacio en la demostración: puestos libres y ocupados,
 * propuestas por confirmar, aviso de seguridad eléctrica y, para
 * administración, la baja de un espacio vacío con confirmación en la tarjeta.
 */
import { useState } from "react";
import { Text } from "react-native";
import { Button, Card, InlineConfirm } from "../ui";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDate } from "../../lib/format";
import type { Project, Role, Space } from "../../lib/types";

export function MapOverview({
  space,
  tables,
  taken,
  pending,
  role,
  canDelete,
  onSelectProject,
  onDelete,
}: {
  space: Space;
  /** Cantidad de mesas del espacio. */
  tables: number;
  /** Mesas ocupadas por proyectos confirmados. */
  taken: number;
  pending: Project[];
  role: Role;
  /** true si el espacio no tiene proyectos y se puede eliminar. */
  canDelete: boolean;
  onSelectProject: (id: string) => void;
  /** Elimina el espacio; devuelve true si se pudo. */
  onDelete: () => boolean;
}) {
  const { colors } = useTheme();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const paragraph = { color: colors.muted, lineHeight: 22 };
  return (
    <>
      <Card>
        <Text
          style={{
            color: colors.text,
            fontSize: 20,
            fontWeight: "600",
          }}
        >
          El espacio, de un vistazo
        </Text>
        <Text
          style={{
            color: colors.primary,
            fontSize: 32,
            fontWeight: "700",
          }}
        >
          {tables - taken}{" "}
          <Text style={{ fontSize: 16, fontWeight: "400" }}>
            puestos libres
          </Text>
        </Text>
        <Text style={paragraph}>
          Puestos ocupados: {taken} de {tables}
        </Text>
        <Text style={paragraph}>
          Puntos eléctricos de ejemplo:{" "}
          {space.furniture.filter((item) => item.type === "power").length}
        </Text>
        <Text style={paragraph}>Creado el {formatDate(space.createdAt)}</Text>
      </Card>
      {pending.length > 0 && role !== "guest" && (
        <Card>
          <Text
            style={{
              color: colors.text,
              fontSize: 20,
              fontWeight: "600",
            }}
          >
            Por confirmar · {pending.length}
          </Text>
          {pending.slice(0, 3).map((project) => (
            <Button
              key={project.id}
              variant="secondary"
              title={`${project.name} · ${project.furnitureId}`}
              endIcon="arrowRight"
              onPress={() => onSelectProject(project.id)}
            />
          ))}
          <Text style={paragraph}>
            El lugar se ocupa después de la confirmación.
          </Text>
        </Card>
      )}
      <Card>
        <Text style={paragraph}>
          Para una ExpoTec segura, la distribución eléctrica debe revisarla
          personal habilitado.
        </Text>
      </Card>
      {role === "admin" && canDelete && (
        <Card>
          {confirmDelete ? (
            <InlineConfirm
              text={`¿Seguro que querés eliminar ${space.name} y su distribución?`}
              confirmLabel="Eliminar espacio"
              onCancel={() => setConfirmDelete(false)}
              onConfirm={() => {
                if (onDelete()) setConfirmDelete(false);
              }}
            />
          ) : (
            <Button
              title="Eliminar espacio vacío"
              icon="trash"
              variant="danger"
              onPress={() => setConfirmDelete(true)}
            />
          )}
        </Card>
      )}
    </>
  );
}
