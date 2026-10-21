import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Button, Card, Chip, Choice, Heading, Screen } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatDate } from "../lib/format";
import { sharedStatusLabel } from "../lib/sharedProjects";
import type { ProjectSummary } from "../lib/sharedProjects";

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
      <Heading
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
        <Button
          title="Actualizar proyectos"
          variant="quiet"
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
      {visible.map((project) => (
        <Card key={project.id}>
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
          <Text style={{ color: colors.muted }}>
            {project.spaceName} · {project.furnitureId} ·{" "}
            {formatDate(project.createdAt)}
          </Text>
          <Button
            title={`Ver proyecto ${project.name}`}
            variant="secondary"
            onPress={() => onSelect(project.id, privateView)}
          />
        </Card>
      ))}
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
