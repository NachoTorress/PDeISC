import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActionRow,
  Button,
  Card,
  Chip,
  Field,
  PageHeading,
  Screen,
} from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import { accountRoles } from "../lib/adminUsers";
import type { ManagedUser } from "../lib/adminUsers";
import { formatDate } from "../lib/format";
import UserPermissionsForm from "../components/UserPermissionsForm";

const pageSize = 20;

export default function AdminUsersPage({
  onAccount,
}: {
  onAccount: () => void;
}) {
  const { client, user, ready } = useAuth();
  const { colors } = useTheme();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState("");
  const [applied, setApplied] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [listWidth, setListWidth] = useState(0);
  const requestId = useRef(0);
  const canManage = ready && !!user?.roles.includes("admin");

  const load = useCallback(
    async (term: string, offset = 0) => {
      const id = ++requestId.current;
      setLoading(true);
      setError("");
      try {
        const result = await client.send<{ users: ManagedUser[] }>(
          "/api/admin/users/query",
          {
            search: term,
            limit: pageSize,
            offset,
          },
        );
        if (id !== requestId.current) return;
        setUsers((current) =>
          offset
            ? [
                ...current,
                ...result.users.filter(
                  (item) =>
                    !current.some((previous) => previous.id === item.id),
                ),
              ]
            : result.users,
        );
        setApplied(term);
        setHasMore(result.users.length === pageSize);
        setLoaded(true);
      } catch (cause) {
        if (id !== requestId.current) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "No pudimos consultar los usuarios.",
        );
        if (cause instanceof AuthError && cause.status === 403)
          void client.verify().catch(() => {});
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [client],
  );

  useFocusEffect(
    useCallback(() => {
      setEditing(null);
      setSearch("");
      if (canManage) void load("");
      return () => {
        requestId.current++;
      };
    }, [canManage, user?.id, load]),
  );

  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  if (!ready)
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  if (!canManage)
    return (
      <Screen>
        <PageHeading icon="users" tone="info" title="Usuarios y permisos" />
        <Card>
          <Text style={paragraph}>
            Esta pantalla requiere una cuenta de administrador.
          </Text>
          {!user && <Button title="Ingresar" onPress={onAccount} />}
        </Card>
      </Screen>
    );
  return (
    <Screen>
      <PageHeading
        icon="users"
        tone="info"
        title="Usuarios y permisos"
        subtitle="Asigná las responsabilidades de cada cuenta registrada."
      />
      {!!notice && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ ...paragraph, color: colors.success }}
        >
          {notice}
        </Text>
      )}
      {editing ? (
        <UserPermissionsForm
          key={editing.id}
          account={editing}
          onClose={() => {
            setEditing(null);
            void load(applied);
          }}
          onSaved={(next) => {
            setUsers((current) =>
              current.map((item) =>
                item.id === next.id ? { ...item, ...next } : item,
              ),
            );
            setEditing(null);
            setNotice(
              `Se guardaron los permisos de ${next.firstName} ${next.lastName}.`,
            );
          }}
        />
      ) : (
        <>
          <Card style={{ padding: 16, gap: 10 }}>
            <Field
              label="Buscar por nombre o correo"
              value={search}
              onChangeText={setSearch}
              maxLength={100}
              editable={!loading}
              onSubmitEditing={() => void load(search.trim())}
            />
            <ActionRow>
              <Button
                title={loading ? "Consultando…" : "Buscar usuarios"}
                disabled={loading}
                onPress={() => void load(search.trim())}
              />
              <Button
                title="Mostrar todos"
                variant="secondary"
                disabled={loading}
                onPress={() => {
                  setSearch("");
                  void load("");
                }}
              />
            </ActionRow>
          </Card>
          {!!error && (
            <Text
              accessibilityRole="alert"
              style={{ ...paragraph, color: colors.error }}
            >
              {error}
            </Text>
          )}
          {loading && <ActivityIndicator color={colors.primary} />}
          {loaded && !users.length && !loading && !error && (
            <Text style={paragraph}>
              No hay cuentas que coincidan con la búsqueda.
            </Text>
          )}
          <View
            testID="users-grid"
            onLayout={(event) => setListWidth(event.nativeEvent.layout.width)}
            style={{ gap: 8 }}
          >
            {users.map((account) => (
              <Card
                key={account.id}
                testID={`user-card-${account.id}`}
                style={{
                  padding: 14,
                  gap: 12,
                  flexDirection: listWidth >= 660 ? "row" : "column",
                  alignItems: listWidth >= 660 ? "center" : "stretch",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                    flex: listWidth >= 660 ? 1 : undefined,
                    minWidth: 0,
                  }}
                >
                  <View
                    accessibilityElementsHidden
                    aria-hidden
                    importantForAccessibility="no-hide-descendants"
                    style={{
                      width: 36,
                      height: 36,
                      flexShrink: 0,
                      borderRadius: 18,
                      backgroundColor: colors.selectedContainer,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: colors.onSelectedContainer,
                        fontWeight: "700",
                        fontSize: 13,
                      }}
                    >
                      {account.firstName.slice(0, 1)}
                      {account.lastName.slice(0, 1)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: colors.text,
                          fontSize: 16,
                          lineHeight: 22,
                          fontWeight: "600",
                        }}
                      >
                        {account.firstName} {account.lastName}
                      </Text>
                      {account.id === user?.id && <Chip label="Tu cuenta" />}
                      {!account.active && (
                        <Chip label="Inactiva" tone="neutral" />
                      )}
                    </View>
                    <Text
                      selectable
                      style={{ ...paragraph, fontSize: 14, lineHeight: 20 }}
                    >
                      {account.email}
                    </Text>
                    <Text
                      style={{ ...paragraph, fontSize: 13, lineHeight: 19 }}
                    >
                      {account.roles
                        .map(
                          (role) =>
                            accountRoles.find((item) => item.value === role)
                              ?.label,
                        )
                        .join(" · ") || "Sin permisos"}
                      {" · Creada "}
                      {formatDate(account.createdAt)}
                      {account.active ? " · Activa" : ""}
                    </Text>
                  </View>
                </View>
                {account.active && (
                  <Button
                    title="Editar permisos"
                    accessibilityLabel={`Editar permisos de ${account.firstName} ${account.lastName}`}
                    icon="edit"
                    variant="secondary"
                    style={{
                      alignSelf: listWidth >= 660 ? "center" : "flex-end",
                    }}
                    disabled={loading}
                    onPress={() => {
                      setEditing(account);
                      setNotice("");
                    }}
                  />
                )}
              </Card>
            ))}
          </View>
          {hasMore && (
            <Button
              title="Cargar más usuarios"
              variant="secondary"
              disabled={loading || !!error}
              onPress={() => void load(applied, users.length)}
            />
          )}
        </>
      )}
    </Screen>
  );
}
