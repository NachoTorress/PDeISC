import { useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { useDemo } from "../hooks/useDemo";
import { newId, today } from "../lib/helpers";
import { isProjectMember } from "../lib/team";
import type { Project } from "../lib/types";
import ProjectLinksEditor from "../components/ProjectLinksEditor";
import ProjectMediaPicker from "../components/ProjectMediaPicker";
import {
  ProjectPlaceFields,
  ProjectProposalFields,
} from "../components/ProjectProposalFields";
import ProjectTeamEditor from "../components/ProjectTeamEditor";
import {
  makeProjectDraft,
  projectDraftErrors,
  STUDENT,
} from "../components/projectFormModel";
import type { ProjectDraft } from "../components/projectFormModel";
import { Button, Heading, Screen } from "../components/ui";

type Props = { projectId?: string; onDone: () => void };

/** La clave crea un borrador nuevo cuando cambia el proyecto elegido. */
export default function ProjectFormPage(props: Props) {
  return <ProjectForm key={props.projectId ?? "new"} {...props} />;
}

function ProjectForm({ projectId, onDone }: Props) {
  const { state, role, mutate, notify } = useDemo();
  const { colors } = useTheme();
  const expanded = useWindowDimensions().width >= 1100;
  const editing = state.projects.find((project) => project.id === projectId);
  const [draft, setDraft] = useState(() => makeProjectDraft(state, editing));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempt, setSubmitAttempt] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [imageError, setImageError] = useState("");
  const [readingImage, setReadingImage] = useState(false);
  const errors = projectDraftErrors(draft, state, editing);
  const errorFor = (key: string) => {
    const touchedKey = key.startsWith("resource-") ? "resources" : key;
    return touched[touchedKey] || submitAttempt ? (errors[key] ?? "") : "";
  };
  const update = <K extends keyof ProjectDraft>(
    key: K,
    value: ProjectDraft[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setTouched((current) => ({ ...current, [key]: true }));
    setSaveError("");
  };
  const submit = () => {
    setSubmitAttempt(true);
    if (Object.keys(errors).length || imageError || readingImage) return;
    const project: Project = {
      ...draft,
      id: editing?.id ?? newId(),
      student: editing?.student ?? STUDENT,
      name: draft.name.trim(),
      course: draft.course.trim(),
      description: draft.description.trim(),
      members: draft.members.map((member) =>
        member.trim().replace(/\s+/g, " ").normalize("NFC"),
      ),
      subjects: [
        ...new Set(
          draft.subjects
            .split(",")
            .map((subject) => subject.trim())
            .filter(Boolean),
        ),
      ],
      resources: Object.fromEntries(
        state.resources
          .map((resource) => [
            resource.id,
            Number(draft.resources[resource.id] ?? 0),
          ])
          .filter(([, value]) => Number(value) > 0),
      ),
      video: draft.video.trim(),
      isSoftwareProject: draft.isSoftwareProject,
      githubUrl: draft.isSoftwareProject ? draft.githubUrl.trim() : "",
      websiteUrl: draft.isSoftwareProject ? draft.websiteUrl.trim() : "",
      status: "pending",
      feedback: "",
      createdAt: editing?.createdAt ?? today(),
    };
    const error = mutate({ type: "saveProject", project });
    if (error) {
      setSaveError(error);
      return;
    }
    notify(
      editing
        ? "Proyecto actualizado y enviado a revisión."
        : "Proyecto enviado a revisión. El lugar se reserva cuando lo confirme el profesor.",
    );
    onDone();
  };
  if (
    role !== "student" ||
    (projectId && !editing) ||
    (editing &&
      (!isProjectMember(editing, STUDENT) || editing.status === "approved"))
  ) {
    return (
      <Screen>
        <Heading
          title="Propuesta no disponible"
          subtitle="Solo podés editar tus proyectos pendientes o con cambios solicitados."
        />
        <Button
          title="Volver"
          icon="arrowLeft"
          onPress={onDone}
          variant="secondary"
        />
      </Screen>
    );
  }
  return (
    <Screen>
      <Button
        title="Volver a proyectos"
        icon="arrowLeft"
        variant="quiet"
        onPress={onDone}
      />
      <Heading
        title={editing ? "Editar proyecto" : "Presentar proyecto"}
        subtitle="El profesor revisará la propuesta y confirmará el lugar."
      />
      <View style={{ flexDirection: expanded ? "row" : "column", gap: 28 }}>
        <View style={{ flex: expanded ? 1 : undefined, minWidth: 0, gap: 24 }}>
          <ProjectProposalFields
            draft={draft}
            update={update}
            errorFor={errorFor}
          />
          <ProjectTeamEditor
            members={draft.members}
            onChange={(value) => update("members", value)}
            creator={editing?.student ?? STUDENT}
            currentStudent={STUDENT}
            submitAttempt={submitAttempt}
          />
          <ProjectLinksEditor
            isSoftwareProject={draft.isSoftwareProject}
            githubUrl={draft.githubUrl}
            websiteUrl={draft.websiteUrl}
            submitAttempt={submitAttempt}
            onChange={(value) => {
              setDraft((current) => ({ ...current, ...value }));
              setSaveError("");
            }}
          />
        </View>
        <View style={{ flex: expanded ? 1 : undefined, minWidth: 0, gap: 24 }}>
          <ProjectMediaPicker
            image={draft.image}
            video={draft.video}
            editing={!!editing}
            imageError={errorFor("image")}
            submitAttempt={submitAttempt}
            onImageChange={(value) => update("image", value)}
            onVideoChange={(value) => update("video", value)}
            onBusyChange={setReadingImage}
            onErrorChange={setImageError}
          />
          <ProjectPlaceFields
            draft={draft}
            update={update}
            errorFor={errorFor}
            state={state}
            editing={editing}
          />
        </View>
      </View>
      {!!saveError && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, fontSize: 14, lineHeight: 21 }}
        >
          {saveError}
        </Text>
      )}
      {submitAttempt && Object.keys(errors).length > 0 && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, fontSize: 14, lineHeight: 21 }}
        >
          Revisá los campos marcados para enviar tu propuesta.
        </Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        <Button
          title="Cancelar"
          icon="close"
          variant="secondary"
          onPress={onDone}
        />
        <Button
          title={editing ? "Guardar y enviar a revisión" : "Enviar a revisión"}
          icon={editing ? "save" : "check"}
          onPress={submit}
          disabled={readingImage}
        />
      </View>
    </Screen>
  );
}
