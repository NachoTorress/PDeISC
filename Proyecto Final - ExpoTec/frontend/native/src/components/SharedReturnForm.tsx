import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NavigationAction } from "@react-navigation/native";
import { Button, Card, Field, Heading, InlineConfirm } from "./ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import { receivingErrors } from "../lib/sharedLoans";
import type { SharedLoan } from "../lib/sharedLoans";

export default function SharedReturnForm({
  loan,
  noteOnly,
  onSaved,
  onClose,
  onReload,
}: {
  loan: SharedLoan;
  noteOnly: boolean;
  onSaved: (loan: SharedLoan) => void;
  onClose: () => void;
  onReload: () => Promise<void>;
}) {
  const { client } = useAuth(),
    { colors } = useTheme(),
    navigation = useNavigation();
  const [input, setInput] = useState({
    quantity: String(loan.quantity - loan.returned),
    damagedQuantity: "0",
    note: "",
  });
  const [submitted, setSubmitted] = useState(false),
    [busy, setBusy] = useState(false),
    [saved, setSaved] = useState(false);
  const [error, setError] = useState(""),
    [fields, setFields] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState<"receive" | "close" | "reload" | null>(
      null,
    ),
    [leaveAction, setLeaveAction] = useState<NavigationAction | null>(null);
  const working = useRef(false);
  const dirty =
    !!input.note ||
    input.damagedQuantity !== "0" ||
    input.quantity !== String(loan.quantity - loan.returned);
  usePreventRemove(dirty && !saved, ({ data }) => setLeaveAction(data.action));
  const validation = receivingErrors(input, loan, noteOnly);
  function change(key: keyof typeof input, value: string) {
    setInput((current) => ({ ...current, [key]: value }));
    setFields((current) => ({ ...current, [key]: "" }));
    setSubmitted(true);
    setConfirm(null);
    setError("");
  }
  async function receive() {
    if (working.current || Object.keys(validation).length) return;
    working.current = true;
    setBusy(true);
    setError("");
    setFields({});
    try {
      const result = await client.send<{ loan: SharedLoan }>(
        `/api/loans/${loan.id}/return`,
        {
          version: loan.version,
          quantity: noteOnly ? 0 : Number(input.quantity),
          damagedQuantity: noteOnly ? 0 : Number(input.damagedQuantity),
          note: input.note.trim(),
        },
      );
      setSaved(true);
      onSaved(result.loan);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos registrar el movimiento.",
      );
      if (cause instanceof AuthError) setFields(cause.fields);
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
        title={noteOnly ? "Registrar novedad" : "Registrar devolución"}
        subtitle={`${loan.projectName} · ${loan.resourceName} · Jornada ${loan.day}`}
      />
      <Text style={paragraph}>
        Entregadas: {loan.quantity} · Devueltas: {loan.returned} · Sin devolver:{" "}
        {loan.quantity - loan.returned}
      </Text>
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, lineHeight: 22 }}
        >
          {error}
        </Text>
      )}
      {noteOnly ? (
        <Text style={paragraph}>
          La novedad se guarda en el historial sin registrar unidades devueltas
          ni cambiar el stock.
        </Text>
      ) : (
        <>
          <Field
            label="Unidades recibidas"
            value={input.quantity}
            onChangeText={(value) => change("quantity", value)}
            keyboardType="number-pad"
            maxLength={5}
            editable={!busy}
            error={
              fields.quantity || (submitted ? validation.quantity : undefined)
            }
          />
          <Field
            label="De las recibidas, unidades dañadas"
            value={input.damagedQuantity}
            onChangeText={(value) => change("damagedQuantity", value)}
            keyboardType="number-pad"
            maxLength={5}
            editable={!busy}
            hint="Estas unidades se devuelven, pero quedan fuera de servicio y no podrán prestarse hasta su revisión."
            error={
              fields.damagedQuantity ||
              (submitted ? validation.damagedQuantity : undefined)
            }
          />
        </>
      )}
      <Field
        label="Novedad u observación"
        value={input.note}
        onChangeText={(value) => change("note", value)}
        multiline
        maxLength={1000}
        editable={!busy}
        hint="Para novedades o daños, explicá el motivo con al menos 10 caracteres."
        error={fields.note || (submitted ? validation.note : undefined)}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          title={noteOnly ? "Revisar novedad" : "Revisar devolución"}
          icon="check"
          disabled={busy}
          onPress={() => {
            setSubmitted(true);
            if (!Object.keys(validation).length) setConfirm("receive");
          }}
        />
        <Button
          title="Cancelar movimiento"
          variant="quiet"
          disabled={busy}
          onPress={() => {
            if (dirty) setConfirm("close");
            else onClose();
          }}
        />
        <Button
          title="Descartar y actualizar préstamo"
          variant="quiet"
          disabled={busy}
          onPress={() => setConfirm("reload")}
        />
      </View>
      {confirm && (
        <View pointerEvents={busy ? "none" : "auto"}>
          <InlineConfirm
            text={
              confirm === "close"
                ? "¿Descartar el borrador del movimiento?"
                : confirm === "reload"
                  ? "¿Descartar el borrador y consultar el saldo actual del préstamo?"
                  : noteOnly
                    ? "¿Guardar esta novedad sin registrar una devolución?"
                    : `¿Registrar ${input.quantity} unidades recibidas, de las cuales ${input.damagedQuantity} quedan fuera de servicio?`
            }
            confirmLabel={
              busy
                ? "Registrando movimiento…"
                : confirm === "close"
                  ? "Descartar movimiento"
                  : confirm === "reload"
                    ? "Descartar y actualizar"
                    : noteOnly
                      ? "Confirmar novedad"
                      : "Confirmar devolución"
            }
            onCancel={() => setConfirm(null)}
            onConfirm={() => {
              if (confirm === "close") {
                onClose();
                return;
              }
              if (confirm === "receive") {
                void receive();
                return;
              }
              setBusy(true);
              void onReload()
                .catch((cause) =>
                  setError(
                    cause instanceof Error
                      ? cause.message
                      : "No pudimos actualizar.",
                  ),
                )
                .finally(() => setBusy(false));
            }}
          />
        </View>
      )}
      {leaveAction && (
        <InlineConfirm
          text="¿Descartar el borrador del movimiento y salir?"
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
