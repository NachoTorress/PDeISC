/**
 * Pantalla de la demostración (datos locales del dispositivo, sin servidor).
 * Plano de espacios con editor de mobiliario para el perfil de organización.
 *
 * Las tarjetas laterales y los destacados están en `components/map/`.
 */
import { useCallback, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useDemo } from "../hooks/useDemo";
import { useTheme } from "../contexts/ThemeContext";
import NativeFloorplan from "../components/NativeFloorplan";
import NativeSpaceEditor from "../components/NativeSpaceEditor";
import { Button, Card, Screen } from "../components/ui";
import { MapSelectionCard } from "../components/map/MapSelectionCard";
import { MapOverview } from "../components/map/MapOverview";
import { MapFeatured } from "../components/map/MapFeatured";
import { MapIntro } from "../components/map/MapIntro";
import { isProjectMember } from "../lib/team";
import { cloneData } from "../lib/clone";
import { newId, today } from "../lib/helpers";
import type { Furniture, Space } from "../lib/types";

/** Presenta la distribución pública y permite a administración guardar un borrador del plano. */
export default function MapPage({
  onSelectProject,
  onProjects,
  onNewProject,
}: {
  onSelectProject: (id: string) => void;
  onProjects: () => void;
  onNewProject: () => void;
}) {
  const { state, role, mutate, notify } = useDemo();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const [spaceId, setSpaceId] = useState("patio");
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState<Space | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [gestureActive, setGestureActive] = useState(false);
  const source =
    state.spaces.find((item) => item.id === spaceId) ?? state.spaces[0];
  const space = draft ?? source;
  const visible = state.projects.filter(
    (project) =>
      project.status === "approved" ||
      role === "admin" ||
      (role === "student" && isProjectMember(project, "Lucía Fernández")) ||
      (role === "teacher" && project.teachers.includes("Martín García")),
  );
  const approved = visible.filter((project) => project.status === "approved");
  const spaceProjects = visible.filter(
    (project) => project.spaceId === space?.id,
  );
  const tables = space?.furniture.filter((item) => item.type === "table") ?? [];
  const taken = spaceProjects.filter(
    (project) => project.status === "approved",
  ).length;
  const chosen = spaceProjects.find(
    (project) =>
      project.furnitureId === selected && project.status === "approved",
  );
  const selectedItem = space?.furniture.find((item) => item.id === selected);
  const pending = visible.filter((project) => project.status === "pending");
  const allTables = state.spaces
    .flatMap((item) => item.furniture)
    .filter((item) => item.type === "table").length;
  /** Reemplaza la lista de piezas del borrador, si existe. */
  function editFurniture(change: (items: Furniture[]) => Furniture[]) {
    setDraft((current) =>
      current ? { ...current, furniture: change(current.furniture) } : null,
    );
  }
  /** Reubica piezas que quedarían fuera del plano. */
  const fitPositions = useCallback(
    (positions: { id: string; x: number; y: number }[]) => {
      setDraft((current) =>
        current
          ? {
              ...current,
              furniture: current.furniture.map((item) => {
                const position = positions.find(
                  (entry) => entry.id === item.id,
                );
                return position
                  ? { ...item, x: position.x, y: position.y }
                  : item;
              }),
            }
          : null,
      );
    },
    [],
  );
  /** Cambia el espacio visible. */
  function changeSpace(id: string) {
    setSpaceId(id);
    setSelected(null);
    setDraft(null);
    setError("");
  }
  /** Guarda el plano editado. */
  function save() {
    if (!draft) return;
    const result = mutate({ type: "saveSpace", space: draft });
    if (result) {
      setError(result);
      return;
    }
    setDraft(null);
    setError("");
    notify("La distribución quedó guardada en este dispositivo.");
  }
  /** Crea un espacio nuevo en la demo. */
  function createSpace(name: string) {
    const next: Space = {
      id: newId(),
      name,
      description: "Espacio nuevo · configurá su distribución",
      furniture: [],
      createdAt: today(),
    };
    const result = mutate({ type: "saveSpace", space: next });
    if (result) {
      setError(result);
      return;
    }
    setAdding(false);
    setSpaceId(next.id);
    setDraft(next);
    setSelected(null);
    setError("");
    notify("Espacio creado. Agregá su mobiliario.");
  }
  /** Elimina el espacio vacío elegido; devuelve true si se pudo. */
  function deleteSpace() {
    if (!space) return false;
    const result = mutate({ type: "deleteSpace", id: space.id });
    if (result) {
      setError(result);
      return false;
    }
    setSelected(null);
    notify("Espacio eliminado.");
    return true;
  }
  const paragraph = { color: colors.muted, lineHeight: 22 };
  return (
    <Screen scrollEnabled={!gestureActive}>
      {!draft && (
        <MapIntro
          role={role}
          adding={adding}
          confirmed={approved.length}
          available={allTables - approved.length}
          spaceId={space?.id ?? ""}
          onToggleAdding={() => setAdding(!adding)}
          onCreate={createSpace}
          onCancelAdding={() => {
            setAdding(false);
            setError("");
          }}
          onChangeSpace={changeSpace}
          onNewProject={onNewProject}
          onProjects={onProjects}
        />
      )}
      {!!error && (
        <Card>
          <Text accessibilityRole="alert" style={{ color: colors.error }}>
            {error}
          </Text>
        </Card>
      )}
      {space ? (
        <View style={[styles.layout, width >= 1050 && styles.wide]}>
          <Card style={width >= 1050 ? styles.planWide : undefined}>
            <Text
              style={{ color: colors.text, fontSize: 22, fontWeight: "600" }}
            >
              {space.name}
            </Text>
            {!draft && <Text style={paragraph}>{space.description}</Text>}
            {role === "admin" &&
              (draft ? (
                <View style={styles.actions}>
                  <Button
                    title="Guardar"
                    accessibilityLabel="Guardar plano"
                    icon="save"
                    style={{ flex: 1, minWidth: 0, paddingHorizontal: 8 }}
                    disabled={
                      draft.name.trim().length < 2 ||
                      draft.furniture.some(
                        (item) =>
                          item.type === "label" &&
                          (item.text?.trim().length ?? 0) < 2,
                      )
                    }
                    onPress={save}
                  />
                  <Button
                    title="Cancelar"
                    icon="close"
                    variant="quiet"
                    style={{ flex: 1, minWidth: 0, paddingHorizontal: 8 }}
                    onPress={() => {
                      setDraft(null);
                      setSelected(null);
                      setError("");
                    }}
                  />
                </View>
              ) : (
                <Button
                  title="Acomodar espacio"
                  icon="edit"
                  variant="secondary"
                  onPress={() => {
                    setDraft(cloneData(space));
                    setSelected(null);
                  }}
                />
              ))}
            <NativeFloorplan
              space={space}
              projects={visible}
              editing={Boolean(draft)}
              showPending={role !== "guest"}
              selected={selected}
              onSelect={setSelected}
              onFit={fitPositions}
              onGestureActiveChange={setGestureActive}
              onAddFurniture={(furniture) => {
                editFurniture((items) => [...items, furniture]);
                setSelected(furniture.id);
              }}
              onMove={(id, x, y) =>
                editFurniture((items) =>
                  items.map((item) =>
                    item.id === id ? { ...item, x, y } : item,
                  ),
                )
              }
              onResize={(id, geometry) =>
                editFurniture((items) =>
                  items.map((item) =>
                    item.id === id ? { ...item, ...geometry } : item,
                  ),
                )
              }
            />
          </Card>
          <View style={width >= 1050 ? styles.sidebarWide : styles.sidebar}>
            {draft ? (
              <NativeSpaceEditor
                space={draft}
                protectedFurnitureIds={state.projects
                  .filter((project) => project.spaceId === draft.id)
                  .map((project) => project.furnitureId)}
                selected={selected}
                onChange={setDraft}
                onSelect={setSelected}
              />
            ) : selectedItem ? (
              <MapSelectionCard
                project={chosen}
                item={selectedItem}
                role={role}
                onSelectProject={onSelectProject}
                onNewProject={onNewProject}
                onClose={() => setSelected(null)}
              />
            ) : (
              <MapOverview
                key={space.id}
                space={space}
                tables={tables.length}
                taken={taken}
                pending={pending}
                role={role}
                canDelete={
                  !state.projects.some(
                    (project) => project.spaceId === space.id,
                  )
                }
                onSelectProject={onSelectProject}
                onDelete={deleteSpace}
              />
            )}
          </View>
        </View>
      ) : (
        <Card>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "600" }}>
            Creá el primer espacio
          </Text>
          <Text style={paragraph}>
            Agregá un aula o patio para empezar a acomodar sus puestos.
          </Text>
        </Card>
      )}
      <MapFeatured
        projects={approved}
        spaces={state.spaces}
        onSelectProject={onSelectProject}
      />
      <Button
        title="Todos los proyectos"
        icon="projects"
        variant="quiet"
        onPress={onProjects}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  layout: { gap: 12 },
  wide: { flexDirection: "row", alignItems: "flex-start" },
  planWide: { flex: 1, minWidth: 0 },
  sidebar: { gap: 12 },
  sidebarWide: { width: 296, gap: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
