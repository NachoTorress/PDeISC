/**
 * Ficha principal de un proyecto compartido: estado, nombre, curso, imagen,
 * descripción, puesto, fecha de presentación (DD/MM/AA), equipo, profesores,
 * materias, video y enlaces externos.
 */
import { Text } from "react-native";
import { Button, Card, Chip, Heading } from "../ui";
import ProjectVideo from "../ProjectVideo";
import GalleryImage from "../GalleryImage";
import { useTheme } from "../../contexts/ThemeContext";
import { formatDate } from "../../lib/format";
import { sharedStatusLabel } from "../../lib/sharedProjects";
import type { SharedProject } from "../../lib/sharedProjects";

export function SharedProjectSummary({
  project,
  revision,
  onOpen,
}: {
  project: SharedProject;
  /** Cambia al actualizar la ficha para volver a pedir la imagen. */
  revision: number;
  /** Abre un enlace externo. */
  onOpen: (url: string) => void;
}) {
  const { colors } = useTheme();
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 23 };
  return (
    <Card>
      <Chip
        label={sharedStatusLabel[project.status]}
        tone={
          project.status === "approved"
            ? "success"
            : project.status === "changes"
              ? "warning"
              : "neutral"
        }
      />
      <Heading title={project.name} subtitle={project.course} />
      <GalleryImage
        key={`${project.imageUrl}:${revision}`}
        uri={project.imageUrl}
        caption={`Imagen del proyecto ${project.name}`}
        height={240}
      />
      <Text style={{ color: colors.text, fontSize: 16, lineHeight: 25 }}>
        {project.description}
      </Text>
      <Text style={paragraph}>
        {project.booth.spaceName} · Puesto {project.booth.furnitureId}
      </Text>
      <Text style={paragraph}>
        Presentado el {formatDate(project.createdAt)}
      </Text>
      <Text style={paragraph}>
        Equipo:{" "}
        {project.members
          .map((person) => `${person.firstName} ${person.lastName}`)
          .join(", ")}
      </Text>
      <Text style={paragraph}>
        Profesores:{" "}
        {project.teachers
          .map((person) => `${person.firstName} ${person.lastName}`)
          .join(", ")}
      </Text>
      <Text style={paragraph}>Materias: {project.subjects.join(", ")}</Text>
      {!!project.videoUrl && (
        <ProjectVideo
          key={project.videoUrl}
          uri={project.videoUrl}
          showPresentationHint={false}
        />
      )}
      {!!project.githubUrl && (
        <Button
          title="Abrir repositorio de GitHub"
          variant="secondary"
          icon="external"
          onPress={() => onOpen(project.githubUrl)}
        />
      )}
      {!!project.websiteUrl && (
        <Button
          title="Abrir página del proyecto"
          variant="secondary"
          icon="external"
          onPress={() => onOpen(project.websiteUrl)}
        />
      )}
    </Card>
  );
}
