/**
 * Pantalla del sistema compartido (datos de la API). Ficha de un proyecto:
 * vista pública o privada, revisión del profesor y cancelación.
 * Las tarjetas de la ficha están en `components/project/`.
 */
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Text, View } from "react-native";
import {
  Button,
  Card,
  Field,
  Heading,
  InlineConfirm,
  Screen,
  RefreshButton,
} from "../components/ui";
import { SharedProjectSummary } from "../components/project/SharedProjectSummary";
import { ProjectResourcesCard } from "../components/project/ProjectResourcesCard";
import { ProjectReviewHistory } from "../components/project/ProjectReviewHistory";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import type { SharedProject } from "../lib/sharedProjects";

/** Muestra el proyecto y las acciones permitidas para la cuenta. */
export default function SharedProjectPage({
  projectId,
  privateView,
  onEdit,
  onBack,
  onAccount,
}: {
  projectId: string;
  privateView: boolean;
  onEdit: () => void;
  onBack: () => void;
  onAccount: () => void;
}) {
  const { client, user, ready } = useAuth();
  const { colors } = useTheme();
  const [source, setSource] = useState<SharedProject | null>(null);
  const [loadedFor, setLoadedFor] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState<
    "approve" | "changes" | "reopen" | "cancel" | null
  >(null);
  const [busy, setBusy] = useState(false);
  const working = useRef(false);
  const scope = privateView ? (user?.id ?? "anonymous") : "public";
  const project = loadedFor === `${projectId}:${scope}` ? source : null;
  useEffect(() => {
    if (privateView && !ready) return;
    if (privateView && !user) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError("");
    setConfirm(null);
    setNote("");
    const query = privateView
      ? client.send<{ project: SharedProject }>(
          `/api/projects/${projectId}/query`,
          {},
        )
      : client.query<{ project: SharedProject }>(
          `/api/projects/public/${projectId}/query`,
          {},
        );
    query
      .then((result) => {
        if (active) {
          setSource(result.project);
          setLoadedFor(`${projectId}:${scope}`);
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "No pudimos abrir el proyecto.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client, projectId, privateView, ready, user?.id, scope, revision]);
  const member =
    !!user?.roles.includes("student") &&
    !!project?.members.some((person) => person.id === user.id);
  const teacher =
    !!user?.roles.includes("teacher") &&
    !!project?.teachers.some((person) => person.id === user.id);
  const admin = !!user?.roles.includes("admin");
  const hasOpenLoans = (project?.openLoanQuantity ?? 0) > 0;
  const editable =
    privateView &&
    member &&
    !!project &&
    ["pending", "changes"].includes(project.status);
  const reviewable = privateView && teacher && project?.status === "pending";
  const reopenable = privateView && admin && project?.status === "approved";
  const cancellable =
    privateView && project?.status !== "cancelled" && (admin || editable);
  /** Envía la revisión (`POST /api/projects/:id/reviews`) o la cancelación (`DELETE /api/projects/:id`). */
  async function review() {
    if (!confirm || !project?.version || working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await client.send<{ project: SharedProject }>(
        confirm === "cancel"
          ? `/api/projects/${projectId}`
          : `/api/projects/${projectId}/reviews`,
        confirm === "cancel"
          ? { version: project.version }
          : { version: project.version, action: confirm, note: note.trim() },
        confirm === "cancel" ? "DELETE" : "POST",
      );
      setSource(result.project);
      setConfirm(null);
      setNote("");
      setNotice(
        result.project.status === "approved"
          ? project.resources?.length
            ? "Proyecto confirmado. El puesto y los elementos quedaron reservados."
            : "Proyecto confirmado. El puesto quedó reservado."
          : result.project.status === "changes"
            ? "Se envió el pedido de cambios al equipo."
            : result.project.status === "cancelled"
              ? "El proyecto quedó cancelado."
              : "La propuesta quedó reabierta y se liberaron el puesto y sus reservas de elementos.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos registrar la revisión.",
      );
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  /** Abre un enlace externo seguro. */
  function open(url: string) {
    void Linking.openURL(url).catch(() =>
      setError("No pudimos abrir el enlace en este dispositivo."),
    );
  }
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 23 };
  return (
    <Screen>
      <View
        style={{ width: "100%", maxWidth: 960, alignSelf: "center", gap: 16 }}
      >
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button
            title="Volver a proyectos"
            icon="arrowLeft"
            variant="secondary"
            onPress={onBack}
          />
          <RefreshButton
            label="Actualizar ficha"
            loading={loading}
            disabled={loading || busy}
            onPress={() => {
              setNotice("");
              setRevision((current) => current + 1);
            }}
          />
        </View>
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={{ ...paragraph, color: colors.error }}
          >
            {error}
          </Text>
        )}
        {!!notice && (
          <Text
            accessibilityLiveRegion="polite"
            style={{ ...paragraph, color: colors.success }}
          >
            {notice}
          </Text>
        )}
        {loading && <ActivityIndicator color={colors.primary} />}
        {privateView && ready && !user && (
          <Card>
            <Text style={paragraph}>
              Ingresá para consultar esta propuesta.
            </Text>
            <Button title="Ingresar" onPress={onAccount} />
          </Card>
        )}
        {project && (
          <>
            <SharedProjectSummary
              project={project}
              revision={revision}
              onOpen={open}
            />
            {privateView && project.resources && (
              <ProjectResourcesCard
                project={{ ...project, resources: project.resources }}
              />
            )}
            {hasOpenLoans && (
              <Text style={{ color: colors.error, lineHeight: 22 }}>
                Este proyecto tiene {project.openLoanQuantity} unidades sin
                devolver. Registrá su devolución antes de reabrir o cancelar el
                proyecto.
              </Text>
            )}
            {!!project.feedback && (
              <Card>
                <Heading
                  title={
                    project.status === "changes"
                      ? "Cambios solicitados"
                      : "Nota de revisión"
                  }
                />
                <Text style={{ color: colors.text, lineHeight: 24 }}>
                  {project.feedback}
                </Text>
              </Card>
            )}
            {editable && (
              <Button
                title="Editar y reenviar propuesta"
                icon="edit"
                disabled={busy}
                onPress={onEdit}
              />
            )}
            {(reviewable || reopenable) && (
              <Card>
                <Heading title="Revisión del proyecto" />
                <Field
                  label="Motivo de revisión"
                  value={note}
                  onChangeText={setNote}
                  multiline
                  maxLength={2000}
                  editable={!busy}
                  hint="Para solicitar cambios o reabrir, explicá el motivo con al menos 10 caracteres."
                  error={
                    note.length > 0 && note.trim().length < 10
                      ? "Escribí al menos 10 caracteres para solicitar cambios o reabrir."
                      : undefined
                  }
                />
                {reviewable && (
                  <>
                    <Button
                      title={
                        project.resources?.length
                          ? "Confirmar proyecto, puesto y elementos"
                          : "Confirmar proyecto y puesto"
                      }
                      icon="check"
                      disabled={busy}
                      onPress={() => setConfirm("approve")}
                    />
                    <Button
                      title="Solicitar cambios"
                      variant="secondary"
                      disabled={busy || note.trim().length < 10}
                      onPress={() => setConfirm("changes")}
                    />
                  </>
                )}
                {reopenable && (
                  <Button
                    title="Reabrir propuesta y liberar reservas"
                    variant="secondary"
                    disabled={busy || hasOpenLoans || note.trim().length < 10}
                    onPress={() => setConfirm("reopen")}
                  />
                )}
              </Card>
            )}
            {cancellable && (
              <Button
                title="Cancelar proyecto"
                variant="danger"
                icon="trash"
                disabled={busy || hasOpenLoans}
                onPress={() => setConfirm("cancel")}
              />
            )}
            {confirm && (
              <View pointerEvents={busy ? "none" : "auto"}>
                <InlineConfirm
                  tone={
                    confirm === "approve" || confirm === "changes"
                      ? "success"
                      : "danger"
                  }
                  text={
                    confirm === "approve"
                      ? `¿Confirmar ${project.name}, ocupar el puesto ${project.booth.furnitureId}${project.resources?.length ? " y reservar todos sus elementos" : ""}?`
                      : confirm === "changes"
                        ? "¿Enviar este pedido de cambios al equipo?"
                        : confirm === "reopen"
                          ? "¿Reabrir la propuesta y liberar el puesto y sus reservas de elementos?"
                          : "¿Cancelar el proyecto? Se conservará su historial y se liberarán el puesto y sus reservas de elementos si estaba confirmado."
                  }
                  confirmLabel={
                    busy
                      ? "Guardando…"
                      : confirm === "approve"
                        ? "Sí, confirmar"
                        : confirm === "changes"
                          ? "Enviar pedido de cambios"
                          : confirm === "reopen"
                            ? "Sí, reabrir"
                            : "Sí, cancelar proyecto"
                  }
                  onCancel={() => setConfirm(null)}
                  onConfirm={() => {
                    void review();
                  }}
                />
              </View>
            )}
            {!!project.reviews?.length && (
              <ProjectReviewHistory reviews={project.reviews} />
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
