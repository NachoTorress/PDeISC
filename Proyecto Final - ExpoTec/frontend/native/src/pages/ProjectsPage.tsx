import { useState } from "react";
import { Text, View } from "react-native";
import ContentGrid from "../components/ContentGrid";
import { useTheme } from "../contexts/ThemeContext";
import { useDemo } from "../hooks/useDemo";
import { formatDate, statusLabel } from "../lib/format";
import { isProjectMember, projectMembers } from "../lib/team";
import type { Project, ProjectStatus } from "../lib/types";
import ProjectArt from "../components/ProjectArt";
import { Icon } from "../components/Icon";
import {
  Button,
  Card,
  Chip,
  Choice,
  Field,
  PageHeading,
  ActionRow,
  InlineConfirm,
  Screen,
} from "../components/ui";
import { STUDENT } from "../components/projectFormModel";

type Props = {
  onSelect: (id: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
};

/** Lista las propuestas accesibles al perfil activo y confirma la eliminación dentro de su tarjeta. */
export default function ProjectsPage({ onSelect, onCreate, onEdit }: Props) {
  const { state, role, mutate, notify } = useDemo();
  const { colors } = useTheme();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "all">("all");
  const [deleting, setDeleting] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const visible = state.projects.filter((project) => {
    if (role === "guest") return project.status === "approved";
    if (role === "student")
      return isProjectMember(project, STUDENT) || project.status === "approved";
    if (role === "teacher") return project.teachers.includes("Martín García");
    return true;
  });
  const filtered = visible.filter(
    (project) =>
      (role === "guest" || status === "all" || project.status === status) &&
      `${project.name} ${projectMembers(project).join(" ")} ${project.course} ${project.subjects.join(" ")}`
        .toLocaleLowerCase("es")
        .includes(search.trim().toLocaleLowerCase("es")),
  );
  const canEdit = (project: Project) =>
    role === "student" &&
    isProjectMember(project, STUDENT) &&
    project.status !== "approved";
  const deleteProject = (project: Project) => {
    const error = mutate({ type: "deleteProject", id: project.id });
    if (error) {
      setDeleteError(error);
      return;
    }
    setDeleting("");
    setDeleteError("");
    notify("Proyecto eliminado.");
  };
  return (
    <Screen>
      <PageHeading
        icon="projects"
        tone="info"
        title={role === "guest" ? "Proyectos de la ExpoTec" : "Proyectos"}
        subtitle={
          role === "teacher"
            ? "Revisá las propuestas en las que sos responsable."
            : role === "student"
              ? "Presentá tu idea, elegí tu lugar y seguí la revisión."
              : "Conocé las propuestas, los equipos y su lugar en la muestra."
        }
      />
      {role === "student" && (
        <Button title="Presentar proyecto" icon="plus" onPress={onCreate} />
      )}
      <Field label="Buscar proyectos" value={search} onChangeText={setSearch} />
      {role !== "guest" && (
        <Choice
          label="Filtrar por estado"
          value={status}
          options={(["all", "approved", "pending", "changes"] as const).map(
            (value) => ({
              value,
              label: `${value === "all" ? "Todos" : statusLabel[value]} (${visible.filter((project) => value === "all" || project.status === value).length})`,
            }),
          )}
          onChange={(value) => setStatus(value as ProjectStatus | "all")}
        />
      )}
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
        {filtered.length} {filtered.length === 1 ? "proyecto" : "proyectos"}
      </Text>
      <ContentGrid testID="projects-grid" minItemWidth={300} maxColumns={4}>
        {filtered.map((project) => {
          const members = projectMembers(project);
          const space = state.spaces.find(
            (item) => item.id === project.spaceId,
          );
          const hasLoanHistory = state.loans.some(
            (loan) => loan.projectId === project.id,
          );
          return (
            <Card
              key={project.id}
              testID={`project-card-${project.id}`}
              style={{ width: "100%", flex: 1, padding: 16, gap: 10 }}
            >
              {project.image && (
                <View
                  testID={`project-image-${project.id}`}
                  style={{ width: "100%" }}
                >
                  <ProjectArt project={project} height={132} bounded />
                </View>
              )}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                }}
              >
                {!project.image && (
                  <View
                    testID={`project-icon-${project.id}`}
                    style={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      borderRadius: 10,
                      backgroundColor:
                        project.category === "plant"
                          ? colors.selectedContainer
                          : project.category === "energy"
                            ? colors.accentContainer
                            : colors.infoContainer,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Icon
                      name={project.category}
                      color={
                        project.category === "plant"
                          ? colors.onSelectedContainer
                          : project.category === "energy"
                            ? colors.accent
                            : colors.info
                      }
                      size={22}
                    />
                  </View>
                )}
                <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
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
                  <Chip
                    label={statusLabel[project.status]}
                    tone={
                      project.status === "approved"
                        ? "success"
                        : project.status === "pending"
                          ? "warning"
                          : "error"
                    }
                  />
                </View>
              </View>
              <Text
                numberOfLines={3}
                style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}
              >
                {project.description}
              </Text>
              <View style={{ gap: 4 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 6,
                  }}
                >
                  <Icon name="users" size={16} color={colors.muted} />
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 13,
                      lineHeight: 19,
                      flex: 1,
                    }}
                  >
                    {members.length}{" "}
                    {members.length === 1 ? "integrante" : "integrantes"} ·{" "}
                    {project.course}
                  </Text>
                </View>
                <Text
                  style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}
                >
                  {members.join(" · ")}
                </Text>
                <Text
                  style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}
                >
                  {space?.name ?? "Espacio no disponible"} · Mesa{" "}
                  {project.furnitureId} · {formatDate(project.createdAt)}
                </Text>
              </View>
              {(canEdit(project) || role === "admin") && hasLoanHistory && (
                <Text
                  style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}
                >
                  Se conserva este proyecto porque tiene historial de préstamos.
                </Text>
              )}
              <ActionRow compact footer>
                <Button
                  title="Ver proyecto"
                  style={{ minWidth: 100 }}
                  accessibilityLabel={`Ver proyecto ${project.name}`}
                  icon="arrowRight"
                  variant="secondary"
                  onPress={() => onSelect(project.id)}
                />
                {canEdit(project) && (
                  <Button
                    title="Editar"
                    style={{ minWidth: 100 }}
                    accessibilityLabel={`Editar proyecto ${project.name}`}
                    icon="edit"
                    variant="quiet"
                    onPress={() => onEdit(project.id)}
                  />
                )}
                {(canEdit(project) || role === "admin") &&
                  !hasLoanHistory &&
                  deleting !== project.id && (
                    <Button
                      title="Eliminar"
                      style={{ minWidth: 100 }}
                      accessibilityLabel={`Eliminar proyecto ${project.name}`}
                      icon="trash"
                      variant="danger"
                      onPress={() => {
                        setDeleting(project.id);
                        setDeleteError("");
                      }}
                    />
                  )}
              </ActionRow>
              {(canEdit(project) || role === "admin") &&
                !hasLoanHistory &&
                deleting === project.id && (
                  <InlineConfirm
                    text={`¿Estás seguro de que querés eliminar «${project.name}»?`}
                    confirmLabel="Sí, eliminar proyecto"
                    onConfirm={() => deleteProject(project)}
                    onCancel={() => {
                      setDeleting("");
                      setDeleteError("");
                    }}
                  />
                )}
              {deleting === project.id && !!deleteError && (
                <Text
                  accessibilityRole="alert"
                  style={{ color: colors.error, fontSize: 14, lineHeight: 21 }}
                >
                  {deleteError}
                </Text>
              )}
            </Card>
          );
        })}
      </ContentGrid>
      {!filtered.length && (
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "600" }}>
            {search || status !== "all"
              ? "No encontramos proyectos"
              : "Todavía no hay propuestas"}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            {search || status !== "all"
              ? "Probá con otro nombre o cambiá el filtro."
              : "Las propuestas aparecerán acá cuando los estudiantes las presenten."}
          </Text>
          {(search || status !== "all") && (
            <Button
              title="Limpiar filtros"
              icon="close"
              variant="secondary"
              onPress={() => {
                setSearch("");
                setStatus("all");
              }}
            />
          )}
        </View>
      )}
    </Screen>
  );
}
