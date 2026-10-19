import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import {
  Button,
  Card,
  Choice,
  Field,
  Heading,
  InlineConfirm,
  Screen,
} from "../components/ui";
import SharedResourceForm from "../components/SharedResourceForm";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { formatDate } from "../lib/format";
import type { InventoryResource } from "../lib/sharedInventory";

export default function SharedInventoryPage({
  onAccount,
  onProjects,
  onSpaces,
}: {
  onAccount: () => void;
  onProjects: () => void;
  onSpaces: () => void;
}) {
  const { client, user, ready } = useAuth();
  const { colors } = useTheme();
  const canRead =
    ready && !!user?.roles.some((role) => role === "admin" || role === "loans");
  const canManage = canRead && !!user?.roles.includes("admin");
  const scope = `${user?.id}:${user?.roles.join(",")}`;
  const [resources, setResources] = useState<InventoryResource[]>([]);
  const [loadedFor, setLoadedFor] = useState("");
  const [mode, setMode] = useState("active");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<{
    scope: string;
    resource?: InventoryResource;
    revision: number;
  } | null>(null);
  const [archive, setArchive] = useState<InventoryResource | null>(null);
  const [history, setHistory] = useState<{
    scope: string;
    resource: InventoryResource;
  } | null>(null);
  const revision = useRef(0),
    working = useRef(false);
  const listScope = `${scope}:${mode}`;
  const load = useCallback(
    async (offset = 0) => {
      if (!canRead) {
        setLoading(false);
        return;
      }
      const request = ++revision.current;
      setLoading(true);
      setError("");
      try {
        const result = await client.send<{ resources: InventoryResource[] }>(
          "/api/inventory/query",
          { limit: 25, offset, archived: mode === "archived" },
        );
        if (request !== revision.current) return;
        setResources((current) =>
          offset
            ? [
                ...current,
                ...result.resources.filter(
                  (item) =>
                    !current.some((previous) => previous.id === item.id),
                ),
              ]
            : result.resources,
        );
        setLoadedFor(listScope);
        setMore(result.resources.length === 25);
      } catch (cause) {
        if (request === revision.current)
          setError(
            cause instanceof Error
              ? cause.message
              : "No pudimos consultar el inventario.",
          );
      } finally {
        if (request === revision.current) setLoading(false);
      }
    },
    [client, canRead, listScope, mode],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => {
        revision.current++;
      };
    }, [load]),
  );
  const visible = loadedFor === listScope ? resources : [];
  const editing = editor?.scope === scope && canManage ? editor : null;
  const shownHistory = history?.scope === listScope ? history.resource : null;
  async function perform(action: () => Promise<void>) {
    if (working.current) return;
    working.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos completar la operación.",
      );
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  const paragraph = { color: colors.muted, lineHeight: 22 };
  if (!ready)
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  if (!canRead)
    return (
      <Screen>
        <Heading
          title="Inventario de ExpoTec"
          subtitle="Ingresá con una cuenta de administración o préstamos para consultar el inventario."
        />
        <Button title="Ir a Mi cuenta" onPress={onAccount} />
        <Button
          title="Ver proyectos"
          variant="secondary"
          onPress={onProjects}
        />
      </Screen>
    );
  return (
    <Screen>
      <Heading
        title="Inventario de ExpoTec"
        subtitle="Existencias y reservas compartidas de elementos para los proyectos."
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button
          title="Ver proyectos"
          variant="secondary"
          onPress={onProjects}
          disabled={!!editing || busy}
        />
        <Button
          title="Ver espacios"
          variant="secondary"
          onPress={onSpaces}
          disabled={!!editing || busy}
        />
        <Button
          title="Actualizar inventario"
          variant="quiet"
          disabled={loading || busy || !!editing}
          onPress={() => {
            setHistory(null);
            void load();
          }}
        />
        {canManage && (
          <Button
            title="Nuevo elemento"
            icon="plus"
            disabled={busy || !!editing}
            onPress={() => {
              setEditor({ scope, revision: 0 });
              setArchive(null);
              setHistory(null);
              setNotice("");
            }}
          />
        )}
      </View>
      <Text style={paragraph}>
        Disponible para reservar = total menos las reservas de proyectos
        confirmados. La entrega y devolución física se incorporarán con los
        préstamos.
      </Text>
      {!canManage && (
        <Text style={paragraph}>
          La administración puede modificar las existencias y dar de baja
          elementos.
        </Text>
      )}
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
      {editing && (
        <SharedResourceForm
          key={`${scope}:${editing.resource?.id ?? "new"}:${editing.revision}`}
          resource={editing.resource}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setHistory(null);
            setNotice(
              "El elemento quedó guardado en el inventario compartido.",
            );
            void load();
          }}
          onReload={async () => {
            const result = await client.send<{ resource: InventoryResource }>(
              `/api/inventory/${editing.resource!.id}/query`,
              {},
            );
            if (result.resource.archivedAt)
              throw new Error(
                "El elemento fue dado de baja. Cancelá la edición para actualizar el inventario.",
              );
            setEditor({
              scope,
              resource: result.resource,
              revision: editing.revision + 1,
            });
          }}
        />
      )}
      <Choice
        label="Vista del inventario"
        disabled={busy || !!editing}
        value={mode}
        options={[
          { value: "active", label: "Elementos activos" },
          { value: "archived", label: "Dados de baja" },
        ]}
        onChange={(value) => {
          if (editing || busy) return;
          setMode(value);
          setArchive(null);
          setHistory(null);
          setSearch("");
        }}
      />
      <Field
        label="Buscar en los elementos cargados"
        value={search}
        onChangeText={setSearch}
        maxLength={100}
        hint="Si faltan resultados, cargá más elementos al final de la lista."
      />
      {loading && !visible.length ? (
        <ActivityIndicator color={colors.primary} />
      ) : !visible.length && !error ? (
        <Card>
          <Text style={paragraph}>
            {mode === "active"
              ? "Todavía no hay elementos en el inventario compartido."
              : "No hay elementos dados de baja."}
          </Text>
        </Card>
      ) : null}
      {!!visible.length &&
        !visible.some((item) =>
          item.name
            .toLocaleLowerCase("es")
            .includes(search.trim().toLocaleLowerCase("es")),
        ) && (
          <Text style={paragraph}>
            No hay coincidencias entre los elementos cargados.
          </Text>
        )}
      {visible
        .filter((item) =>
          item.name
            .toLocaleLowerCase("es")
            .includes(search.trim().toLocaleLowerCase("es")),
        )
        .map((resource) => (
          <Card key={resource.id}>
            <Heading
              title={resource.name}
              subtitle={resource.description || undefined}
            />
            <Text style={{ color: colors.text, lineHeight: 24 }}>
              Total: {resource.total} · Reservadas: {resource.reserved} ·
              Disponibles: {resource.available}
            </Text>
            <Text style={paragraph}>
              Creado el {formatDate(resource.createdAt)}
              {resource.archivedAt
                ? ` · Baja el ${formatDate(resource.archivedAt)}`
                : ""}
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {canManage && !resource.archivedAt && (
                <>
                  <Button
                    title={`Editar ${resource.name}`}
                    icon="edit"
                    variant="secondary"
                    disabled={busy || !!editing}
                    onPress={() => {
                      setEditor({ scope, resource, revision: 0 });
                      setArchive(null);
                      setHistory(null);
                      setNotice("");
                    }}
                  />
                  <Button
                    title={`Dar de baja ${resource.name}`}
                    icon="trash"
                    variant="danger"
                    disabled={busy || !!editing}
                    onPress={() => {
                      setArchive(resource);
                      setHistory(null);
                    }}
                  />
                </>
              )}
              <Button
                title={`Ver historial de ${resource.name}`}
                variant="quiet"
                disabled={busy || !!editing}
                onPress={() => {
                  void perform(async () => {
                    const result = await client.send<{
                      resource: InventoryResource;
                    }>(`/api/inventory/${resource.id}/query`, {});
                    setHistory({ scope: listScope, resource: result.resource });
                  });
                }}
              />
            </View>
            {archive?.id === resource.id && (
              <View pointerEvents={busy ? "none" : "auto"}>
                <InlineConfirm
                  text={`¿Dar de baja ${resource.name}? Se conservará su historial. Los proyectos vigentes deben quitarlo de sus pedidos antes de la baja.`}
                  confirmLabel={busy ? "Guardando baja…" : "Sí, dar de baja"}
                  onCancel={() => setArchive(null)}
                  onConfirm={() => {
                    void perform(async () => {
                      await client.send(
                        `/api/inventory/${resource.id}/archive`,
                        { version: resource.version },
                      );
                      setArchive(null);
                      setNotice(
                        "El elemento fue dado de baja. Su historial se conserva.",
                      );
                      await load();
                    });
                  }}
                />
              </View>
            )}
            {shownHistory?.id === resource.id && (
              <View style={{ gap: 10 }}>
                <Heading title="Historial del elemento" />
                {shownHistory.events?.map((event) => (
                  <View key={event.id}>
                    <Text style={{ color: colors.text }}>
                      {(
                        {
                          create: "Alta",
                          update: "Modificación",
                          archive: "Baja",
                        } as Record<string, string>
                      )[event.action] ?? event.action}{" "}
                      · {formatDate(event.createdAt)} · {event.firstName}{" "}
                      {event.lastName}
                    </Text>
                    <Text style={paragraph}>
                      Total:{" "}
                      {event.previousTotal === null
                        ? event.total
                        : `${event.previousTotal} → ${event.total}`}
                    </Text>
                  </View>
                ))}
                <Button
                  title="Cerrar historial"
                  variant="quiet"
                  onPress={() => setHistory(null)}
                />
              </View>
            )}
          </Card>
        ))}
      {more && loadedFor === listScope && (
        <Button
          title={loading ? "Cargando elementos…" : "Cargar más elementos"}
          variant="secondary"
          disabled={loading || busy || !!editing}
          onPress={() => {
            void load(resources.length);
          }}
        />
      )}
    </Screen>
  );
}
