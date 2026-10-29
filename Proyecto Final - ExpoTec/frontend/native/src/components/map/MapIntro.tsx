/**
 * Encabezado del plano de la demostración: título, acción principal según el
 * perfil (nuevo espacio, cargar proyecto o ver proyectos), cifras generales,
 * alta de espacio y selector de espacio.
 */
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { Button, Chip, Choice, PageHeading } from "../ui";
import { NewDemoSpaceForm } from "./NewDemoSpaceForm";
import { useDemo } from "../../hooks/useDemo";
import type { Role } from "../../lib/types";

export function MapIntro({
  role,
  adding,
  confirmed,
  available,
  spaceId,
  onToggleAdding,
  onCreate,
  onCancelAdding,
  onChangeSpace,
  onNewProject,
  onProjects,
}: {
  role: Role;
  /** true si el formulario de alta está abierto. */
  adding: boolean;
  /** Proyectos confirmados visibles. */
  confirmed: number;
  /** Puestos libres en todos los espacios. */
  available: number;
  spaceId: string;
  onToggleAdding: () => void;
  onCreate: (name: string) => void;
  onCancelAdding: () => void;
  onChangeSpace: (id: string) => void;
  onNewProject: () => void;
  onProjects: () => void;
}) {
  const { state } = useDemo();
  const { width } = useWindowDimensions();
  return (
    <>
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
            onPress={onToggleAdding}
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
          <Chip label={`${confirmed} confirmados`} />
          <Chip label={`${available} puestos disponibles`} />
          <Chip label={`${state.spaces.length} espacios`} />
        </View>
        {adding && (
          <NewDemoSpaceForm onCreate={onCreate} onCancel={onCancelAdding} />
        )}
        <Choice
          label="Elegir espacio"
          value={spaceId}
          options={state.spaces.map((item) => ({
            value: item.id,
            label: `${item.name} · ${state.projects.filter((project) => project.spaceId === item.id && project.status === "approved").length}/${item.furniture.filter((entry) => entry.type === "table").length}`,
          }))}
          onChange={onChangeSpace}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: { gap: 12 },
  headerWide: { flexDirection: "row", alignItems: "center", gap: 16 },
  headingWide: { flex: 1, minWidth: 0 },
  overview: { gap: 12 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
