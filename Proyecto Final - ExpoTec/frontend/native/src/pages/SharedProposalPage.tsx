import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NavigationAction } from "@react-navigation/native";
import {
  Button,
  Card,
  CheckRow,
  Choice,
  Field,
  Heading,
  InlineConfirm,
  Screen,
} from "../components/ui";
import SharedPeoplePicker from "../components/SharedPeoplePicker";
import SharedResourcePicker from "../components/SharedResourcePicker";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import {
  proposalDraft,
  proposalErrors,
  proposalRequest,
} from "../lib/sharedProjects";
import type { ProposalDraft, SharedProject } from "../lib/sharedProjects";
import type { SharedSpace, SpaceSummary } from "../lib/sharedSpaces";

export default function SharedProposalPage({
  projectId,
  onSaved,
  onBack,
  onAccount,
}: {
  projectId?: string;
  onSaved: (id: string) => void;
  onBack: () => void;
  onAccount: () => void;
}) {
  const { client, user, ready } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [draft, setDraft] = useState<ProposalDraft | null>(null);
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [spaceId, setSpaceId] = useState("");
  const [space, setSpace] = useState<SharedSpace | null>(null);
  const [loading, setLoading] = useState(true);
  const [spaceLoading, setSpaceLoading] = useState(false);
  const [spaceRevision, setSpaceRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [subject, setSubject] = useState("");
  const [removeSubject, setRemoveSubject] = useState<string | null>(null);
  const [clearLinks, setClearLinks] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [leaveAction, setLeaveAction] = useState<NavigationAction | null>(null);
  const [savedId, setSavedId] = useState("");
  const [draftFor, setDraftFor] = useState("");
  const loaded = useRef("");
  const working = useRef(false);
  const canSubmit = ready && !!user?.roles.includes("student");
  usePreventRemove(dirty && !savedId, ({ data }) =>
    setLeaveAction(data.action),
  );
  useEffect(() => {
    if (savedId) onSaved(savedId);
  }, [savedId, onSaved]);
  useEffect(() => {
    if (!ready) return;
    if (!user?.roles.includes("student")) {
      setLoading(false);
      return;
    }
    const key = `${user.id}:${projectId ?? "new"}`;
    if (loaded.current === key) return;
    let active = true;
    setLoading(true);
    Promise.all([
      client.query<{ spaces: SpaceSummary[] }>("/api/spaces/query"),
      projectId
        ? client.send<{ project: SharedProject }>(
            `/api/projects/${projectId}/query`,
            {},
          )
        : Promise.resolve(undefined),
    ])
      .then(([options, result]) => {
        if (!active) return;
        if (
          result &&
          (!result.project.members.some((member) => member.id === user.id) ||
            !["pending", "changes"].includes(result.project.status))
        )
          throw new Error(
            "Esta propuesta no se puede editar con tu cuenta y su estado actual.",
          );
        setDraft(proposalDraft(user, result?.project));
        setDraftFor(key);
        setDirty(false);
        setTouched({});
        setServerFields({});
        setSubmitted(false);
        setSpaces(options.spaces);
        setSpaceId(
          result?.project.booth.spaceId ?? options.spaces[0]?.id ?? "",
        );
        loaded.current = key;
        setError("");
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "No pudimos cargar la propuesta.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client, user, ready, projectId]);
  useEffect(() => {
    let active = true;
    setSpace(null);
    setSpaceLoading(!!spaceId);
    if (!spaceId) return;
    client
      .query<{ space: SharedSpace }>(`/api/spaces/${spaceId}/query`)
      .then((result) => {
        if (active) setSpace(result.space);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "No pudimos consultar los puestos.",
          );
      })
      .finally(() => {
        if (active) setSpaceLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client, spaceId, spaceRevision]);
  const validation = draft && user ? proposalErrors(draft, user.id) : {};
  if (
    draft &&
    !spaceLoading &&
    !space?.booths.some(
      (booth) =>
        booth.id === draft.boothId &&
        (!booth.projectId || booth.projectId === projectId),
    )
  )
    validation.boothId = "Elegí un puesto habilitado que esté disponible.";
  const fieldError = (key: string) =>
    serverFields[key] ||
    (submitted || touched[key] ? validation[key] : undefined);
  function change<K extends keyof ProposalDraft>(
    key: K,
    value: ProposalDraft[K],
  ) {
    const field =
      key === "members" ? "memberIds" : key === "teachers" ? "teacherIds" : key;
    setDraft((current) => (current ? { ...current, [key]: value } : null));
    setDirty(true);
    setTouched((current) => ({ ...current, [field]: true }));
    setServerFields((current) => ({ ...current, [field]: "" }));
    setError("");
  }
  async function submit() {
    setSubmitted(true);
    if (
      !draft ||
      !canSubmit ||
      working.current ||
      spaceLoading ||
      Object.keys(validation).length
    )
      return;
    working.current = true;
    setBusy(true);
    setError("");
    setServerFields({});
    try {
      const result = await client.send<{ project: SharedProject }>(
        projectId ? `/api/projects/${projectId}/save` : "/api/projects/create",
        proposalRequest(draft),
      );
      setSavedId(result.project.id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos enviar la propuesta.",
      );
      if (cause instanceof AuthError) setServerFields(cause.fields);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  if (loading || !ready)
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
        <Text style={paragraph}>Preparando la propuesta…</Text>
      </Screen>
    );
  if (!canSubmit)
    return (
      <Screen>
        <Heading
          title="Presentar un proyecto"
          subtitle="Ingresá con una cuenta de alumno para continuar."
        />
        <Button title="Ir a Mi cuenta" onPress={onAccount} />
        <Button title="Volver" variant="quiet" onPress={onBack} />
      </Screen>
    );
  return (
    <Screen>
      <View
        style={{ width: "100%", maxWidth: 860, alignSelf: "center", gap: 16 }}
      >
        <Heading
          title={projectId ? "Editar propuesta" : "Presentar un proyecto"}
          subtitle="Completá los datos del equipo y elegí el puesto que querés solicitar."
        />
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={{ ...paragraph, color: colors.error }}
          >
            {error}
          </Text>
        )}
        {draft && user && draftFor === `${user.id}:${projectId ?? "new"}` && (
          <View style={{ gap: 16 }} pointerEvents={busy ? "none" : "auto"}>
            <Card>
              <Field
                label="Nombre del proyecto"
                value={draft.name}
                onChangeText={(value) => change("name", value)}
                maxLength={120}
                error={fieldError("name")}
              />
              <Field
                label="Descripción del proyecto"
                value={draft.description}
                onChangeText={(value) => change("description", value)}
                multiline
                maxLength={5000}
                error={fieldError("description")}
                hint="Contá qué hace el proyecto, cómo funciona y qué van a presentar. Mínimo 20 caracteres."
              />
              <Field
                label="Curso y especialidad"
                value={draft.course}
                onChangeText={(value) => change("course", value)}
                maxLength={100}
                error={fieldError("course")}
              />
              <Field
                label="Enlace directo a la imagen"
                value={draft.imageUrl}
                onChangeText={(value) => change("imageUrl", value)}
                keyboardType="url"
                maxLength={2048}
                error={fieldError("imageUrl")}
                hint="URL HTTPS de una imagen que el equipo pueda compartir públicamente."
              />
              <Field
                label="Enlace al video (opcional)"
                value={draft.videoUrl}
                onChangeText={(value) => change("videoUrl", value)}
                keyboardType="url"
                maxLength={2048}
                error={fieldError("videoUrl")}
                hint="Enlace HTTPS directo a un archivo MP4 o WebM."
              />
              <CheckRow
                label="Proyecto informático"
                checked={draft.isSoftwareProject}
                onChange={(value) => {
                  if (!value && (draft.githubUrl || draft.websiteUrl))
                    setClearLinks(true);
                  else change("isSoftwareProject", value);
                }}
              />
              {clearLinks && (
                <InlineConfirm
                  text="¿Desactivar proyecto informático y quitar sus enlaces de esta propuesta?"
                  confirmLabel="Quitar enlaces"
                  onCancel={() => setClearLinks(false)}
                  onConfirm={() => {
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            isSoftwareProject: false,
                            githubUrl: "",
                            websiteUrl: "",
                          }
                        : null,
                    );
                    setDirty(true);
                    setClearLinks(false);
                  }}
                />
              )}
              {draft.isSoftwareProject && (
                <>
                  <Field
                    label="Repositorio de GitHub (opcional)"
                    value={draft.githubUrl}
                    onChangeText={(value) => change("githubUrl", value)}
                    keyboardType="url"
                    maxLength={2048}
                    error={fieldError("githubUrl")}
                  />
                  <Field
                    label="Página del proyecto (opcional)"
                    value={draft.websiteUrl}
                    onChangeText={(value) => change("websiteUrl", value)}
                    keyboardType="url"
                    maxLength={2048}
                    error={fieldError("websiteUrl")}
                  />
                </>
              )}
            </Card>
            <SharedPeoplePicker
              role="student"
              people={draft.members}
              protectedIds={[draft.creatorId, user.id]}
              excludedIds={draft.teachers.map((person) => person.id)}
              disabled={busy}
              error={fieldError("memberIds")}
              onChange={(people) => change("members", people)}
            />
            <SharedPeoplePicker
              role="teacher"
              people={draft.teachers}
              excludedIds={draft.members.map((person) => person.id)}
              disabled={busy}
              error={fieldError("teacherIds")}
              onChange={(people) => change("teachers", people)}
            />
            <Card>
              <Heading title="Materias" />
              {draft.subjects.map((item) => (
                <View key={item} style={{ gap: 8 }}>
                  <Text style={{ color: colors.text, fontSize: 16 }}>
                    {item}
                  </Text>
                  {removeSubject === item ? (
                    <InlineConfirm
                      text={`¿Quitar ${item} de esta propuesta?`}
                      confirmLabel="Quitar materia"
                      onCancel={() => setRemoveSubject(null)}
                      onConfirm={() => {
                        change(
                          "subjects",
                          draft.subjects.filter((value) => value !== item),
                        );
                        setRemoveSubject(null);
                      }}
                    />
                  ) : (
                    <Button
                      title={`Quitar materia ${item}`}
                      variant="quiet"
                      onPress={() => setRemoveSubject(item)}
                    />
                  )}
                </View>
              ))}
              <Field
                label="Nombre de la materia"
                value={subject}
                onChangeText={setSubject}
                maxLength={80}
                error={fieldError("subjects")}
              />
              <Button
                title="Agregar materia"
                variant="secondary"
                disabled={
                  subject.trim().length < 2 || draft.subjects.length >= 10
                }
                onPress={() => {
                  const next = subject.trim();
                  if (
                    draft.subjects.some(
                      (value) =>
                        value.localeCompare(next, "es", {
                          sensitivity: "base",
                        }) === 0,
                    )
                  ) {
                    setError("Esa materia ya está incluida.");
                    return;
                  }
                  change("subjects", [...draft.subjects, next]);
                  setSubject("");
                }}
              />
            </Card>
            <Card>
              <Heading
                title="Puesto solicitado"
                subtitle="La solicitud queda pendiente hasta que un profesor responsable la confirme."
              />
              <Button
                title="Actualizar puestos"
                variant="quiet"
                disabled={spaceLoading || busy}
                onPress={() => {
                  setSpaceLoading(true);
                  void client
                    .query<{ spaces: SpaceSummary[] }>("/api/spaces/query")
                    .then((result) => {
                      setSpaces(result.spaces);
                      setSpaceId((current) =>
                        result.spaces.some((item) => item.id === current)
                          ? current
                          : (result.spaces[0]?.id ?? ""),
                      );
                      setSpaceRevision((current) => current + 1);
                      setError("");
                    })
                    .catch((cause) =>
                      setError(
                        cause instanceof Error
                          ? cause.message
                          : "No pudimos actualizar los puestos.",
                      ),
                    )
                    .finally(() => setSpaceLoading(false));
                }}
              />
              {spaces.length ? (
                <Choice
                  label="Espacio"
                  value={spaceId}
                  options={spaces.map((item) => ({
                    value: item.id,
                    label: item.name,
                  }))}
                  onChange={(id) => {
                    setSpaceId(id);
                    change("boothId", "");
                  }}
                />
              ) : (
                <Text style={paragraph}>
                  La organización todavía no cargó espacios. El borrador se
                  conserva mientras permanezcas en esta pantalla; actualizá los
                  puestos para volver a consultar.
                </Text>
              )}
              {spaceLoading ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                space && (
                  <Choice
                    label="Puesto"
                    value={draft.boothId}
                    options={space.booths
                      .filter(
                        (booth) =>
                          !booth.projectId || booth.projectId === projectId,
                      )
                      .map((booth) => ({
                        value: booth.id,
                        label: booth.furnitureId,
                      }))}
                    onChange={(id) => change("boothId", id)}
                  />
                )
              )}
              {!!fieldError("boothId") && (
                <Text style={{ color: colors.error }}>
                  {fieldError("boothId")}
                </Text>
              )}
              {space &&
                !spaceLoading &&
                !space.booths.some(
                  (booth) => !booth.projectId || booth.projectId === projectId,
                ) && (
                  <Text style={paragraph}>
                    No quedan puestos disponibles en este espacio.
                  </Text>
                )}
            </Card>
            <SharedResourcePicker
              requests={draft.resources}
              disabled={busy}
              error={fieldError("resources")}
              onChange={(resources) => change("resources", resources)}
            />
            <Button
              title={
                busy
                  ? "Enviando propuesta…"
                  : projectId
                    ? "Guardar y reenviar"
                    : "Enviar propuesta"
              }
              icon="save"
              disabled={busy || spaceLoading}
              onPress={() => {
                void submit();
              }}
            />
          </View>
        )}
        <Button
          title="Volver sin enviar"
          variant="quiet"
          disabled={busy}
          onPress={onBack}
        />
        {leaveAction && (
          <InlineConfirm
            text="¿Descartar el borrador de esta propuesta y salir?"
            confirmLabel="Descartar y salir"
            onCancel={() => setLeaveAction(null)}
            onConfirm={() => {
              const action = leaveAction;
              setLeaveAction(null);
              navigation.dispatch(action);
            }}
          />
        )}
      </View>
    </Screen>
  );
}
