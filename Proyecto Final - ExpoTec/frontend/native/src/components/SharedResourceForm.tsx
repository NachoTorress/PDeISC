import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NavigationAction } from "@react-navigation/native";
import { Button, Card, Field, Heading, InlineConfirm } from "./ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import { inventoryErrors } from "../lib/sharedInventory";
import type { InventoryResource } from "../lib/sharedInventory";

export default function SharedResourceForm({
  resource,
  onSaved,
  onClose,
  onReload,
}: {
  resource?: InventoryResource;
  onSaved: (resource: InventoryResource) => void;
  onClose: () => void;
  onReload: () => Promise<void>;
}) {
  const { client } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [input, setInput] = useState({
    name: resource?.name ?? "",
    description: resource?.description ?? "",
    total: String(resource?.total ?? 0),
    unavailable: String(resource?.unavailable ?? 0),
    note: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [confirm, setConfirm] = useState<"close" | "reload" | null>(null);
  const [leaveAction, setLeaveAction] = useState<NavigationAction | null>(null);
  const working = useRef(false);
  const dirty =
    input.name !== (resource?.name ?? "") ||
    input.description !== (resource?.description ?? "") ||
    input.total !== String(resource?.total ?? 0) ||
    input.unavailable !== String(resource?.unavailable ?? 0) ||
    !!input.note;
  usePreventRemove(dirty && !saved, ({ data }) => setLeaveAction(data.action));
  const validation = inventoryErrors({
    ...input,
    previousUnavailable: resource?.unavailable ?? 0,
  });
  function change(key: keyof typeof input, value: string) {
    setInput((current) => ({ ...current, [key]: value }));
    setTouched((current) => ({ ...current, [key]: true }));
    setFields((current) => ({ ...current, [key]: "" }));
    setError("");
  }
  async function save() {
    setTouched({
      name: true,
      description: true,
      total: true,
      unavailable: true,
      note: true,
    });
    if (working.current || Object.keys(validation).length) return;
    working.current = true;
    setBusy(true);
    setError("");
    setFields({});
    try {
      const result = await client.send<{ resource: InventoryResource }>(
        resource
          ? `/api/inventory/${resource.id}/save`
          : "/api/inventory/create",
        {
          name: input.name.trim(),
          description: input.description.trim(),
          total: Number(input.total),
          unavailable: Number(input.unavailable),
          note: input.note.trim(),
          ...(resource ? { version: resource.version } : {}),
        },
      );
      setSaved(true);
      onSaved(result.resource);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos guardar el elemento.",
      );
      if (cause instanceof AuthError) setFields(cause.fields);
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  return (
    <Card>
      <Heading
        title={resource ? `Editar ${resource.name}` : "Nuevo elemento"}
      />
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: colors.error, lineHeight: 22 }}
        >
          {error}
        </Text>
      )}
      <Field
        label="Nombre del elemento"
        value={input.name}
        onChangeText={(value) => change("name", value)}
        editable={!busy}
        maxLength={100}
        error={fields.name || (touched.name ? validation.name : undefined)}
      />
      <Field
        label="Descripción del elemento"
        value={input.description}
        onChangeText={(value) => change("description", value)}
        editable={!busy}
        maxLength={250}
        error={
          fields.description ||
          (touched.description ? validation.description : undefined)
        }
      />
      <Field
        label="Unidades totales"
        value={input.total}
        onChangeText={(value) => change("total", value)}
        editable={!busy}
        maxLength={6}
        keyboardType="number-pad"
        hint="Incluí las unidades fuera de servicio. Las mesas del plano se administran por separado."
        error={fields.total || (touched.total ? validation.total : undefined)}
      />
      <Field
        label="Unidades fuera de servicio"
        value={input.unavailable}
        onChangeText={(value) => change("unavailable", value)}
        editable={!busy}
        maxLength={6}
        keyboardType="number-pad"
        hint="Las devoluciones con daños aumentan esta cantidad. Actualizala después de revisar o reparar los elementos."
        error={
          fields.unavailable ||
          (touched.unavailable ? validation.unavailable : undefined)
        }
      />
      <Field
        label="Motivo del ajuste"
        value={input.note}
        onChangeText={(value) => change("note", value)}
        editable={!busy}
        multiline
        maxLength={1000}
        hint="Obligatorio al cambiar las unidades fuera de servicio; mínimo 10 caracteres."
        error={fields.note || (touched.note ? validation.note : undefined)}
      />
      {resource && (
        <Text style={{ color: colors.muted, lineHeight: 22 }}>
          Última consulta: {resource.reserved} reservadas de {resource.total}.
          El servidor vuelve a comprobar las reservas al guardar.
        </Text>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          title={busy ? "Guardando elemento…" : "Guardar elemento"}
          icon="save"
          disabled={busy}
          onPress={() => {
            void save();
          }}
        />
        <Button
          title="Cancelar edición"
          variant="quiet"
          disabled={busy}
          onPress={() => {
            if (dirty) setConfirm("close");
            else onClose();
          }}
        />
        {resource && (
          <Button
            title="Descartar y recargar elemento"
            variant="quiet"
            disabled={busy}
            onPress={() => setConfirm("reload")}
          />
        )}
      </View>
      {confirm && (
        <InlineConfirm
          text={
            confirm === "reload"
              ? "¿Descartar el borrador y cargar la versión actual del elemento?"
              : "¿Descartar este borrador del elemento?"
          }
          confirmLabel={
            confirm === "reload" ? "Descartar y recargar" : "Descartar borrador"
          }
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            if (confirm === "close") {
              onClose();
              return;
            }
            setBusy(true);
            setError("");
            void onReload()
              .then(() => setConfirm(null))
              .catch((cause) =>
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "No pudimos recargar.",
                ),
              )
              .finally(() => setBusy(false));
          }}
        />
      )}
      {leaveAction && (
        <InlineConfirm
          text="¿Descartar el borrador del elemento y salir?"
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
