/**
 * Pantalla de la demostración (datos locales del dispositivo, sin servidor). Detalle de un proyecto con revisión del profesor.
 */
import { useState } from "react";
import { Linking, Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useDemo } from "../hooks/useDemo";
import { formatDate, statusLabel } from "../lib/format";
import { safeProjectLink } from "../lib/projectLinks";
import { isProjectMember, projectMembers } from "../lib/team";
import ProjectArt from "../components/ProjectArt";
import ProjectVideo from "../components/ProjectVideo";
import { Icon } from "../components/Icon";
import { STUDENT } from "../components/projectFormModel";
import {
  Button,
  Chip,
  Field,
  Heading,
  InlineConfirm,
  Screen,
  Section,
} from "../components/ui";

type Props = {
  projectId: string;
  onBack: () => void;
  onEdit?: (id: string) => void;
};

/** La ficha recibe un ID y siempre lee el estado vigente, incluidas las revisiones del profesor. */
export default function ProjectDetailPage(props: Props) {
  return <ProjectDetail key={props.projectId} {...props} />;
}

/** Ficha del proyecto y acciones según el perfil. */
function ProjectDetail({ projectId, onBack, onEdit }: Props) {
  const { state, role, mutate, notify } = useDemo();
  const { colors } = useTheme();
  const expanded = useWindowDimensions().width >= 900;
  const [requestingChanges, setRequestingChanges] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackTouched, setFeedbackTouched] = useState(false);
  const [error, setError] = useState("");
  const [reopening, setReopening] = useState(false);
  const project = state.projects.find((item) => item.id === projectId);
  const available =
    project &&
    (role === "guest"
      ? project.status === "approved"
      : role === "teacher"
        ? project.teachers.includes("Martín García")
        : role === "student"
          ? project.status === "approved" || isProjectMember(project, STUDENT)
          : true);
  if (!project || !available)
    return (
      <Screen>
        <Heading
          title="Proyecto no disponible"
          subtitle="La propuesta fue eliminada o tu perfil no puede verla."
        />
        <Button
          title="Volver"
          icon="arrowLeft"
          variant="secondary"
          onPress={onBack}
        />
      </Screen>
    );
  const space = state.spaces.find((item) => item.id === project.spaceId);
  const members = projectMembers(project);
  const assignedTeacher =
    role === "teacher" && project.teachers.includes("Martín García");
  const canReview = assignedTeacher && project.status === "pending";
  const canEdit =
    role === "student" &&
    isProjectMember(project, STUDENT) &&
    project.status !== "approved";
  const resources = state.resources.filter(
    (resource) => (project.resources[resource.id] ?? 0) > 0,
  );
  const hasOpenLoans = state.loans.some(
    (loan) => loan.projectId === project.id && loan.quantity > loan.returned,
  );
  const feedbackError =
    feedback.trim().length < 10
      ? "Explicá qué debe cambiar el equipo con al menos 10 caracteres."
      : feedback.trim().length > 800
        ? "El comentario puede tener hasta 800 caracteres."
        : "";
  const github = project.isSoftwareProject
    ? safeProjectLink(project.githubUrl, "github")
    : "";
  const website = project.isSoftwareProject
    ? safeProjectLink(project.websiteUrl, "website")
    : "";
  const review = (action: "approve" | "changes" | "reopen") => {
    if (action === "changes") {
      setFeedbackTouched(true);
      if (feedbackError) return;
    }
    const result = mutate({
      type: "review",
      id: project.id,
      action,
      ...(action === "changes" ? { feedback: feedback.trim() } : {}),
    });
    if (result) {
      setError(result);
      return;
    }
    notify(
      action === "approve"
        ? "Proyecto confirmado. La mesa quedó reservada."
        : action === "changes"
          ? "Devolución enviada al equipo."
          : "Proyecto reabierto. La mesa quedó disponible.",
    );
    setError("");
    setRequestingChanges(false);
    setReopening(false);
  };
  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
      setError("");
    } catch {
      setError(
        "No pudimos abrir el enlace. Revisá tu conexión e intentá de nuevo.",
      );
    }
  };
  return (
    <Screen>
      <Button
        title="Volver"
        icon="arrowLeft"
        variant="quiet"
        onPress={onBack}
        style={{ alignSelf: "flex-start" }}
      />
      <Heading title={project.name} subtitle={project.course} />
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
      <View
        style={{
          flexDirection: expanded ? "row" : "column",
          gap: 28,
          alignItems: "flex-start",
        }}
      >
        <View style={{ width: expanded ? "32%" : "100%", gap: 22 }}>
          <ProjectArt project={project} compact />
          <Section title={`Integrantes del equipo (${members.length})`}>
            {members.map((member) => (
              <View key={member} style={{ gap: 4 }}>
                <Text style={{ color: colors.text, fontSize: 16 }}>
                  {member}
                </Text>
                {member === project.student && (
                  <Text
                    style={{
                      color: colors.muted,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    Creó la propuesta
                  </Text>
                )}
              </View>
            ))}
          </Section>
        </View>
        <View
          style={{
            flex: expanded ? 1 : undefined,
            width: expanded ? undefined : "100%",
            gap: 22,
          }}
        >
          <Section title="La propuesta">
            <Text style={{ color: colors.text, fontSize: 16, lineHeight: 24 }}>
              {project.description}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
              Ubicación{" "}
              {project.status === "approved" ? "confirmada" : "solicitada"}
            </Text>
            <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>
              {space?.name ?? "Espacio no disponible"} · Mesa{" "}
              {project.furnitureId}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
              Profesores responsables
            </Text>
            <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>
              {project.teachers.join(" · ")}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
              Creado {formatDate(project.createdAt)}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {project.subjects.map((subject) => (
                <Chip key={subject} label={subject} />
              ))}
            </View>
          </Section>
          {(github || website) && (
            <Section title="Explorá el proyecto informático">
              {github && (
                <View style={{ gap: 8 }}>
                  <Button
                    title="Ver repositorio en GitHub"
                    icon="github"
                    variant="secondary"
                    style={{ alignSelf: "flex-start" }}
                    onPress={() => {
                      void openLink(github);
                    }}
                  />
                  <Text
                    selectable
                    style={{
                      color: colors.muted,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {github}
                  </Text>
                </View>
              )}
              {website && (
                <View style={{ gap: 8 }}>
                  <Button
                    title="Visitar la página del proyecto"
                    icon="external"
                    variant="secondary"
                    style={{ alignSelf: "flex-start" }}
                    onPress={() => {
                      void openLink(website);
                    }}
                  />
                  <Text
                    selectable
                    style={{
                      color: colors.muted,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {website}
                  </Text>
                </View>
              )}
            </Section>
          )}
          <Section title="Elementos solicitados">
            {resources.length ? (
              resources.map((resource) => (
                <View
                  key={resource.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <Text style={{ color: colors.text, flex: 1 }}>
                    {resource.name}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {project.resources[resource.id]}
                  </Text>
                </View>
              ))
            ) : (
              <Text
                style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}
              >
                Este proyecto no solicitó elementos del inventario.
              </Text>
            )}
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
              Los préstamos se registran y se devuelven al final de cada día.
            </Text>
          </Section>
          {!!project.video && (
            <Section title="Video explicativo">
              <ProjectVideo uri={project.video} />
            </Section>
          )}
          {!!project.feedback && (
            <Section title="Devolución del profesor">
              <Text style={{ color: colors.text, lineHeight: 24 }}>
                {project.feedback}
              </Text>
            </Section>
          )}
          {canEdit && onEdit && (
            <Button
              title="Editar proyecto"
              icon="edit"
              variant="secondary"
              style={{ alignSelf: "flex-start" }}
              onPress={() => onEdit(project.id)}
            />
          )}
          {canReview && (
            <Section title="Revisión del proyecto">
              <Text
                style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}
              >
                Al confirmar, se reserva la mesa y el proyecto aparece en la
                muestra pública.
              </Text>
              {requestingChanges ? (
                <>
                  <Field
                    label="¿Qué necesita ajustar el equipo?"
                    value={feedback}
                    multiline
                    maxLength={800}
                    autoFocus
                    onChangeText={(value) => {
                      setFeedback(value);
                      setFeedbackTouched(true);
                      setError("");
                    }}
                    error={feedbackTouched ? feedbackError : ""}
                    hint={`${feedback.length}/800 caracteres. La devolución se muestra a los estudiantes.`}
                  />
                  <Button
                    title="Enviar devolución"
                    icon="check"
                    style={{ alignSelf: "flex-start" }}
                    onPress={() => review("changes")}
                  />
                  <Button
                    title="Cancelar devolución"
                    icon="close"
                    variant="secondary"
                    style={{ alignSelf: "flex-start" }}
                    onPress={() => setRequestingChanges(false)}
                  />
                </>
              ) : (
                <>
                  <Button
                    title="Confirmar proyecto"
                    icon="check"
                    style={{ alignSelf: "flex-start" }}
                    onPress={() => review("approve")}
                  />
                  <Button
                    title="Pedir cambios"
                    icon="edit"
                    variant="secondary"
                    style={{ alignSelf: "flex-start" }}
                    onPress={() => {
                      setRequestingChanges(true);
                      setError("");
                    }}
                  />
                </>
              )}
            </Section>
          )}
          {assignedTeacher && project.status === "approved" && (
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Icon name="check" size={20} color={colors.primary} />
              <Text
                style={{
                  color: colors.text,
                  fontSize: 15,
                  lineHeight: 22,
                  flex: 1,
                }}
              >
                Este proyecto ya está confirmado.
              </Text>
            </View>
          )}
          {role === "admin" && project.status === "approved" && (
            <Section title="Gestionar confirmación">
              {hasOpenLoans ? (
                <Text
                  style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}
                >
                  Primero deben devolverse todos los elementos pendientes de
                  este proyecto para poder reabrirlo.
                </Text>
              ) : reopening ? (
                <InlineConfirm
                  text="¿Querés reabrir el proyecto? Se libera su mesa y el equipo debe revisar y reenviar la propuesta. Primero deben devolverse todos los préstamos pendientes."
                  confirmLabel="Sí, reabrir proyecto"
                  onConfirm={() => review("reopen")}
                  onCancel={() => setReopening(false)}
                />
              ) : (
                <Button
                  title="Reabrir proyecto"
                  icon="edit"
                  variant="secondary"
                  style={{ alignSelf: "flex-start" }}
                  onPress={() => {
                    setReopening(true);
                    setError("");
                  }}
                />
              )}
            </Section>
          )}
          {!!error && (
            <Text
              accessibilityRole="alert"
              style={{ color: colors.error, fontSize: 14, lineHeight: 21 }}
            >
              {error}
            </Text>
          )}
        </View>
      </View>
    </Screen>
  );
}
