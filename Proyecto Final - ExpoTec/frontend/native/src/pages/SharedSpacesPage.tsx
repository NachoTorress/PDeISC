import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Button,
  Card,
  CheckRow,
  Field,
  Heading,
  InlineConfirm,
  Screen,
} from "../components/ui";
import NativeFloorplan from "../components/NativeFloorplan";
import NativeSpaceEditor from "../components/NativeSpaceEditor";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { AuthError } from "../lib/authTypes";
import {
  changeSharedFurniture,
  editSharedSpace,
  sharedSpaceBody,
} from "../lib/sharedSpaces";
import type {
  SharedSpace,
  SpaceDraft,
  SpaceSummary,
} from "../lib/sharedSpaces";
import type { Furniture } from "../lib/types";
import { formatDate } from "../lib/format";

function summary(space: SharedSpace): SpaceSummary {
  const { furniture, booths, ...details } = space;
  return {
    ...details,
    furnitureCount: furniture.length,
    boothCount: booths.length,
  };
}

export default function SharedSpacesPage({
  onGallery,
  onPresentation,
  onDemo,
  onProjects,
  onSelectProject,
}: {
  onGallery: () => void;
  onDemo: () => void;
  onPresentation: () => void;
  onProjects: () => void;
  onSelectProject: (id: string) => void;
}) {
  const { client, user, ready } = useAuth();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [spaces, setSpaces] = useState<SpaceSummary[] | null>(null);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [source, setSource] = useState<SharedSpace | null>(null);
  const [draft, setDraft] = useState<SpaceDraft | null>(null);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [confirm, setConfirm] = useState<"discard" | "archive" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [gestureActive, setGestureActive] = useState(false);
  const working = useRef(false);
  const canEdit = ready && !!user?.roles.includes("admin");
  const editing = canEdit && editorId === user?.id ? draft : null;
  const space = editing?.space ?? source;
  const boothIds =
    editing?.boothFurnitureIds ??
    source?.booths.map((booth) => booth.furnitureId) ??
    [];
  const chosen = space?.furniture.find((item) => item.id === selected);
  const chosenBooth = source?.booths.find(
    (booth) => booth.furnitureId === selected,
  );
  const occupied =
    source?.booths
      .filter((booth) => booth.projectId)
      .map((booth) => ({
        furnitureId: booth.furnitureId,
        name: booth.projectName ?? "Proyecto confirmado",
      })) ?? [];

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await client.query<{ spaces: SpaceSummary[] }>(
        "/api/spaces/query",
      );
      setSpaces(result.spaces);
      setSpaceId((current) =>
        result.spaces.some((item) => item.id === current)
          ? current
          : (result.spaces[0]?.id ?? null),
      );
      setRevision((current) => current + 1);
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos cargar los espacios.",
      );
    } finally {
      setLoading(false);
    }
  }, [client]);
  // Consultar de nuevo al volver de una confirmación, sin reemplazar un borrador.
  const hasDraft = !!editing;
  useFocusEffect(
    useCallback(() => {
      if (!hasDraft) void reload();
    }, [reload, hasDraft]),
  );
  useEffect(() => {
    let active = true;
    setSelected(null);
    setSource(null);
    setDetailLoading(!!spaceId);
    if (!spaceId) return;
    client
      .query<{ space: SharedSpace }>(`/api/spaces/${spaceId}/query`)
      .then((result) => {
        if (active) setSource(result.space);
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error
              ? cause.message
              : "No pudimos cargar el plano.",
          );
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client, spaceId, revision]);
  useEffect(() => {
    if ((ready && !canEdit) || editorId !== (user?.id ?? null)) {
      setDraft(null);
      setAdding(false);
      setConfirm(null);
    }
  }, [ready, canEdit, editorId, user?.id]);
  const fit = useCallback(
    (positions: { id: string; x: number; y: number }[]) => {
      setDraft((current) =>
        current
          ? {
              ...current,
              space: {
                ...current.space,
                furniture: current.space.furniture.map((item) => {
                  const position = positions.find(
                    (entry) => entry.id === item.id,
                  );
                  return position
                    ? { ...item, x: position.x, y: position.y }
                    : item;
                }),
              },
            }
          : null,
      );
    },
    [],
  );
  function updateFurniture(id: string, changes: Partial<Furniture>) {
    setDraft((current) =>
      current
        ? changeSharedFurniture(
            current,
            current.space.furniture.map((item) =>
              item.id === id ? { ...item, ...changes } : item,
            ),
          )
        : null,
    );
  }
  function accept(next: SharedSpace) {
    setSource(next);
    setSpaces((current) => {
      const items = current ?? [];
      return items.some((item) => item.id === next.id)
        ? items.map((item) => (item.id === next.id ? summary(next) : item))
        : [...items, summary(next)];
    });
  }
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
          : "No pudimos guardar los cambios.",
      );
      if (cause instanceof AuthError && cause.status === 403)
        void client.verify().catch(() => {});
    } finally {
      working.current = false;
      setBusy(false);
    }
  }
  async function discard() {
    if (!spaceId) return;
    const result = await client.query<{ space: SharedSpace }>(
      `/api/spaces/${spaceId}/query`,
    );
    accept(result.space);
    setDraft(null);
    setSelected(null);
    setConfirm(null);
    setNotice("Se cargó la versión guardada en el servidor.");
  }
  const paragraph = { color: colors.muted, fontSize: 15, lineHeight: 22 };
  return (
    <Screen scrollEnabled={!gestureActive}>
      <Heading
        title="Espacios de ExpoTec"
        subtitle="Planos compartidos de la exposición"
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button title="Galería de la ExpoTec" icon="gallery" variant="secondary" onPress={onGallery} disabled={!!editing || busy} />
        <Button
          title="Ver proyectos"
          icon="projects"
          onPress={onProjects}
          disabled={!!editing || busy}
        />
        <Button
          title="Presentación TV"
          icon="tv"
          variant="secondary"
          onPress={onPresentation}
          disabled={!!editing || busy}
        />
        <Button
          title={loading ? "Actualizando…" : "Actualizar espacios"}
          variant="secondary"
          disabled={busy || loading || !!editing}
          onPress={() => {
            setConfirm(null);
            void reload();
          }}
        />
        {canEdit && (
          <Button
            title={adding ? "Cancelar nuevo espacio" : "Nuevo espacio"}
            icon={adding ? "close" : "plus"}
            disabled={busy || loading || !!editing}
            onPress={() => {
              setAdding(!adding);
              setEditorId(user!.id);
            }}
          />
        )}
      </View>
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ ...paragraph, color: colors.error }}
        >
          {error}
          {space ? " Los datos visibles pueden estar desactualizados." : ""}
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
      {adding && canEdit && (
        <Card>
          <Field
            label="Nombre del nuevo espacio"
            value={name}
            onChangeText={setName}
            maxLength={80}
            editable={!busy}
            error={
              name.length > 0 && name.trim().length < 2
                ? "Escribí al menos 2 caracteres."
                : undefined
            }
          />
          <Field
            label="Descripción del nuevo espacio"
            value={description}
            onChangeText={setDescription}
            maxLength={150}
            editable={!busy}
          />
          <Button
            title={busy ? "Creando…" : "Crear espacio"}
            disabled={busy || name.trim().length < 2}
            onPress={() => {
              void perform(async () => {
                const result = await client.send<{ space: SharedSpace }>(
                  "/api/spaces/create",
                  { name: name.trim(), description: description.trim() },
                );
                accept(result.space);
                setSpaceId(result.space.id);
                setDraft(editSharedSpace(result.space));
                setEditorId(user!.id);
                setAdding(false);
                setName("");
                setDescription("");
                setNotice(
                  "Espacio creado. Agregá su mobiliario y habilitá los puestos que se usarán para proyectos.",
                );
              });
            }}
          />
        </Card>
      )}
      {loading && spaces === null ? (
        <ActivityIndicator color={colors.primary} />
      ) : spaces?.length === 0 ? (
        <Card>
          <Heading title="Todavía no hay espacios cargados" />
          <Text style={paragraph}>
            {canEdit
              ? "Creá un aula, patio o taller para empezar a organizar la exposición."
              : "La organización todavía no publicó la distribución de la exposición."}
          </Text>
        </Card>
      ) : null}
      {!!spaces?.length && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {spaces.map((item) => (
            <Button
              key={item.id}
              title={`${item.name} · ${item.boothCount} ${item.boothCount === 1 ? "puesto" : "puestos"}`}
              variant={item.id === spaceId ? "primary" : "secondary"}
              disabled={busy || !!editing || loading}
              onPress={() => {
                setSpaceId(item.id);
                setConfirm(null);
                setError("");
                setNotice("");
              }}
            />
          ))}
        </View>
      )}
      {detailLoading && !editing && (
        <ActivityIndicator color={colors.primary} />
      )}
      {space && (
        <View
          style={{
            flexDirection: width >= 900 ? "row" : "column",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <Card style={width >= 900 ? { flex: 1, minWidth: 0 } : undefined}>
            <Heading
              title={space.name}
              subtitle={space.description || undefined}
            />
            {canEdit &&
              (editing ? (
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  <Button
                    title={busy ? "Guardando…" : "Guardar plano"}
                    icon="save"
                    disabled={
                      busy ||
                      detailLoading ||
                      editing.space.name.trim().length < 2 ||
                      editing.space.furniture.some(
                        (item) =>
                          item.type === "label" &&
                          (item.text?.trim().length ?? 0) < 2,
                      )
                    }
                    onPress={() => {
                      void perform(async () => {
                        const result = await client.send<{
                          space: SharedSpace;
                        }>(
                          `/api/spaces/${space.id}/save`,
                          sharedSpaceBody(editing),
                        );
                        accept(result.space);
                        setDraft(null);
                        setConfirm(null);
                        setSelected(null);
                        setNotice(
                          "El plano quedó guardado y disponible para todos los dispositivos.",
                        );
                      });
                    }}
                  />
                  <Button
                    title="Descartar borrador y recargar"
                    variant="quiet"
                    disabled={busy}
                    onPress={() => setConfirm("discard")}
                  />
                </View>
              ) : (
                <Button
                  title="Acomodar espacio"
                  icon="edit"
                  variant="secondary"
                  disabled={busy || loading || detailLoading}
                  onPress={() => {
                    if (source) {
                      setDraft(editSharedSpace(source));
                      setEditorId(user!.id);
                      setSelected(null);
                      setError("");
                      setNotice("");
                    }
                  }}
                />
              ))}
            <View pointerEvents={busy ? "none" : "auto"}>
              <NativeFloorplan
                space={space}
                projects={[]}
                shared
                boothFurnitureIds={boothIds}
                occupiedBooths={occupied}
                editing={!!editing}
                showPending={false}
                selected={selected}
                onSelect={setSelected}
                onFit={fit}
                onGestureActiveChange={setGestureActive}
                onAddFurniture={(item) => {
                  setDraft((current) =>
                    current
                      ? changeSharedFurniture(current, [
                          ...current.space.furniture,
                          item,
                        ])
                      : null,
                  );
                  setSelected(item.id);
                }}
                onMove={(id, x, y) => updateFurniture(id, { x, y })}
                onResize={(id, geometry) => updateFurniture(id, geometry)}
              />
            </View>
          </Card>
          <View
            style={{ width: width >= 900 ? 300 : "100%", gap: 12 }}
            pointerEvents={busy ? "none" : "auto"}
          >
            {editing ? (
              <>
                <NativeSpaceEditor
                  space={editing.space}
                  selected={selected}
                  protectedFurnitureIds={occupied.map(
                    (booth) => booth.furnitureId,
                  )}
                  onSelect={setSelected}
                  onChange={(next) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...changeSharedFurniture(current, next.furniture),
                            space: next,
                          }
                        : null,
                    )
                  }
                />
                {chosen?.type === "table" && (
                  <Card>
                    <CheckRow
                      label="Habilitar esta mesa como puesto para proyectos"
                      checked={boothIds.includes(chosen.id)}
                      onChange={(enabled) => {
                        if (!enabled && chosenBooth?.projectId) {
                          setError(
                            "Este puesto tiene un proyecto confirmado y debe conservarse.",
                          );
                          return;
                        }
                        setDraft((current) =>
                          current
                            ? {
                                ...current,
                                boothFurnitureIds: enabled
                                  ? [...current.boothFurnitureIds, chosen.id]
                                  : current.boothFurnitureIds.filter(
                                      (id) => id !== chosen.id,
                                    ),
                              }
                            : null,
                        );
                      }}
                    />
                    <Text style={paragraph}>
                      Las mesas se agregan como mobiliario. Habilitá solo las
                      destinadas a recibir proyectos.
                    </Text>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <Heading
                  title={
                    chosen
                      ? chosen.type === "table"
                        ? `${boothIds.includes(chosen.id) ? "Puesto" : "Mesa"} ${chosen.id}`
                        : chosen.type === "label"
                          ? (chosen.text ?? "Zona")
                          : chosen.type === "bench"
                            ? "Banco"
                            : "Punto eléctrico"
                      : "Distribución compartida"
                  }
                />
                <Text style={paragraph}>
                  {chosen
                    ? chosen.type === "table"
                      ? boothIds.includes(chosen.id)
                        ? chosenBooth?.projectId
                          ? `Proyecto confirmado: ${chosenBooth.projectName}`
                          : "Disponible para solicitarlo al presentar un proyecto. El puesto se reserva cuando un profesor confirma la propuesta."
                        : "Mesa de mobiliario, sin inscripción de proyectos."
                      : "Elemento de la distribución del espacio."
                    : `${space.furniture.length} ${space.furniture.length === 1 ? "elemento" : "elementos"} · ${boothIds.length} ${boothIds.length === 1 ? "puesto habilitado" : "puestos habilitados"}`}
                </Text>
                {chosenBooth?.projectId && (
                  <Button
                    title="Ver proyecto confirmado"
                    variant="secondary"
                    onPress={() => onSelectProject(chosenBooth.projectId!)}
                  />
                )}
                <Text style={paragraph}>
                  Creado el {formatDate(space.createdAt)}
                </Text>
                <Text style={paragraph}>
                  Las posiciones son relativas al plano. Los puntos eléctricos
                  requieren revisión de personal habilitado.
                </Text>
                {canEdit && (
                  <Button
                    title="Dar de baja espacio"
                    variant="danger"
                    icon="trash"
                    disabled={busy}
                    onPress={() => setConfirm("archive")}
                  />
                )}
              </Card>
            )}
            {confirm && (
              <InlineConfirm
                text={
                  confirm === "discard"
                    ? "¿Descartar los cambios del borrador y cargar el plano guardado?"
                    : `¿Dar de baja ${space.name}? Dejará de aparecer en la consulta pública y se conservarán sus registros.`
                }
                confirmLabel={
                  confirm === "discard" ? "Descartar y recargar" : "Dar de baja"
                }
                onCancel={() => setConfirm(null)}
                onConfirm={() => {
                  void perform(
                    confirm === "discard"
                      ? discard
                      : async () => {
                          if (!source) return;
                          await client.send(
                            `/api/spaces/${source.id}/archive`,
                            { version: source.version },
                          );
                          setSource(null);
                          setSpaceId(null);
                          setConfirm(null);
                          await reload();
                          setNotice("El espacio fue dado de baja.");
                        },
                  );
                }}
              />
            )}
          </View>
        </View>
      )}
      <Button
        title="Ver demostración con datos de ejemplo"
        variant="quiet"
        onPress={onDemo}
      />
    </Screen>
  );
}
