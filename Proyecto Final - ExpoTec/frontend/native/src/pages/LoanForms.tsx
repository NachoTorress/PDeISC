/**
 * Pantalla de la demostración (datos locales del dispositivo, sin servidor). Formularios de entrega y devolución de la demostración.
 */
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Card, Choice, Field, Section } from "../components/ui";
import { useTheme } from "../contexts/ThemeContext";
import { useDemo } from "../hooks/useDemo";
import type { Loan } from "../lib/types";

/** Valida una cantidad entera entre 1 y el máximo disponible. */
function quantityError(value: string, maximum: number) {
  if (
    !/^\d+$/.test(value) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) < 1
  )
    return "Ingresá una cantidad entera mayor que cero.";
  if (maximum === 0) return "No quedan unidades disponibles para esta entrega.";
  if (Number(value) > maximum)
    return `Podés registrar hasta ${maximum} ${maximum === 1 ? "unidad" : "unidades"}.`;
  return "";
}

/** Recibe un préstamo abierto y registra su devolución parcial o total mediante el modelo. */
export function ReturnForm({
  loan,
  onClose,
}: {
  loan: Loan;
  onClose: () => void;
}) {
  const { mutate, notify } = useDemo();
  const { colors } = useTheme();
  const remaining = loan.quantity - loan.returned;
  const [quantity, setQuantity] = useState(String(remaining));
  const [notes, setNotes] = useState(loan.notes);
  const [error, setError] = useState("");
  const invalidQuantity = quantityError(quantity, remaining);
  const invalidNotes =
    notes.length > 500
      ? "La observación puede tener hasta 500 caracteres."
      : "";

  function submit() {
    if (invalidQuantity || invalidNotes) return;
    const result = mutate({
      type: "returnLoan",
      id: loan.id,
      quantity: Number(quantity),
      notes: notes.trim(),
    });
    if (result) {
      setError(result);
      return;
    }
    notify(
      Number(quantity) === remaining
        ? "Devolución completa registrada."
        : "Devolución parcial registrada.",
    );
    onClose();
  }

  return (
    <Section title="Registrar devolución">
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
        Quedan {remaining} unidades por devolver. Podés registrar una devolución
        parcial.
      </Text>
      <Field
        label="Cantidad devuelta"
        value={quantity}
        keyboardType="number-pad"
        error={invalidQuantity}
        onChangeText={(value) => {
          setQuantity(value);
          setError("");
        }}
      />
      <Field
        label="Observación (opcional)"
        value={notes}
        error={invalidNotes}
        multiline
        onChangeText={(value) => {
          setNotes(value);
          setError("");
        }}
      />
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, fontSize: 14, lineHeight: 21 }}
        >
          {error}
        </Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          title="Cancelar"
          icon="close"
          variant="secondary"
          onPress={onClose}
        />
        <Button
          title="Registrar devolución"
          icon="check"
          onPress={submit}
          disabled={!!invalidQuantity || !!invalidNotes}
        />
      </View>
    </Section>
  );
}

/** Permite entregar únicamente stock asignado a proyectos aprobados, dentro de su jornada. */
export function LendingForm({
  day,
  onClose,
}: {
  day: number;
  onClose: () => void;
}) {
  const { state, mutate, notify } = useDemo();
  const { colors } = useTheme();
  const [projectId, setProjectId] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");
  const projects = state.projects.filter(
    (project) => project.status === "approved",
  );
  const project = projects.find((item) => item.id === projectId);
  const resources = state.resources.filter((resource) => {
    const delivered = state.loans
      .filter(
        (loan) =>
          loan.projectId === projectId &&
          loan.resourceId === resource.id &&
          loan.day === day,
      )
      .reduce((sum, loan) => sum + loan.quantity, 0);
    return (project?.resources[resource.id] ?? 0) > delivered;
  });
  const resource = resources.find((item) => item.id === resourceId);
  const delivered = state.loans
    .filter(
      (loan) =>
        loan.projectId === projectId &&
        loan.resourceId === resourceId &&
        loan.day === day,
    )
    .reduce((sum, loan) => sum + loan.quantity, 0);
  const stockOut = state.loans
    .filter((loan) => loan.resourceId === resourceId)
    .reduce((sum, loan) => sum + loan.quantity - loan.returned, 0);
  const assignedRemaining = Math.max(
    0,
    (project?.resources[resourceId] ?? 0) - delivered,
  );
  const available = resource
    ? Math.max(0, Math.min(assignedRemaining, resource.total - stockOut))
    : 0;
  const earlierLoan = state.loans.some(
    (loan) =>
      loan.projectId === projectId &&
      loan.resourceId === resourceId &&
      loan.day !== day &&
      loan.quantity > loan.returned,
  );
  const invalidQuantity = resource ? quantityError(quantity, available) : "";

  function submit() {
    if (!project || !resource || invalidQuantity || earlierLoan) return;
    const result = mutate({
      type: "lend",
      projectId,
      resourceId,
      day,
      quantity: Number(quantity),
    });
    if (result) {
      setError(result);
      return;
    }
    notify(`Entrega registrada para ${project.name}, día ${day}.`);
    onClose();
  }

  return (
    <Card>
      <Section title={`Registrar entrega · día ${day}`}>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          Los elementos deben volver al finalizar cada jornada.
        </Text>
        {projects.length === 0 ? (
          <Text style={{ color: colors.text, fontSize: 15, lineHeight: 22 }}>
            Todavía no hay proyectos confirmados para recibir elementos.
          </Text>
        ) : (
          <>
            <Choice
              label="Proyecto confirmado"
              value={projectId}
              options={[
                { value: "", label: "Elegí un proyecto" },
                ...projects.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
              onChange={(value) => {
                setProjectId(value);
                setResourceId("");
                setQuantity("1");
                setError("");
              }}
            />
            {!!project && (
              <Choice
                label="Elemento asignado"
                value={resourceId}
                options={[
                  {
                    value: "",
                    label: resources.length
                      ? "Elegí un elemento"
                      : "No hay entregas pendientes",
                  },
                  ...resources.map((item) => ({
                    value: item.id,
                    label: `${item.name} · ${project.resources[item.id]} asignados`,
                  })),
                ]}
                onChange={(value) => {
                  setResourceId(value);
                  setQuantity("1");
                  setError("");
                }}
              />
            )}
            {!!resource && (
              <Field
                label="Cantidad a entregar"
                value={quantity}
                keyboardType="number-pad"
                error={invalidQuantity}
                hint={`${available} disponibles para este proyecto en esta jornada.`}
                onChangeText={(value) => {
                  setQuantity(value);
                  setError("");
                }}
              />
            )}
            {earlierLoan && (
              <Text
                accessibilityRole="alert"
                style={{ color: colors.onWarning }}
              >
                Este proyecto todavía tiene este elemento de otra jornada.
                Registrá su devolución antes de volver a entregarlo.
              </Text>
            )}
            {!!error && (
              <Text
                accessibilityRole="alert"
                style={{ color: colors.error, fontSize: 14, lineHeight: 21 }}
              >
                {error}
              </Text>
            )}
            <Button
              title="Registrar entrega"
              icon="loans"
              onPress={submit}
              disabled={
                !project || !resource || !!invalidQuantity || earlierLoan
              }
            />
          </>
        )}
        <Button
          title="Cancelar"
          icon="close"
          variant="secondary"
          onPress={onClose}
        />
      </Section>
    </Card>
  );
}
