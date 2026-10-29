/**
 * Estado y acciones del formulario guiado de propuestas (pantalla
 * `SharedProposalPage`).
 *
 * De dónde viene: la pantalla le pasa el id del proyecto (si se edita) y qué
 * hacer al guardar. A dónde va: devuelve el borrador, los errores por campo y
 * por paso, la lista de espacios y puestos, y las acciones (cambiar un campo,
 * moverse entre pasos, actualizar puestos, enviar).
 *
 * Carga los espacios y, al editar, la propuesta guardada
 * (`POST /api/spaces/query`, `POST /api/projects/:id/query`); consulta los
 * puestos del espacio elegido (`POST /api/spaces/:id/query`) y envía con
 * `POST /api/projects` o `PUT /api/projects/:id`. Conserva el borrador al
 * volver a un paso anterior y pide confirmación antes de salir con cambios.
 */
import { useEffect, useRef, useState } from "react";
import type { ScrollView } from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NavigationAction } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { AuthError } from "../lib/authTypes";
import {
  proposalDraft,
  proposalErrors,
  proposalRequest,
} from "../lib/sharedProjects";
import type { ProposalDraft, SharedProject } from "../lib/sharedProjects";
import type { SpaceSummary } from "../lib/sharedSpaces";
import { useProposalPlaces } from "./useProposalPlaces";
import {
  firstProposalIssueStep,
  proposalFlowErrors,
  proposalIssuesForStep,
  proposalStepForField,
} from "../lib/proposalSteps";
import type { ProposalPending } from "../lib/proposalSteps";

const noPending: ProposalPending = {
  students: false,
  teachers: false,
  subjects: false,
};

/**
 * @param projectId Id de la propuesta a editar; sin id se crea una nueva.
 * @param onSaved Se llama con el id guardado para abrir el proyecto.
 */
export function useSharedProposal(
  projectId: string | undefined,
  onSaved: (id: string) => void,
) {
  const { client, user, ready } = useAuth();
  const [error, setError] = useState("");
  const {
    spaces,
    setSpaces,
    spaceId,
    setSpaceId,
    space,
    spaceLoading,
    refreshPlaces,
  } = useProposalPlaces(client, setError);
  const navigation = useNavigation();
  const scroll = useRef<Pick<ScrollView, "scrollTo">>(null);
  const [draft, setDraft] = useState<ProposalDraft | null>(null);
  const [draftFor, setDraftFor] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadRevision, setLoadRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const busy = saving || uploading;
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(noPending);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [conflict, setConflict] = useState(false);
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
      client.query<{ spaces: SpaceSummary[] }>("/api/spaces/query", {}),
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

  /** Descarta el borrador y continúa con la navegación que se había frenado. */
  function leave() {
    const action = leaveAction;
    setLeaveAction(null);
    if (action) navigation.dispatch(action);
  }

  return {
    user,
    ready,
    canSubmit,
    scroll,
    draft,
    draftReady:
      !!draft && !!user && draftFor === `${user.id}:${projectId ?? "new"}`,
    spaces,
    spaceId,
    setSpaceId,
    space,
    loading,
    spaceLoading,
    saving,
    uploading,
    setUploading,
    busy,
    error,
    feedback,
    conflict,
    setDirty,
    submitted,
    attempted,
    step,
    setStep,
    currentIssues,
    complete,
    fieldError,
    resourcesOpen,
    setResourcesOpen,
    leaveAction,
    setLeaveAction,
    leave,
    top,
    pendingChange,
    change,
    goToStep,
    retryLoad,
    refreshPlaces,
    submit,
  };
}
