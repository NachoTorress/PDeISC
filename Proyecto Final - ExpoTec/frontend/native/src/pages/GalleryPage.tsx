/**
 * Pantalla de la demostración (datos locales del dispositivo, sin servidor). Muestra de proyectos confirmados.
 */
import { useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useDemo } from "../hooks/useDemo";
import { useTheme } from "../contexts/ThemeContext";
import { Button, Card, Chip, Field, PageHeading, Screen } from "../components/ui";
import ProjectArt from "../components/ProjectArt";
import { Icon } from "../components/Icon";
import { projectMembers } from "../lib/team";
import { formatDate } from "../lib/format";
import ContentGrid from "../components/ContentGrid";

/** Tarjetas de proyectos confirmados de la demo. */
export default function GalleryPage({
  onSelect,
  onPresentation,
}: {
  onSelect: (id: string) => void;
  onPresentation: () => void;
}) {
  const { state } = useDemo();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const projects = state.projects.filter(
    (project) =>
      project.status === "approved" &&
      `${project.name} ${project.course} ${project.subjects.join(" ")} ${projectMembers(project).join(" ")}`
        .toLocaleLowerCase()
        .includes(query.toLocaleLowerCase()),
  );
  return (
    <Screen>
      <PageHeading icon="projects" tone="info"
        title="Ideas que toman forma."
        subtitle="Conocé los proyectos de nuestra ExpoTec."
      />
      <View
        style={{
          backgroundColor: colors.selectedContainer,
          borderRadius: 12,
          padding: 22,
          gap: 16,
          flexDirection: width > 600 ? "row" : "column",
          alignItems: "center",
        }}
      >
        <View style={{ flex: 1, gap: 12, alignSelf: "stretch" }}>
          <Text
            style={{
              color: colors.text,
              fontSize: 24,
              fontWeight: "600",
              lineHeight: 31,
            }}
          >
            Un año de trabajo.{`\n`}Mucho para descubrir.
          </Text>
          <Text style={{ color: colors.muted, fontSize: 16, lineHeight: 24 }}>
            Recorré las ideas, conocé a sus equipos y encontrá dónde se
            presentan.
          </Text>
          <Chip label="Abierto a todos" />
          <Button
            title="Presentación en TV"
            icon="play"
            onPress={onPresentation}
            style={{ alignSelf: "flex-start" }}
          />
        </View>
      </View>
      <Field
        label="Buscar proyecto, integrante, curso o materia"
        value={query}
        onChangeText={setQuery}
      />
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
        {projects.length} proyectos confirmados
      </Text>
      <ContentGrid minItemWidth={300}>
        {projects.map((project) => (
          <Card key={project.id} style={{ flex: 1 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ver ${project.name}`}
              onPress={() => onSelect(project.id)}
            >
              <ProjectArt project={project} height={176} bounded />
            </Pressable>
            <Chip label={project.course} />
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelect(project.id)}
              accessibilityLabel={`Ver ${project.name}`}
              style={{
                minHeight: 48,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 20,
                  fontWeight: "600",
                  flex: 1,
                }}
              >
                {project.name}
              </Text>
              <Icon name="arrowRight" color={colors.muted} size={20} />
            </Pressable>
            <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 22 }}>
              {project.description}
            </Text>
            <Text style={{ color: colors.text, lineHeight: 21 }}>
              {projectMembers(project).join(" · ")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {project.subjects.map((subject) => (
                <Chip key={subject} label={subject} />
              ))}
            </View>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: "auto" }}>
              {state.spaces.find((space) => space.id === project.spaceId)?.name}{" "}
              · {project.furnitureId} · {formatDate(project.createdAt)}
            </Text>
          </Card>
        ))}
      </ContentGrid>
      {!projects.length && (
        <Card>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>
            No hay proyectos para esa búsqueda
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Probá con otro nombre, curso o materia.
          </Text>
        </Card>
      )}
    </Screen>
  );
}
