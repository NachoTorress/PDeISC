import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NavigationAction } from "@react-navigation/native";
import {
  Button,
  Card,
  Choice,
  Field,
  Heading,
  InlineConfirm,
  RefreshButton,
} from "./ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { lendingErrors } from "../lib/sharedLoans";
import type {
  LendingDraft,
  LendingProject,
  SharedLoan,
} from "../lib/sharedLoans";

export default function SharedLendingForm({
  day,
  onSaved,
  onClose,
}: {
  day: number;
  onSaved: (loan: SharedLoan) => void;
  onClose: () => void;
}) {
  const { client } = useAuth(),
    { colors } = useTheme();
  const navigation = useNavigation();
  const [projects, setProjects] = useState<LendingProject[]>([]);
  const [input, setInput] = useState<LendingDraft>({
    projectId: "",
    resourceId: "",
    recipientId: "",
    quantity: "1",
    note: "",
  });
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [more, setMore] = useState(false);
  const [error, setError] = useState(""),
    [submitted, setSubmitted] = useState(false),
    [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<"deliver" | "close" | null>(null),
    [leaveAction, setLeaveAction] = useState<NavigationAction | null>(null);
  const [saved, setSaved] = useState(false);
  const revision = useRef(0),
    working = useRef(false);
  const dirty = !!input.projectId || !!input.note || input.quantity !== "1";
  usePreventRemove(dirty && !saved, ({ data }) => setLeaveAction(data.action));
  const load = useCallback(
    async (offset = 0) => {
      const request = ++revision.current;
      setLoading(true);
      setError("");
      setConfirm(null);
      try {
        const result = await client.send<{ projects: LendingProject[] }>(
          "/api/loans/projects/query",
          { day, limit: 25, offset },
        );
        if (request === revision.current) {
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
          setMore(result.projects.length === 25);
        }
      } catch (cause) {
        if (request === revision.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "No pudimos consultar las reservas.",
          );
      } finally {
        if (request === revision.current) setLoading(false);
      }
    },
    [client, day],
  );
  useEffect(() => {
    void load();
    return () => {
      revision.current++;
    };
  }, [load]);
  const project = projects.find((item) => item.id === input.projectId),
    resource = project?.resources.find(
      (item) => item.resourceId === input.resourceId,
    );
  const validation = lendingErrors(input, project);
  function change(key: keyof LendingDraft, value: string) {
    setInput((current) => ({ ...current, [key]: value }));
    setSubmitted(true);
    setConfirm(null);
    setError("");
  }
  async function deliver() {
    if (
      !project ||
      working.current ||
      loading ||
      Object.keys(validation).length
    )
      return;
    working.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await client.send<{ loan: SharedLoan }>(
        "/api/loans/deliver",
        {
          projectId: project.id,
          projectVersion: project.version,
          resourceId: input.resourceId,
          recipientId: input.recipientId,
          day,
          quantity: Number(input.quantity),
          note: input.note.trim(),
        },
      );
      setSaved(true);
      onSaved(result.loan);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos registrar la entrega.",
      );
      setConfirm(null);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  const paragraph = { color: colors.muted, lineHeight: 22 };
  return (
    <Card>
      <Heading
        title={`Nueva entrega · Jornada ${day}`}
        subtitle="Registrá la entrega física al integrante del equipo que retira."
      />
      <Text style={paragraph}>
        Una entrega por proyecto, elemento y jornada. Las unidades pendientes de
        cualquier jornada siguen ocupando stock y parte de la reserva del
        proyecto.
      </Text>
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, lineHeight: 22 }}
        >
          {error}
        </Text>
      )}
      <RefreshButton
        label="Actualizar reservas para entregar"
        loading={loading}
        disabled={loading || busy}
        onPress={() => {
          void load();
        }}
      />
      {loading && <ActivityIndicator color={colors.primary} />}
      <Field
        label="Buscar entre los proyectos cargados"
        value={search}
        onChangeText={setSearch}
        editable={!busy}
        maxLength={120}
      />
      <Choice
        label="Proyecto que retira"
        value={input.projectId}
        disabled={busy || loading}
        options={projects
          .filter(
            (item) =>
              item.name
                .toLocaleLowerCase("es")
                .includes(search.trim().toLocaleLowerCase("es")) ||
              item.id === input.projectId,
          )
          .map((item) => ({
            value: item.id,
            label: `${item.name} · ${item.spaceName} ${item.furnitureId}`,
          }))}
        onChange={(value) => {
          setInput((current) => ({
            ...current,
            projectId: value,
            resourceId: "",
            recipientId: "",
          }));
          setSubmitted(false);
          setConfirm(null);
        }}
      />
      {!loading && !projects.length && (
        <Text style={paragraph}>
          No hay proyectos confirmados con elementos reservados.
        </Text>
      )}
      {more && (
        <Button
          title="Cargar más proyectos para entregar"
          variant="secondary"
          disabled={loading || busy}
          onPress={() => {
            void load(projects.length);
          }}
        />
      )}
      {submitted && !!validation.projectId && (
        <Text style={{ color: colors.error }}>{validation.projectId}</Text>
      )}
      {project && (
        <>
          <Choice
            label="Elemento a entregar"
            value={input.resourceId}
            disabled={busy || loading}
            options={project.resources.map((item) => ({
              value: item.resourceId,
              label: `${item.name} · hasta ${item.deliverable} para entregar${item.loanId ? " · entrega ya registrada" : ""}`,
            }))}
            onChange={(value) => change("resourceId", value)}
          />
          {resource && (
            <Text style={paragraph}>
              Reserva: {resource.reservedQuantity} · Sin devolver del proyecto:{" "}
              {resource.outstanding} · Disponibles físicas:{" "}
              {resource.availableToLend} · Fuera de servicio:{" "}
              {resource.unavailable}.
              {resource.loanId
                ? " Ya existe una entrega en esta jornada, incluso si fue devuelta."
                : ""}
            </Text>
          )}
          <Choice
            label="Integrante que retira"
            value={input.recipientId}
            disabled={busy || loading}
            options={project.members.map((member) => ({
              value: member.id,
              label: `${member.firstName} ${member.lastName}`,
            }))}
            onChange={(value) => change("recipientId", value)}
          />
          {!project.members.length && (
            <Text style={{ color: colors.error }}>
              No hay integrantes activos habilitados para retirar.
            </Text>
          )}
          {submitted && !!validation.recipientId && (
            <Text style={{ color: colors.error }}>
              {validation.recipientId}
            </Text>
          )}
        </>
      )}
      <Field
        label="Cantidad a entregar"
        value={input.quantity}
        onChangeText={(value) => change("quantity", value)}
        keyboardType="number-pad"
        editable={!busy}
        maxLength={5}
        error={
          submitted ? validation.quantity || validation.resourceId : undefined
        }
      />
      <Field
        label="Observación de entrega"
        value={input.note}
        onChangeText={(value) => change("note", value)}
        multiline
        editable={!busy}
        maxLength={1000}
        hint="Opcional. La fecha y la persona que entrega se registran automáticamente."
        error={submitted ? validation.note : undefined}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          title="Revisar entrega"
          icon="check"
          disabled={busy || loading}
          onPress={() => {
            setSubmitted(true);
            if (!Object.keys(validation).length) setConfirm("deliver");
          }}
        />
        <Button
          title="Cancelar entrega"
          variant="quiet"
          disabled={busy}
          onPress={() => {
            if (dirty) setConfirm("close");
            else onClose();
          }}
        />
      </View>
      {confirm && (
        <View pointerEvents={busy ? "none" : "auto"}>
          <InlineConfirm
            text={
              confirm === "close"
                ? "¿Descartar el borrador de esta entrega?"
                : `¿Registrar la entrega de ${input.quantity} unidades de ${resource?.name} a ${project?.name} en la jornada ${day}?`
            }
            confirmLabel={
              busy
                ? "Registrando entrega…"
                : confirm === "close"
                  ? "Descartar entrega"
                  : "Confirmar entrega"
            }
            onCancel={() => setConfirm(null)}
            onConfirm={() => {
              if (confirm === "close") onClose();
              else void deliver();
            }}
          />
        </View>
      )}
      {leaveAction && (
        <InlineConfirm
          text="¿Descartar el borrador de la entrega y salir?"
          confirmLabel="Descartar y salir"
          onCancel={() => setLeaveAction(null)}
          onConfirm={() => {
            const action = leaveAction;
            setLeaveAction(null);
            navigation.dispatch(action);
          }}
        />
      )}
    </Card>
  );
}
