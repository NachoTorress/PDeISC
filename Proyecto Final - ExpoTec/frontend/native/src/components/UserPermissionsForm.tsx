/** Edición de permisos de una cuenta con confirmación y recarga ante cambios simultáneos. */
import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { useNavigation, usePreventRemove } from "@react-navigation/native";
import type { NavigationAction } from "@react-navigation/native";
import { Button, Card, CheckRow, Heading, InlineConfirm } from "./ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import { accountRoles, rolesChangeBody, sameRoles } from "../lib/adminUsers";
import type { ManagedUser } from "../lib/adminUsers";
import type { AccountRole } from "../lib/authTypes";

/** Guarda con `PUT /api/admin/users/:id/roles` enviando los roles esperados. */
export default function UserPermissionsForm({ account, onClose, onSaved }: {
  account: ManagedUser;
  onClose: () => void;
  onSaved: (account: ManagedUser) => void;
}) {
  const { client, user } = useAuth();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [source, setSource] = useState(account);
  const [roles, setRoles] = useState<AccountRole[]>([...account.roles]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState(false);
  const [confirm, setConfirm] = useState<"save" | "close" | "reload" | null>(null);
  const [leave, setLeave] = useState<NavigationAction | null>(null);
  const working = useRef(false);
  const dirty = !sameRoles(source.roles, roles);
  usePreventRemove((dirty || busy) && !saved, ({ data }) => setLeave(data.action));
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  /** Ejecuta una acción con estado de carga y errores. */
  async function run(action: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    setConfirm(null);
    try { await action(); }
    catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos guardar los permisos.");
      if (cause instanceof AuthError) {
        if (cause.status === 409) setConflict(true);
        if (cause.status === 403) void client.verify().catch(() => {});
      }
    } finally { working.current = false; setBusy(false); }
  }
  /** Cierra el formulario si no hay un envío en curso. */
  function close() {
    if (working.current) return;
    setSaved(true);
    if (leave) navigation.dispatch(leave);
    else onClose();
  }
  return (
    <Card style={{ width: "100%", maxWidth: 680, alignSelf: "center" }}>
      <Heading title={`${source.firstName} ${source.lastName}`} subtitle={source.email} />
      <Text style={paragraph}>Una cuenta puede tener varios permisos. Los cambios se aplican en su próxima operación con el servidor.</Text>
      {accountRoles.map(role => (
        <View key={role.value}>
          <CheckRow label={role.label} checked={roles.includes(role.value)} disabled={busy || !!confirm || !!leave} onChange={checked => {
            if (busy || confirm || leave) return;
            setRoles(current => checked ? [...current, role.value] : current.filter(value => value !== role.value));
          }} />
          <Text style={{ ...paragraph, paddingLeft: 36, fontSize: 13 }}>{role.description}</Text>
        </View>
      ))}
      {!roles.length && <Text accessibilityRole="alert" style={{ ...paragraph, color: colors.error }}>Seleccioná al menos un permiso.</Text>}
      {!!error && <Text accessibilityRole="alert" style={{ ...paragraph, color: colors.error }}>{error}</Text>}
      {conflict && <Button title="Descartar selección y recargar cuenta" variant="secondary" disabled={busy} onPress={() => setConfirm("reload")} />}
      {confirm === "save" ? (
        <InlineConfirm
          tone="success"
          text={`¿Guardar estos permisos para ${source.firstName} ${source.lastName}: ${accountRoles.filter(role => roles.includes(role.value)).map(role => role.label).join(", ")}?${source.id === user?.id && !roles.includes("admin") ? " Vas a perder el acceso a la administración." : ""}`}
          confirmLabel="Sí, guardar permisos"
          onCancel={() => setConfirm(null)}
          onConfirm={() => void run(async () => {
            const result = await client.send<{ user: ManagedUser }>(`/api/admin/users/${source.id}/roles`, rolesChangeBody(source, roles), "PUT");
            setSaved(true);
            onSaved({ ...source, ...result.user });
            if (source.id === user?.id) void client.verify().catch(() => {});
          })}
        />
      ) : confirm === "reload" ? (
        <InlineConfirm text="¿Descartar tu selección y cargar los permisos actuales del servidor?" confirmLabel="Descartar y recargar"
          onCancel={() => setConfirm(null)} onConfirm={() => void run(async () => {
            const result = await client.send<{ user: ManagedUser }>(`/api/admin/users/${source.id}`, {}, "GET");
            setSource(result.user);
            setRoles([...result.user.roles]);
            setConflict(false);
          })} />
      ) : confirm === "close" || leave ? (
        <InlineConfirm text="¿Salir sin guardar los cambios de permisos?" confirmLabel="Salir sin guardar"
          onCancel={() => { setConfirm(null); setLeave(null); }} onConfirm={close} />
      ) : (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          <Button title={busy ? "Guardando…" : "Revisar cambios"} disabled={busy || !dirty || !roles.length || conflict} onPress={() => setConfirm("save")} />
          <Button title="Volver a usuarios" variant="quiet" disabled={busy} onPress={() => dirty ? setConfirm("close") : onClose()} />
        </View>
      )}
    </Card>
  );
}
