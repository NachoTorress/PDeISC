import { useCallback, useEffect, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useDemo } from "../hooks/useDemo";
import { useTheme } from "../contexts/ThemeContext";
import { Button, Card, Chip, Heading, Screen } from "../components/ui";
import { PresentationVideo } from "../components/PresentationVideo";
import ProjectArt from "../components/ProjectArt";
import { projectMembers } from "../lib/team";

export default function PresentationPage({ onBack }: { onBack: () => void }) {
  const { state, notify } = useDemo();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const focused = useIsFocused();
  const projects = state.projects.filter(
    (project) => project.status === "approved",
  );
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  const project = projects.length
    ? projects[index % projects.length]
    : undefined;
  const hasVideo = !!project?.video && !failed.includes(project.id);
  const next = useCallback(
    () =>
      setIndex((previous) =>
        projects.length ? (previous + 1) % projects.length : 0,
      ),
    [projects.length],
  );
  const fail = useCallback(() => {
    if (!project) return;
    setFailed((previous) =>
      previous.includes(project.id) ? previous : [...previous, project.id],
    );
    notify("El video no está disponible. Mostramos la ficha del proyecto.");
  }, [project, notify]);
  useEffect(() => {
    if (!playing || !focused || !projects.length || hasVideo) return;
    const timer = setTimeout(next, 8000);
    return () => clearTimeout(timer);
  }, [playing, focused, projects.length, hasVideo, index, next]);
  return (
    <Screen>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Button
          title="Volver"
          icon="arrowLeft"
          variant="quiet"
          onPress={onBack}
        />
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          {projects.length ? (index % projects.length) + 1 : 0} /{" "}
          {projects.length}
        </Text>
      </View>
      {project ? (
        <View
          style={{ flexDirection: width > 900 ? "row" : "column", gap: 28 }}
        >
          <View
            style={{
              flex:
                width > 900 && (hasVideo || project.image) ? 1.4 : undefined,
              width:
                width > 900 && !hasVideo && !project.image ? 156 : undefined,
              justifyContent: "center",
            }}
          >
            {hasVideo ? (
              <PresentationVideo
                key={`${project.id}-${index}`}
                uri={project.video}
                playing={playing && focused}
                onEnd={next}
                onError={fail}
              />
            ) : (
              <ProjectArt
                project={project}
                bounded
                height={
                  project.image
                    ? width > 900
                      ? Math.max(260, Math.min(520, height - 300))
                      : 230
                    : width > 900
                      ? 160
                      : 132
                }
              />
            )}
          </View>
          <View style={{ flex: width > 900 ? 1 : undefined, gap: 18 }}>
            <Chip label={project.course} />
            <Heading title={project.name} subtitle={project.description} />
            <Text style={{ color: colors.text, fontSize: 16, lineHeight: 25 }}>
              Equipo: {projectMembers(project).join(" · ")}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {project.subjects.map((subject) => (
                <Chip key={subject} label={subject} />
              ))}
            </View>
            <Text
              style={{ color: colors.text, fontSize: 20, fontWeight: "600" }}
            >
              {state.spaces.find((space) => space.id === project.spaceId)?.name}{" "}
              · Puesto {project.furnitureId}
            </Text>
            {failed.includes(project.id) && (
              <Text
                style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}
              >
                Video no disponible · presentación con ficha
              </Text>
            )}
          </View>
        </View>
      ) : (
        <Card>
          <Heading
            title="Todavía no hay proyectos confirmados"
            subtitle="La presentación se completa cuando se confirman los proyectos."
          />
        </Card>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
        <Button
          title="Anterior"
          icon="arrowLeft"
          variant="secondary"
          disabled={!projects.length}
          onPress={() =>
            setIndex(
              (previous) => (previous - 1 + projects.length) % projects.length,
            )
          }
        />
        <Button
          title={playing ? "Pausar presentación" : "Iniciar presentación"}
          icon={playing ? "pause" : "play"}
          disabled={!projects.length}
          onPress={() => setPlaying(!playing)}
        />
        <Button
          title="Siguiente"
          icon="arrowRight"
          variant="secondary"
          disabled={!projects.length}
          onPress={next}
        />
      </View>
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
        Las fichas avanzan cada 8 segundos. Los videos avanzan al terminar. Girá
        el dispositivo para verlo en horizontal.
      </Text>
    </Screen>
  );
}
