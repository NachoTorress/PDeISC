/**
 * Tarjeta lateral del plano de la demostración para la pieza elegida: el
 * proyecto confirmado que ocupa la mesa, o la descripción de la pieza
 * (puesto libre, banco, toma o rótulo).
 */
import { Text } from "react-native";
import { Button, Card, Chip } from "../ui";
import ProjectArt from "../ProjectArt";
import { useTheme } from "../../contexts/ThemeContext";
import type { Furniture, Project, Role } from "../../lib/types";

/** Título visible de cada tipo de pieza. */
function itemTitle(item: Furniture) {
  if (item.type === "table") return `Puesto ${item.id}`;
  if (item.type === "bench") return "Banco";
  return item.type === "label" ? item.text : "Punto eléctrico";
}

/** Explicación de cada tipo de pieza. */
function itemText(item: Furniture) {
  if (item.type === "table")
    return "Este puesto está disponible. Se ocupa cuando un profesor confirma un proyecto.";
  if (item.type === "power")
    return "Referencia de ubicación. La capacidad eléctrica debe revisarla personal habilitado.";
  if (item.type === "label")
    return "Referencia de zona para orientarte dentro de este espacio.";
  return "Mobiliario del espacio. No es un puesto de inscripción.";
}

export function MapSelectionCard({
  project,
  item,
  role,
  onSelectProject,
  onNewProject,
  onClose,
}: {
  /** Proyecto confirmado en la mesa elegida, si hay. */
  project?: Project;
  item: Furniture;
  role: Role;
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const paragraph = { color: colors.muted, lineHeight: 22 };
  const title = {
    color: colors.text,
    fontSize: 22,
    fontWeight: "600" as const,
  };
  if (project)
    return (
      <Card>
        <Chip label={`Puesto ${project.furnitureId} · ocupado`} />
        <ProjectArt project={project} />
        <Text style={title}>{project.name}</Text>
        <Text style={paragraph}>{project.description}</Text>
        <Text style={paragraph}>{project.course}</Text>
        <Button
          title="Ver proyecto"
          endIcon="external"
          onPress={() => onSelectProject(project.id)}
        />
      </Card>
    );
  return (
    <Card>
      <Text style={title}>{itemTitle(item)}</Text>
      <Text style={paragraph}>{itemText(item)}</Text>
      {role === "student" && item.type === "table" && (
        <Button title="Cargar un proyecto" icon="plus" onPress={onNewProject} />
      )}
      <Button
        title="Volver al resumen"
        icon="arrowLeft"
        variant="quiet"
        onPress={onClose}
      />
    </Card>
  );
}
