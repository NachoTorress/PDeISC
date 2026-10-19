import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Linking, Text, View } from "react-native";
import {
  Button,
  Card,
  Chip,
  Field,
  Heading,
  InlineConfirm,
  Screen,
} from "../components/ui";
import ProjectVideo from "../components/ProjectVideo";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatDate } from "../lib/format";
import { sharedStatusLabel } from "../lib/sharedProjects";
import type { SharedProject } from "../lib/sharedProjects";

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
  const [imageError, setImageError] = useState(false);
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
    setImageError(false);
    const query = privateView
      ? client.send<{ project: SharedProject }>(
          `/api/projects/${projectId}/query`,
          {},
        )
      : client.query<{ project: SharedProject }>(
          `/api/projects/public/${projectId}/query`,
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
  async function review() {
    if (!confirm || !project?.version || working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await client.send<{ project: SharedProject }>(
        `/api/projects/${projectId}/${confirm === "cancel" ? "cancel" : "review"}`,
        confirm === "cancel"
          ? { version: project.version }
          : { version: project.version, action: confirm, note: note.trim() },
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
          <Button
            title="Actualizar ficha"
            variant="quiet"
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
            <Button title="Ir a Mi cuenta" onPress={onAccount} />
          </Card>
        )}
        {project && (
          <>
            <Card>
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
              {imageError ? (
                <Text style={paragraph}>
                  No pudimos cargar la imagen. Podés volver a intentarlo con
                  Actualizar ficha.
                </Text>
              ) : (
                <Image
                  key={`${project.imageUrl}:${revision}`}
                  source={{ uri: project.imageUrl }}
                  accessibilityLabel={`Imagen del proyecto ${project.name}`}
                  resizeMode="contain"
                  onError={() => setImageError(true)}
                  style={{
                    width: "100%",
                    height: 240,
                    backgroundColor: colors.surfaceVariant,
                    borderRadius: 12,
                  }}
                />
              )}
              <Text
                style={{ color: colors.text, fontSize: 16, lineHeight: 25 }}
              >
                {project.description}
              </Text>
              <Text style={paragraph}>
                {project.booth.spaceName} · Puesto {project.booth.furnitureId}
              </Text>
              <Text style={paragraph}>
                Presentado el {formatDate(project.createdAt)}
              </Text>
              <Text style={paragraph}>
                Equipo:{" "}
                {project.members
                  .map((person) => `${person.firstName} ${person.lastName}`)
                  .join(", ")}
              </Text>
              <Text style={paragraph}>
                Profesores:{" "}
                {project.teachers
                  .map((person) => `${person.firstName} ${person.lastName}`)
                  .join(", ")}
              </Text>
              <Text style={paragraph}>
                Materias: {project.subjects.join(", ")}
              </Text>
              {!!project.videoUrl && (
                <ProjectVideo
                  key={project.videoUrl}
                  uri={project.videoUrl}
                  showPresentationHint={false}
                />
              )}
              {!!project.githubUrl && (
                <Button
                  title="Abrir repositorio de GitHub"
                  variant="secondary"
                  icon="external"
                  onPress={() => open(project.githubUrl)}
                />
              )}
              {!!project.websiteUrl && (
                <Button
                  title="Abrir página del proyecto"
                  variant="secondary"
                  icon="external"
                  onPress={() => open(project.websiteUrl)}
                />
              )}
            </Card>
            {privateView && project.resources && (
              <Card>
                <Heading
                  title={
                    project.status === "approved"
                      ? "Elementos reservados"
                      : "Elementos solicitados"
                  }
                />
                {!project.resources.length && (
                  <Text style={paragraph}>
                    Este proyecto no solicita elementos del inventario.
                  </Text>
                )}
                {project.resources.map((item) => (
                  <View key={item.resourceId} style={{ gap: 4 }}>
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "600",
                        fontSize: 16,
                      }}
                    >
                      {item.name} · {item.quantity}{" "}
                      {item.quantity === 1 ? "unidad" : "unidades"}
                    </Text>
                    <Text style={paragraph}>
                      {project.status === "approved"
                        ? `Reservadas para este proyecto: ${item.reservedQuantity}.`
                        : project.status === "cancelled"
                          ? "El pedido se conserva como historial; no reserva stock."
                          : `Disponibles para reservar ahora: ${item.available} de ${item.total}.`}
                      {item.archivedAt ? " Elemento dado de baja." : ""}
                      {` Sin devolver de este proyecto: ${item.outstanding}. Fuera de servicio en el inventario: ${item.unavailable}.`}
                    </Text>
                  </View>
                ))}
                {project.status !== "approved" &&
                  project.status !== "cancelled" &&
                  !!project.resources.length && (
                    <Text style={paragraph}>
                      El pedido no descuenta stock. La confirmación comprueba y
                      reserva todos los elementos junto con el puesto.
                    </Text>
                  )}
              </Card>
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
              <Card>
                <Heading title="Historial de revisiones" />
                {project.reviews.map((item) => (
                  <View key={item.id} style={{ gap: 4 }}>
                    <Text style={{ color: colors.text, fontWeight: "600" }}>
                      {(
                        {
                          submit: "Presentación",
                          resubmit: "Reenvío",
                          approve: "Confirmación",
                          changes: "Pedido de cambios",
                          reopen: "Reapertura",
                          cancel: "Cancelación",
                        } as Record<string, string>
                      )[item.action] ?? item.action}{" "}
                      · {formatDate(item.createdAt)}
                    </Text>
                    <Text style={paragraph}>
                      {item.firstName} {item.lastName}
                      {item.note ? ` · ${item.note}` : ""}
                    </Text>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
