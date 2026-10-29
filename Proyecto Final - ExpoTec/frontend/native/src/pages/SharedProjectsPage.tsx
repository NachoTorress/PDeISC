/**
 * Pantalla del sistema compartido (datos de la API). Lista de proyectos: muestra pública o proyectos propios y a revisar.
 */
import { useCallback, useRef, useState } from "react";
import ContentGrid from "../components/ContentGrid";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Button,
  Card,
  Chip,
  Choice,
  Screen,
  RefreshButton,
  ActionRow,
  PageHeading,
} from "../components/ui";
import GalleryImage from "../components/GalleryImage";
import { Icon } from "../components/Icon";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatDate } from "../lib/format";
import { sharedStatusLabel } from "../lib/sharedProjects";
import type { ProjectSummary } from "../lib/sharedProjects";

/** Lista paginada con acceso a la ficha y a la propuesta. */
export default function SharedProjectsPage({
  onSelect,
  onCreate,
  onAccount,
}: {
  onSelect: (id: string, privateView: boolean) => void;
  onCreate: () => void;
  onAccount: () => void;
}) {
  const { client, user, ready } = useAuth();
  const { colors } = useTheme();
  const [mode, setMode] = useState("public");
  const privateView = ready && !!user && mode === "private";
  const scope = privateView ? user!.id : "public";
  const [loadedScope, setLoadedScope] = useState("");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [more, setMore] = useState(false);
  const revision = useRef(0);
  /** Carga `POST /api/projects/query` (privada) o `/public/query`. */
  const load = useCallback(
    async (offset = 0) => {
      const request = ++revision.current;
      setLoading(true);
      setError("");
      try {
        const body = { limit: 25, offset };
        const result = privateView
          ? await client.send<{ projects: ProjectSummary[] }>(
              "/api/projects/query",
              body,
            )
          : await client.query<{ projects: ProjectSummary[] }>(
              "/api/projects/public/query",
              body,
            );
        if (request !== revision.current) return;
        setProjects((current) =>
          offset
            ? [
                ...current,
                ...result.projects.filter(
                  (item) =>
                    !current.some((previous) => previous.id === item.id),
                ),
              ]
            : result.projects,
        );
        setLoadedScope(scope);
        setMore(result.projects.length === 25);
      } catch (cause) {
        if (request === revision.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "No pudimos consultar los proyectos.",
          );
      } finally {
        if (request === revision.current) setLoading(false);
      }
    },
    [client, privateView, scope],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        revision.current++;
      };
    }, [load]),
  );
  const visible = loadedScope === scope ? projects : [];
  return (
    <Screen>
      <PageHeading
        icon="projects"
        tone="info"
        title="Proyectos de ExpoTec"
        subtitle={
          privateView
            ? "Propuestas del equipo y revisiones asignadas"
            : "Conocé los proyectos confirmados de la exposición."
        }
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {ready && user?.roles.includes("student") && (
          <Button title="Presentar proyecto" icon="plus" onPress={onCreate} />
        )}
        <RefreshButton
          label="Actualizar proyectos"
          loading={loading}
          disabled={loading}
          onPress={() => {
            void load();
          }}
        />
      </View>
      {ready && user ? (
        <Choice
          label="Vista de proyectos"
          value={mode}
          options={[
            { value: "public", label: "Muestra pública" },
            {
              value: "private",
              label: user.roles.includes("admin")
                ? "Gestionar proyectos"
                : "Mis proyectos y revisiones",
            },
          ]}
          onChange={setMode}
        />
      ) : (
        <Button
          title="Ingresar para presentar o revisar"
          variant="quiet"
          onPress={onAccount}
        />
      )}
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, lineHeight: 22 }}
        >
          {error}
        </Text>
      )}
      {loading && !visible.length ? (
        <ActivityIndicator color={colors.primary} />
      ) : !visible.length && !error ? (
        <Card>
          <Text style={{ color: colors.muted, lineHeight: 22 }}>
            {privateView
              ? "Todavía no tenés propuestas ni revisiones asignadas."
              : "Todavía no hay proyectos confirmados para la muestra pública."}
          </Text>
        </Card>
      ) : null}
      <ContentGrid testID="projects-grid" minItemWidth={300} maxColumns={4}>
        {visible.map((project) => (
          <Card
            key={project.id}
            testID={`project-card-${project.id}`}
            style={{ flex: 1, padding: 16, gap: 10 }}
          >
            {project.imageUrl && (
              <View testID={`project-image-${project.id}`}>
                <GalleryImage
                  uri={project.imageUrl}
                  caption={`Imagen de ${project.name}`}
                  height={132}
                  bounded
                />
              </View>
            )}
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                gap: 10,
              }}
            >
              {!project.imageUrl && (
                <View
                  testID={`project-icon-${project.id}`}
                  style={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    borderRadius: 10,
                    backgroundColor: colors.infoContainer,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="projects" color={colors.info} size={22} />
                </View>
              )}
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 18,
                    lineHeight: 24,
                    fontWeight: "600",
                  }}
                >
                  {project.name}
                </Text>
                <Text
                  style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}
                >
                  {project.course}
                </Text>
              </View>
            </View>
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
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
              {project.spaceName} · {project.furnitureId} ·{" "}
              {formatDate(project.createdAt)}
            </Text>
            <ActionRow compact footer>
              <Button
                title="Ver proyecto"
                accessibilityLabel={`Ver proyecto ${project.name}`}
                variant="secondary"
                onPress={() => onSelect(project.id, privateView)}
              />
            </ActionRow>
          </Card>
        ))}
      </ContentGrid>
      {more && loadedScope === scope && (
        <Button
          title={loading ? "Cargando…" : "Cargar más proyectos"}
          disabled={loading}
          variant="secondary"
          onPress={() => {
            void load(projects.length);
          }}
        />
      )}
    </Screen>
  );
}
