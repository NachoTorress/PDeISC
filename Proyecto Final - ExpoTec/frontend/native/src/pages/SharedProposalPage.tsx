/**
 * Pantalla del sistema compartido (datos de la API REST). Propuesta de proyecto en cuatro pasos (proyecto, equipo, puesto y revisión).
 * Conserva el borrador al volver a un paso anterior y avisa si otra persona
 * modificó el proyecto o tomó el puesto mientras se completaba.
 */
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import type { ScrollView } from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NavigationAction } from "@react-navigation/native";
import {
  ActionRow,
  Button,
  Card,
  Choice,
  Heading,
  InlineConfirm,
  Screen,
  RefreshButton,
} from "../components/ui";
import SharedPeoplePicker from "../components/SharedPeoplePicker";
import SharedResourcePicker from "../components/SharedResourcePicker";
import ProjectSubjectsPicker from "../components/ProjectSubjectsPicker";
import SharedProjectDetails from "../components/SharedProjectDetails";
import ProposalStepNavigation from "../components/ProposalStepNavigation";
import ProposalReview from "../components/ProposalReview";
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
import {
  firstProposalIssueStep,
  proposalFieldLabels,
  proposalFlowErrors,
  proposalIssuesForStep,
  proposalStepForField,
  proposalSteps,
} from "../lib/proposalSteps";
import type { ProposalPending } from "../lib/proposalSteps";

const noPending: ProposalPending = {
  students: false,
  teachers: false,
  subjects: false,
};

/** Formulario guiado de alta o edición de una propuesta. */
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
  const scroll = useRef<Pick<ScrollView, "scrollTo">>(null);
  const [draft, setDraft] = useState<ProposalDraft | null>(null);
  const [draftFor, setDraftFor] = useState("");
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [spaceId, setSpaceId] = useState("");
  const [space, setSpace] = useState<SharedSpace | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadRevision, setLoadRevision] = useState(0);
  const [spaceLoading, setSpaceLoading] = useState(false);
  const [spaceRevision, setSpaceRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const busy = saving || uploading;
  const [error, setError] = useState("");
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(noPending);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [conflict, setConflict] = useState(false);
  const [reloadConfirm, setReloadConfirm] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [leaveAction, setLeaveAction] = useState<NavigationAction | null>(null);
  const [savedId, setSavedId] = useState("");
  const loaded = useRef("");
  const working = useRef(false);
  const canSubmit = ready && !!user?.roles.includes("student");

  usePreventRemove(
    (dirty || uploading || Object.values(pending).some(Boolean)) && !savedId,
    ({ data }) => setLeaveAction(data.action),
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
      client.query<{ spaces: SpaceSummary[] }>("/api/spaces", {}, "GET"),
      projectId
        ? client.send<{ project: SharedProject }>(
            `/api/projects/${projectId}`,
            {},
        "GET",
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
        const next = proposalDraft(user, result?.project);
        setDraft(next);
        setDraftFor(key);
        setDirty(false);
        setTouched({});
        setServerFields({});
        setSubmitted(false);
        setAttempted([]);
        setPending(noPending);
        setStep(0);
        setFeedback(
          result?.project.status === "changes"
            ? (result.project.feedback ?? "")
            : "",
        );
        setResourcesOpen(next.resources.length > 0);
        setConflict(false);
        setError("");
        setSpaces(options.spaces);
        setSpaceId(
          result?.project.booth.spaceId ?? options.spaces[0]?.id ?? "",
        );
        loaded.current = key;
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
  }, [client, user, ready, projectId, loadRevision]);

  useEffect(() => {
    let active = true;
    setSpace(null);
    setSpaceLoading(!!spaceId);
    if (!spaceId) return;
    client
      .query<{ space: SharedSpace }>(`/api/spaces/${spaceId}`, {}, "GET")
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
  const issues = proposalFlowErrors(
    {
      ...validation,
      ...Object.fromEntries(
        Object.entries(serverFields).filter(([, message]) => message),
      ),
    },
    pending,
  );
  const fieldError = (key: string) =>
    serverFields[key] ||
    (submitted || touched[key] || attempted.includes(proposalStepForField(key))
      ? issues[key]
      : undefined);
  const currentIssues = proposalIssuesForStep(issues, step);
  const complete = [0, 1, 2].map(
    (index) => proposalIssuesForStep(issues, index).length === 0,
  );

  /** Vuelve al inicio del formulario. */
  function top() {
    requestAnimationFrame(() =>
      scroll.current?.scrollTo({ y: 0, animated: false }),
    );
  }
  /** Marca texto escrito sin agregar en personas o materias. */
  function pendingChange(key: keyof ProposalPending, value: boolean) {
    setPending((current) =>
      current[key] === value ? current : { ...current, [key]: value },
    );
  }
  /** Actualiza un campo del borrador. */
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
  /** Cambia de paso; para avanzar exige que el paso actual sea válido. */
  function goToStep(target: number) {
    if (busy) return;
    if (target > step) {
      const first = firstProposalIssueStep(issues, target);
      setAttempted((current) => [
        ...new Set([
          ...current,
          ...Array.from({ length: target }, (_, index) => index),
        ]),
      ]);
      if (first !== null) {
        setStep(first);
        top();
        return;
      }
      if (target === 3 && spaceLoading) {
        setError("Esperá a que termine la consulta de puestos.");
        return;
      }
    }
    setStep(target);
    setError("");
    top();
  }
  /** Reintenta la carga inicial. */
  function retryLoad() {
    loaded.current = "";
    setError("");
    setDraft(null);
    setLoadRevision((value) => value + 1);
  }
  /** Actualiza la lista de espacios y puestos sin perder el borrador. */
  async function refreshPlaces() {
    setSpaceLoading(true);
    try {
      const result = await client.query<{ spaces: SpaceSummary[] }>(
        "/api/spaces",
        {}, "GET",
      );
      setSpaces(result.spaces);
      setSpaceId((current) =>
        result.spaces.some((item) => item.id === current)
          ? current
          : (result.spaces[0]?.id ?? ""),
      );
      setSpaceRevision((value) => value + 1);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos actualizar los puestos.",
      );
    } finally {
      setSpaceLoading(false);
    }
  }
  /** Envía la propuesta (`POST /api/projects` o `PUT /api/projects/:id`). */
  async function submit() {
    setSubmitted(true);
    setAttempted([0, 1, 2]);
    const first = firstProposalIssueStep(issues);
    if (first !== null) {
      setStep(first);
      top();
      return;
    }
    if (
      !draft ||
      !canSubmit ||
      busy ||
      working.current ||
      spaceLoading ||
      step !== 3
    )
      return;
    working.current = true;
    setSaving(true);
    setError("");
    setServerFields({});
    setConflict(false);
    try {
      const result = await client.send<{ project: SharedProject }>(
        projectId ? `/api/projects/${projectId}` : "/api/projects",
        proposalRequest(draft),
        projectId ? "PUT" : "POST",
      );
      setSavedId(result.project.id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos enviar la propuesta.",
      );
      if (cause instanceof AuthError) {
        setServerFields(cause.fields);
        setConflict(cause.status === 409);
        const target = firstProposalIssueStep(cause.fields);
        if (target !== null) {
          setStep(target);
          if (target === 2) setResourcesOpen(true);
        }
      }
      top();
    } finally {
      working.current = false;
      setSaving(false);
    }
  }

  const paragraph = { color: colors.muted, fontSize: 14, lineHeight: 21 };
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
        {!user && <Button title="Ingresar" onPress={onAccount} />}
        <Button title="Volver" variant="quiet" onPress={onBack} />
      </Screen>
    );

  return (
    <Screen scrollRef={scroll}>
      <View
        style={{ width: "100%", maxWidth: 860, alignSelf: "center", gap: 16 }}
      >
        <Heading
          title={projectId ? "Editar propuesta" : "Presentar un proyecto"}
          subtitle="Completá cada paso. Al final vas a revisar todo antes de enviarlo."
        />
        {!!feedback && (
          <Card>
            <Heading title="Correcciones solicitadas" />
            <Text style={{ color: colors.text, lineHeight: 22 }}>
              {feedback}
            </Text>
          </Card>
        )}
        {!!error && (
          <Card>
            <Text
              accessibilityRole="alert"
              style={{ ...paragraph, color: colors.error }}
            >
              {error}
            </Text>
            {!draft && (
              <Button
                title="Reintentar carga"
                variant="secondary"
                onPress={retryLoad}
              />
            )}
            {conflict && (
              <>
                <Text style={paragraph}>
                  Tu borrador se conserva. Podés revisar los datos y actualizar
                  los puestos antes de volver a enviar.
                </Text>
                <Button
                  title="Revisar puesto y elementos"
                  variant="secondary"
                  onPress={() => {
                    setStep(2);
                    top();
                  }}
                />
                {projectId && (
                  <Button
                    title="Recargar propuesta guardada"
                    variant="quiet"
                    onPress={() => setReloadConfirm(true)}
                  />
                )}
              </>
            )}
            {reloadConfirm && (
              <InlineConfirm
                text="¿Descartar estos cambios y cargar la última propuesta guardada?"
                confirmLabel="Descartar y recargar"
                onCancel={() => setReloadConfirm(false)}
                onConfirm={() => {
                  setReloadConfirm(false);
                  setDirty(false);
                  retryLoad();
                }}
              />
            )}
          </Card>
        )}
        {draft && user && draftFor === `${user.id}:${projectId ?? "new"}` && (
          <>
            <ProposalStepNavigation
              step={step}
              complete={[...complete, complete.every(Boolean)]}
              disabled={busy}
              onSelect={goToStep}
            />
            <View accessibilityLiveRegion="polite" style={{ gap: 3 }}>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                Paso {step + 1} de 4
              </Text>
              <Heading title={proposalSteps[step].subtitle} />
            </View>
            {(submitted || attempted.includes(step)) &&
              currentIssues.length > 0 && (
                <Card
                  testID="proposal-step-errors"
                  style={{ borderColor: colors.error }}
                >
                  <Text
                    accessibilityRole="alert"
                    style={{ color: colors.error, fontWeight: "600" }}
                  >
                    Revisá estos datos para continuar:
                  </Text>
                  {currentIssues.map(([field, message]) => (
                    <Text
                      key={field}
                      style={{ ...paragraph, color: colors.error }}
                    >
                      {proposalFieldLabels[field] ?? "Propuesta"}: {message}
                    </Text>
                  ))}
                </Card>
              )}
            <View pointerEvents={saving ? "none" : "auto"} style={{ gap: 16 }}>
              <View
                testID="proposal-step-project"
                style={{ display: step === 0 ? "flex" : "none" }}
              >
                <SharedProjectDetails
                  draft={draft}
                  saving={saving}
                  errorFor={fieldError}
                  onChange={change}
                  onUploadChange={setUploading}
                />
              </View>
              <View
                testID="proposal-step-team"
                style={{ display: step === 1 ? "flex" : "none", gap: 16 }}
              >
                <SharedPeoplePicker
                  role="student"
                  people={draft.members}
                  protectedIds={[draft.creatorId, user.id]}
                  excludedIds={draft.teachers.map((person) => person.id)}
                  disabled={busy}
                  error={fieldError("memberIds")}
                  onChange={(people) => change("members", people)}
                  onPendingChange={(value) => pendingChange("students", value)}
                />
                <SharedPeoplePicker
                  role="teacher"
                  people={draft.teachers}
                  excludedIds={draft.members.map((person) => person.id)}
                  disabled={busy}
                  error={fieldError("teacherIds")}
                  onChange={(people) => change("teachers", people)}
                  onPendingChange={(value) => pendingChange("teachers", value)}
                />
                <ProjectSubjectsPicker
                  value={draft.subjects}
                  onChange={(subjects) => change("subjects", subjects)}
                  disabled={busy}
                  error={fieldError("subjects")}
                  onPendingChange={(value) => pendingChange("subjects", value)}
                />
              </View>
              <View
                testID="proposal-step-place"
                style={{ display: step === 2 ? "flex" : "none", gap: 16 }}
              >
                <Card>
                  <Heading
                    title="Elegí dónde presentar"
                    subtitle="Solicitar un puesto todavía no lo reserva. Un profesor confirmará la propuesta."
                  />
                  <RefreshButton
                    label="Actualizar puestos"
                    loading={spaceLoading}
                    disabled={spaceLoading || busy}
                    onPress={() => void refreshPlaces()}
                  />
                  {spaces.length ? (
                    <Choice
                      label="Espacio"
                      value={spaceId}
                      options={spaces.map((item) => ({
                        value: item.id,
                        label: item.name,
                      }))}
                      disabled={busy}
                      onChange={(id) => {
                        setSpaceId(id);
                        change("boothId", "");
                      }}
                    />
                  ) : (
                    <Text style={paragraph}>
                      La organización todavía no cargó espacios. El borrador se
                      conserva; actualizá los puestos para volver a consultar.
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
                            label: `Puesto ${booth.furnitureId}`,
                          }))}
                        disabled={busy}
                        onChange={(id) => change("boothId", id)}
                      />
                    )
                  )}
                  {!!fieldError("boothId") && (
                    <Text
                      accessibilityRole="alert"
                      style={{ color: colors.error }}
                    >
                      {fieldError("boothId")}
                    </Text>
                  )}
                  {space &&
                    !spaceLoading &&
                    !space.booths.some(
                      (booth) =>
                        !booth.projectId || booth.projectId === projectId,
                    ) && (
                      <Text style={paragraph}>
                        No quedan puestos disponibles en este espacio. Elegí
                        otro espacio o actualizá la disponibilidad.
                      </Text>
                    )}
                </Card>
                <Button
                  title={
                    resourcesOpen
                      ? "Ocultar elementos solicitados"
                      : draft.resources.length
                        ? `Ver elementos solicitados (${draft.resources.length})`
                        : "¿Necesitan elementos de la escuela? (opcional)"
                  }
                  variant="secondary"
                  endIcon={resourcesOpen ? "chevronUp" : "chevronDown"}
                  disabled={busy}
                  onPress={() => setResourcesOpen(!resourcesOpen)}
                />
                <View
                  style={{
                    display:
                      resourcesOpen || !!fieldError("resources")
                        ? "flex"
                        : "none",
                  }}
                >
                  <SharedResourcePicker
                    requests={draft.resources}
                    disabled={busy}
                    error={fieldError("resources")}
                    onChange={(resources) => change("resources", resources)}
                  />
                </View>
              </View>
              <View
                testID="proposal-step-review"
                style={{ display: step === 3 ? "flex" : "none" }}
              >
                <ProposalReview
                  draft={draft}
                  spaceName={space?.name ?? "Espacio pendiente"}
                  boothName={`Puesto ${space?.booths.find((booth) => booth.id === draft.boothId)?.furnitureId ?? "pendiente"}`}
                  active={step === 3}
                  onEdit={goToStep}
                />
              </View>
            </View>
            <ActionRow>
              {step > 0 && (
                <Button
                  title="Anterior"
                  icon="arrowLeft"
                  variant="secondary"
                  disabled={busy}
                  onPress={() => goToStep(step - 1)}
                />
              )}
              {step < 3 ? (
                <Button
                  title={step === 2 ? "Revisar propuesta" : "Continuar"}
                  endIcon="arrowRight"
                  disabled={busy || (step === 2 && spaceLoading)}
                  onPress={() => goToStep(step + 1)}
                />
              ) : (
                <Button
                  title={
                    saving
                      ? "Enviando propuesta…"
                      : projectId
                        ? "Guardar y reenviar"
                        : "Enviar propuesta"
                  }
                  icon="save"
                  disabled={busy || spaceLoading}
                  onPress={() => void submit()}
                />
              )}
            </ActionRow>
            {uploading && (
              <Text accessibilityLiveRegion="polite" style={paragraph}>
                Esperá a que termine la foto o cancelá su carga para continuar.
              </Text>
            )}
          </>
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
