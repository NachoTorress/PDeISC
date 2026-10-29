/**
 * Pantalla del sistema compartido (datos de la API). Inventario (préstamos y
 * administración): elementos, historial, altas, ajustes y bajas.
 * Cada elemento se muestra con `InventoryCard` y su historial con
 * `InventoryHistory` (carpeta `components/inventory/`).
 */
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Button, Card, Choice, Field, PageHeading, Screen, RefreshButton } from "../components/ui";
import SharedResourceForm from "../components/SharedResourceForm";
import ContentGrid from "../components/ContentGrid";
import { InventoryCard } from "../components/inventory/InventoryCard";
import { InventoryHistory } from "../components/inventory/InventoryHistory";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import type { InventoryResource } from "../lib/sharedInventory";

/** Lista de elementos activos o dados de baja. */
export default function SharedInventoryPage({
  onAccount,
}: {
  onAccount: () => void;
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
  /** Carga una página del inventario (`POST /api/inventory/query`). */
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
  /** Ejecuta una acción con estado de carga y aviso de resultado. */
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
  /** Consulta el elemento con su historial (`POST /api/inventory/:id/query`). */
  function showHistory(resource: InventoryResource) {
    void perform(async () => {
      const result = await client.send<{ resource: InventoryResource }>(
        `/api/inventory/${resource.id}/query`,
        {},
      );
      setHistory({ scope: listScope, resource: result.resource });
    });
  }
  /** Da de baja el elemento (`DELETE /api/inventory/:id`) y recarga la lista. */
  function archiveResource(resource: InventoryResource) {
    void perform(async () => {
      await client.send(
        `/api/inventory/${resource.id}`,
        { version: resource.version },
        "DELETE",
      );
      setArchive(null);
      setNotice("El elemento fue dado de baja. Su historial se conserva.");
      await load();
    });
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
        <PageHeading
          icon="inventory"
          tone="info"
          title="Inventario de ExpoTec"
          subtitle="Ingresá con una cuenta de administración o préstamos para consultar el inventario."
        />
        {!user && <Button title="Ingresar" onPress={onAccount} />}
      </Screen>
    );
  return (
    <Screen>
      <PageHeading
        icon="inventory"
        tone="info"
        title="Inventario de ExpoTec"
        subtitle="Existencias y reservas compartidas de elementos para los proyectos."
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <RefreshButton
          label="Actualizar inventario"
          loading={loading}
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
        Las unidades fuera de servicio no están disponibles. Las reservas se
        conservan entre jornadas; las entregas y devoluciones actualizan las
        unidades que todavía están prestadas.
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
      <ContentGrid testID="inventory-grid" minItemWidth={280} maxColumns={4}>
        {visible
          .filter((item) =>
            item.name
              .toLocaleLowerCase("es")
              .includes(search.trim().toLocaleLowerCase("es")),
          )
          .map((resource) => (
            <InventoryCard
              key={resource.id}
              resource={resource}
              canManage={canManage}
              busy={busy}
              locked={!!editing}
              archiving={archive?.id === resource.id}
              onEdit={() => {
                setEditor({ scope, resource, revision: 0 });
                setArchive(null);
                setHistory(null);
                setNotice("");
              }}
              onArchive={() => {
                setArchive(resource);
                setHistory(null);
              }}
              onCancelArchive={() => setArchive(null)}
              onConfirmArchive={() => archiveResource(resource)}
              onHistory={() => showHistory(resource)}
            >
              {shownHistory?.id === resource.id && (
                <InventoryHistory
                  resource={shownHistory}
                  onClose={() => setHistory(null)}
                />
              )}
            </InventoryCard>
          ))}
      </ContentGrid>
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
