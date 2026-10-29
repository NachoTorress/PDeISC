/**
 * Estado y acciones de la pantalla de espacios compartidos
 * (`SharedSpacesPage`).
 *
 * De dónde viene: lo usa la pantalla de espacios. A dónde va: devuelve la
 * lista de espacios, el plano elegido, el borrador de edición (solo
 * administración) y las acciones para crear, acomodar, guardar, descartar o
 * dar de baja un espacio.
 *
 * Usa `POST /api/spaces/query` y `POST /api/spaces/:id/query` para consultar,
 * `POST /api/spaces` para crear, `PUT /api/spaces/:id` para guardar el plano y
 * `DELETE /api/spaces/:id` para darlo de baja. Mientras hay un borrador, volver
 * a la pantalla no lo reemplaza con datos del servidor.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../contexts/AuthContext";
import { AuthError } from "../lib/authTypes";
import { editSharedSpace, sharedSpaceBody } from "../lib/sharedSpaces";
import {
  addDraftFurniture,
  fitDraft,
  replaceDraftSpace,
  toggleDraftBooth,
  updateDraftFurniture,
} from "../lib/spaceDraftEdits";
import type { FurniturePosition } from "../lib/spaceDraftEdits";
import type {
  SharedSpace,
  SpaceDraft,
  SpaceSummary,
} from "../lib/sharedSpaces";
import type { Furniture, Space } from "../lib/types";

/** Resumen de un espacio para la lista. */
function summary(space: SharedSpace): SpaceSummary {
  const { furniture, booths, ...details } = space;
  return {
    ...details,
    furnitureCount: furniture.length,
    boothCount: booths.length,
  };
}

export function useSharedSpaces() {
  const { client, user, ready } = useAuth();
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

  /** Recarga la lista de espacios. */
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await client.query<{ spaces: SpaceSummary[] }>(
        "/api/spaces/query",
        {},
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
      .query<{ space: SharedSpace }>(`/api/spaces/${spaceId}/query`, {})
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
  /** Aplica un cambio puro al borrador, si existe. */
  function edit(change: (draft: SpaceDraft) => SpaceDraft) {
    setDraft((current) => (current ? change(current) : null));
  }
  /** Ajusta piezas que quedarían fuera del plano. */
  const fit = useCallback((positions: FurniturePosition[]) => {
    setDraft((current) => (current ? fitDraft(current, positions) : null));
  }, []);
  /** Modifica una pieza del borrador. */
  function updateFurniture(id: string, changes: Partial<Furniture>) {
    edit((draft) => updateDraftFurniture(draft, id, changes));
  }
  /** Toma la versión guardada como base del editor. */
  function accept(next: SharedSpace) {
    setSource(next);
    setSpaces((current) => {
      const items = current ?? [];
      return items.some((item) => item.id === next.id)
        ? items.map((item) => (item.id === next.id ? summary(next) : item))
        : [...items, summary(next)];
    });
  }
  /** Ejecuta una acción con estado de carga y errores. */
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
  /** Descarta el borrador y recarga la versión guardada. */
  async function discard() {
    if (!spaceId) return;
    const result = await client.query<{ space: SharedSpace }>(
      `/api/spaces/${spaceId}/query`,
      {},
    );
    accept(result.space);
    setDraft(null);
    setSelected(null);
    setConfirm(null);
    setNotice("Se cargó la versión guardada en el servidor.");
  }

  /** Abre o cierra el formulario de alta. */
  function toggleAdding() {
    setAdding(!adding);
    setEditorId(user!.id);
  }
  /** Crea un espacio vacío y lo abre en el editor. */
  function create(name: string, description: string) {
    void perform(async () => {
      const result = await client.send<{ space: SharedSpace }>(
        "/api/spaces",
        { name, description },
        "POST",
      );
      accept(result.space);
      setSpaceId(result.space.id);
      setDraft(editSharedSpace(result.space));
      setEditorId(user!.id);
      setAdding(false);
      setNotice(
        "Espacio creado. Agregá su mobiliario y habilitá los puestos que se usarán para proyectos.",
      );
    });
  }
  /** Cambia el espacio consultado. */
  function chooseSpace(id: string) {
    setSpaceId(id);
    setConfirm(null);
    setError("");
    setNotice("");
  }
  /** Copia el plano guardado en un borrador editable. */
  function startEditing() {
    if (!source) return;
    setDraft(editSharedSpace(source));
    setEditorId(user!.id);
    setSelected(null);
    setError("");
    setNotice("");
  }
  /** Guarda el borrador completo del plano. */
  function save() {
    if (!editing || !space) return;
    void perform(async () => {
      const result = await client.send<{ space: SharedSpace }>(
        `/api/spaces/${space.id}`,
        sharedSpaceBody(editing),
        "PUT",
      );
      accept(result.space);
      setDraft(null);
      setConfirm(null);
      setSelected(null);
      setNotice(
        "El plano quedó guardado y disponible para todos los dispositivos.",
      );
    });
  }
  /** Agrega una pieza nueva al borrador y la selecciona. */
  function addFurniture(item: Furniture) {
    edit((draft) => addDraftFurniture(draft, item));
    setSelected(item.id);
  }
  /** Reemplaza los datos del espacio en el borrador (nombre, piezas…). */
  function changeSpace(next: Space) {
    edit((draft) => replaceDraftSpace(draft, next));
  }
  /** Habilita o deshabilita la mesa elegida como puesto para proyectos. */
  function toggleBooth(enabled: boolean) {
    if (!chosen) return;
    if (!enabled && chosenBooth?.projectId) {
      setError("Este puesto tiene un proyecto confirmado y debe conservarse.");
      return;
    }
    edit((draft) => toggleDraftBooth(draft, chosen.id, enabled));
  }
  /** Ejecuta la acción confirmada: descartar el borrador o dar de baja. */
  function confirmAction() {
    void perform(
      confirm === "discard"
        ? discard
        : async () => {
            if (!source) return;
            await client.send(
              `/api/spaces/${source.id}`,
              { version: source.version },
              "DELETE",
            );
            setSource(null);
            setSpaceId(null);
            setConfirm(null);
            await reload();
            setNotice("El espacio fue dado de baja.");
          },
    );
  }

  return {
    canEdit,
    editing,
    space,
    spaces,
    spaceId,
    selected,
    setSelected,
    loading,
    detailLoading,
    busy,
    adding,
    confirm,
    setConfirm,
    error,
    notice,
    setGestureActive,
    gestureActive,
    boothIds,
    chosen,
    chosenBooth,
    occupied,
    reload,
    fit,
    updateFurniture,
    toggleAdding,
    create,
    chooseSpace,
    startEditing,
    save,
    addFurniture,
    changeSpace,
    toggleBooth,
    confirmAction,
  };
}
