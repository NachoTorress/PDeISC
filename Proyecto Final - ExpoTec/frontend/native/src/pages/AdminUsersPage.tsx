import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View, useWindowDimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Button, Card, Field, Heading, Screen } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import { accountRoles } from "../lib/adminUsers";
import type { ManagedUser } from "../lib/adminUsers";
import { formatDate } from "../lib/format";
import UserPermissionsForm from "../components/UserPermissionsForm";

const pageSize = 20;

export default function AdminUsersPage({ onAccount }: { onAccount: () => void }) {
  const { client, user, ready } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const requestId = useRef(0);
  const canManage = ready && !!user?.roles.includes("admin");

  const load = useCallback(async (term: string, offset = 0) => {
    const id = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const result = await client.send<{ users: ManagedUser[] }>("/api/admin/users/query", {
        search: term, limit: pageSize, offset,
      });
      if (id !== requestId.current) return;
      setUsers(current => offset ? [...current, ...result.users.filter(item => !current.some(previous => previous.id === item.id))] : result.users);
      setApplied(term);
      setHasMore(result.users.length === pageSize);
      setLoaded(true);
    } catch (cause) {
      if (id !== requestId.current) return;
      setError(cause instanceof Error ? cause.message : "No pudimos consultar los usuarios.");
      if (cause instanceof AuthError && cause.status === 403) void client.verify().catch(() => {});
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [client]);

  useFocusEffect(useCallback(() => {
    setEditing(null);
    setSearch("");
    if (canManage) void load("");
    return () => { requestId.current++; };
  }, [canManage, user?.id, load]));

  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  if (!ready) return <Screen><ActivityIndicator color={colors.primary} /></Screen>;
  if (!canManage) return (
    <Screen>
      <Heading title="Usuarios y permisos" />
      <Card>
        <Text style={paragraph}>Esta pantalla requiere una cuenta de administrador.</Text>
        <Button title="Ir a Mi cuenta" onPress={onAccount} />
      </Card>
    </Screen>
  );
  return (
    <Screen>
      <Heading title="Usuarios y permisos" subtitle="Asigná las responsabilidades de cada cuenta registrada." />
      {!!notice && <Text accessibilityLiveRegion="polite" style={{ ...paragraph, color: colors.success }}>{notice}</Text>}
      {editing ? (
        <UserPermissionsForm
          key={editing.id}
          account={editing}
          onClose={() => { setEditing(null); void load(applied); }}
          onSaved={(next) => {
            setUsers(current => current.map(item => item.id === next.id ? { ...item, ...next } : item));
            setEditing(null);
            setNotice(`Se guardaron los permisos de ${next.firstName} ${next.lastName}.`);
          }}
        />
      ) : (
        <>
          <Card>
            <Field label="Buscar por nombre o correo" value={search} onChangeText={setSearch} maxLength={100} editable={!loading} onSubmitEditing={() => void load(search.trim())} />
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              <Button title={loading ? "Consultando…" : "Buscar usuarios"} disabled={loading} onPress={() => void load(search.trim())} />
              <Button title="Mostrar todos" variant="secondary" disabled={loading} onPress={() => { setSearch(""); void load(""); }} />
            </View>
          </Card>
          {!!error && <Text accessibilityRole="alert" style={{ ...paragraph, color: colors.error }}>{error}</Text>}
          {loading && <ActivityIndicator color={colors.primary} />}
          {loaded && !users.length && !loading && !error && <Text style={paragraph}>No hay cuentas que coincidan con la búsqueda.</Text>}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {users.map(account => (
              <Card key={account.id} style={{ width: width >= 900 ? "48%" : "100%" }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "600" }}>{account.firstName} {account.lastName}{account.id === user?.id ? " · Tu cuenta" : ""}</Text>
                <Text selectable style={paragraph}>{account.email}</Text>
                <Text style={paragraph}>{account.roles.map(role => accountRoles.find(item => item.value === role)?.label).join(", ") || "Sin permisos"}</Text>
                <Text style={paragraph}>Creada el {formatDate(account.createdAt)} · {account.active ? "Activa" : "Inactiva"}</Text>
                {account.active && <Button title="Editar permisos" variant="secondary" disabled={loading} onPress={() => { setEditing(account); setNotice(""); }} />}
              </Card>
            ))}
          </View>
          {hasMore && <Button title="Cargar más usuarios" variant="secondary" disabled={loading || !!error} onPress={() => void load(applied, users.length)} />}
        </>
      )}
      {!editing && <Button title="Volver a Mi cuenta" variant="quiet" onPress={onAccount} />}
    </Screen>
  );
}
