import { useCallback, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useDemo } from "../hooks/useDemo";
import { useTheme } from "../contexts/ThemeContext";
import NativeFloorplan from "../components/NativeFloorplan";
import NativeSpaceEditor from "../components/NativeSpaceEditor";
import ProjectArt from "../components/ProjectArt";
import ContentGrid from "../components/ContentGrid";
import {
  Button,
  ActionRow,
  Card,
  Chip,
  Choice,
  Field,
  PageHeading,
  InlineConfirm,
  Screen,
} from "../components/ui";
import { formatDate } from "../lib/format";
import { isProjectMember } from "../lib/team";
import { cloneData } from "../lib/clone";
import { newId, today } from "../lib/helpers";
import type { Space } from "../lib/types";

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
  const [spaceName, setSpaceName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
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
  function changeSpace(id: string) {
    setSpaceId(id);
    setSelected(null);
    setDraft(null);
    setConfirmDelete(false);
    setError("");
  }
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
  function createSpace() {
    const next: Space = {
      id: newId(),
      name: spaceName.trim(),
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
    setSpaceName("");
    setSpaceId(next.id);
    setDraft(next);
    setSelected(null);
    setError("");
    notify("Espacio creado. Agregá su mobiliario.");
  }
  const paragraph = { color: colors.muted, lineHeight: 22 };
  return (
    <Screen scrollEnabled={!gestureActive}>
      <View style={[styles.header, width >= 700 && styles.headerWide]}>
        <View style={width >= 700 ? styles.headingWide : undefined}>
          <PageHeading
            icon="map"
            title="Todo en su lugar."
            subtitle="Organizá los espacios y dale lugar a cada proyecto."
          />
        </View>
        {role === "admin" ? (
          <Button
            title={adding ? "Cerrar nuevo espacio" : "Nuevo espacio"}
            icon={adding ? "close" : "plus"}
            onPress={() => setAdding(!adding)}
          />
        ) : role === "student" ? (
          <Button
            title="Cargar mi proyecto"
            icon="plus"
            onPress={onNewProject}
          />
        ) : (
          <Button
            title="Ver proyectos"
            endIcon="arrowRight"
            variant="secondary"
            onPress={onProjects}
          />
        )}
      </View>
      <View style={styles.overview}>
        <View style={styles.stats}>
          <Chip label={`${approved.length} confirmados`} />
          <Chip label={`${allTables - approved.length} puestos disponibles`} />
          <Chip label={`${state.spaces.length} espacios`} />
        </View>
        {adding && (
          <Card>
            <Field
              label="Nombre del nuevo espacio"
              value={spaceName}
              onChangeText={setSpaceName}
              maxLength={80}
              error={
                spaceName && spaceName.trim().length < 2
                  ? "Escribí al menos 2 caracteres."
                  : ""
              }
            />
            <Button
              title="Crear espacio"
              icon="check"
              disabled={spaceName.trim().length < 2}
              onPress={createSpace}
            />
            <Button
              title="Cancelar"
              icon="close"
              variant="quiet"
              onPress={() => {
                setAdding(false);
                setError("");
              }}
            />
          </Card>
        )}
        <Choice
          label="Elegir espacio"
          value={space?.id ?? ""}
          disabled={!!draft}
          options={state.spaces.map((item) => ({
            value: item.id,
            label: `${item.name} · ${state.projects.filter((project) => project.spaceId === item.id && project.status === "approved").length}/${item.furniture.filter((entry) => entry.type === "table").length}`,
          }))}
          onChange={changeSpace}
        />
      </View>
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
            <Text style={paragraph}>{space.description}</Text>
            {role === "admin" &&
              (draft ? (
                <View style={styles.actions}>
                  <Button
                    title="Guardar plano"
                    icon="save"
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
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        furniture: [...current.furniture, furniture],
                      }
                    : null,
                );
                setSelected(furniture.id);
              }}
              onMove={(id, x, y) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        furniture: current.furniture.map((item) =>
                          item.id === id ? { ...item, x, y } : item,
                        ),
                      }
                    : null,
                )
              }
              onResize={(id, geometry) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        furniture: current.furniture.map((item) =>
                          item.id === id ? { ...item, ...geometry } : item,
                        ),
                      }
                    : null,
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
            ) : chosen ? (
              <Card>
                <Chip label={`Puesto ${chosen.furnitureId} · ocupado`} />
                <ProjectArt project={chosen} />
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 22,
                    fontWeight: "600",
                  }}
                >
                  {chosen.name}
                </Text>
                <Text style={paragraph}>{chosen.description}</Text>
                <Text style={paragraph}>{chosen.course}</Text>
                <Button
                  title="Ver proyecto"
                  endIcon="external"
                  onPress={() => onSelectProject(chosen.id)}
                />
              </Card>
            ) : selectedItem ? (
              <Card>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 22,
                    fontWeight: "600",
                  }}
                >
                  {selectedItem.type === "table"
                    ? `Puesto ${selectedItem.id}`
                    : selectedItem.type === "bench"
                      ? "Banco"
                      : selectedItem.type === "label"
                        ? selectedItem.text
                        : "Punto eléctrico"}
                </Text>
                <Text style={paragraph}>
                  {selectedItem.type === "table"
                    ? "Este puesto está disponible. Se ocupa cuando un profesor confirma un proyecto."
                    : selectedItem.type === "power"
                      ? "Referencia de ubicación. La capacidad eléctrica debe revisarla personal habilitado."
                      : selectedItem.type === "label"
                        ? "Referencia de zona para orientarte dentro de este espacio."
                        : "Mobiliario del espacio. No es un puesto de inscripción."}
                </Text>
                {role === "student" && selectedItem.type === "table" && (
                  <Button
                    title="Cargar un proyecto"
                    icon="plus"
                    onPress={onNewProject}
                  />
                )}
                <Button
                  title="Volver al resumen"
                  icon="arrowLeft"
                  variant="quiet"
                  onPress={() => setSelected(null)}
                />
              </Card>
            ) : (
              <>
                <Card>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 20,
                      fontWeight: "600",
                    }}
                  >
                    El espacio, de un vistazo
                  </Text>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: 32,
                      fontWeight: "700",
                    }}
                  >
                    {tables.length - taken}{" "}
                    <Text style={{ fontSize: 16, fontWeight: "400" }}>
                      puestos libres
                    </Text>
                  </Text>
                  <Text style={paragraph}>
                    Puestos ocupados: {taken} de {tables.length}
                  </Text>
                  <Text style={paragraph}>
                    Puntos eléctricos de ejemplo:{" "}
                    {
                      space.furniture.filter((item) => item.type === "power")
                        .length
                    }
                  </Text>
                  <Text style={paragraph}>
                    Creado el {formatDate(space.createdAt)}
                  </Text>
                </Card>
                {pending.length > 0 && role !== "guest" && (
                  <Card>
                    <Text
                      style={{
                        color: colors.text,
                        fontSize: 20,
                        fontWeight: "600",
                      }}
                    >
                      Por confirmar · {pending.length}
                    </Text>
                    {pending.slice(0, 3).map((project) => (
                      <Button
                        key={project.id}
                        variant="secondary"
                        title={`${project.name} · ${project.furnitureId}`}
                        endIcon="arrowRight"
                        onPress={() => onSelectProject(project.id)}
                      />
                    ))}
                    <Text style={paragraph}>
                      El lugar se ocupa después de la confirmación.
                    </Text>
                  </Card>
                )}
                <Card>
                  <Text style={paragraph}>
                    Para una ExpoTec segura, la distribución eléctrica debe
                    revisarla personal habilitado.
                  </Text>
                </Card>
                {role === "admin" &&
                  !state.projects.some(
                    (project) => project.spaceId === space.id,
                  ) && (
                    <Card>
                      {confirmDelete ? (
                        <InlineConfirm
                          text={`¿Seguro que querés eliminar ${space.name} y su distribución?`}
                          confirmLabel="Eliminar espacio"
                          onCancel={() => setConfirmDelete(false)}
                          onConfirm={() => {
                            const result = mutate({
                              type: "deleteSpace",
                              id: space.id,
                            });
                            if (result) setError(result);
                            else {
                              setConfirmDelete(false);
                              setSelected(null);
                              notify("Espacio eliminado.");
                            }
                          }}
                        />
                      ) : (
                        <Button
                          title="Eliminar espacio vacío"
                          icon="trash"
                          variant="danger"
                          onPress={() => setConfirmDelete(true)}
                        />
                      )}
                    </Card>
                  )}
              </>
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
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "600" }}>
        Lo que vas a encontrar
      </Text>
      <ContentGrid>
        {approved.slice(0, 3).map((project) => (
          <Card key={project.id} style={{ flex: 1 }}>
            <ProjectArt project={project} compact />
            <Text
              style={{ color: colors.text, fontWeight: "700", fontSize: 18 }}
            >
              {project.name}
            </Text>
            <Text style={paragraph}>
              {project.course} ·{" "}
              {state.spaces.find((item) => item.id === project.spaceId)?.name} ·{" "}
              {project.furnitureId}
            </Text>
            <ActionRow footer>
              <Button
                title="Ver proyecto"
                endIcon="external"
                variant="secondary"
                onPress={() => onSelectProject(project.id)}
              />
            </ActionRow>
          </Card>
        ))}
      </ContentGrid>
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
  header: { gap: 12 },
  headerWide: { flexDirection: "row", alignItems: "center", gap: 16 },
  headingWide: { flex: 1, minWidth: 0 },
  overview: { gap: 12 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  layout: { gap: 12 },
  wide: { flexDirection: "row", alignItems: "flex-start" },
  planWide: { flex: 1, minWidth: 0 },
  sidebar: { gap: 12 },
  sidebarWide: { width: 296, gap: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
