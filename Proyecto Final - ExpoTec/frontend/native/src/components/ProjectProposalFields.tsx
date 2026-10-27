/** Campos de la propuesta en la demostración: datos del proyecto y elección del puesto. */
import { Text, View } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import { teacherNames } from "../lib/format";
import type { DemoState, Project } from "../lib/types";
import { CheckRow, Choice, Field, Section } from "./ui";
import { freeProjectTables } from "./projectFormModel";
import type { ProjectDraft } from "./projectFormModel";

/** Función que actualiza un campo del borrador. */
export type DraftUpdate = <K extends keyof ProjectDraft>(
  key: K,
  value: ProjectDraft[K],
) => void;
type Props = {
  draft: ProjectDraft;
  update: DraftUpdate;
  errorFor: (key: string) => string;
};

/** Nombre, descripción, curso, materias e imagen. */
export function ProjectProposalFields({ draft, update, errorFor }: Props) {
  const { colors } = useTheme();
  return (
    <Section title="Tu propuesta">
      <Field
        label="Nombre del proyecto"
        value={draft.name}
        maxLength={80}
        autoFocus
        onChangeText={(value) => update("name", value)}
        error={errorFor("name")}
      />
      <Field
        label="Curso y especialidad"
        value={draft.course}
        maxLength={100}
        onChangeText={(value) => update("course", value)}
        error={errorFor("course")}
        hint="Por ejemplo: 6° 1° · Electromecánica."
      />
      <Field
        label="¿Qué hace el proyecto?"
        value={draft.description}
        multiline
        maxLength={800}
        onChangeText={(value) => update("description", value)}
        error={errorFor("description")}
        hint={`${draft.description.length}/800 caracteres. Mínimo 20.`}
      />
      <Field
        label="Materias vinculadas"
        value={draft.subjects}
        onChangeText={(value) => update("subjects", value)}
        error={errorFor("subjects")}
        hint="Separá las materias con una coma."
      />
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontWeight: "600" }}>
          Profesores responsables
        </Text>
        <CheckRow
          label="Marcar todos"
          checked={teacherNames.every((name) => draft.teachers.includes(name))}
          onChange={(checked) =>
            update("teachers", checked ? [...teacherNames] : [])
          }
        />
        {teacherNames.map((name) => (
          <CheckRow
            key={name}
            label={name}
            checked={draft.teachers.includes(name)}
            onChange={(checked) =>
              update(
                "teachers",
                checked
                  ? [...draft.teachers, name]
                  : draft.teachers.filter((teacher) => teacher !== name),
              )
            }
          />
        ))}
        {!!errorFor("teachers") && (
          <Text accessibilityRole="alert" style={{ color: colors.error }}>
            {errorFor("teachers")}
          </Text>
        )}
      </View>
    </Section>
  );
}

/** Espacio y mesa solicitados. */
export function ProjectPlaceFields({
  draft,
  update,
  errorFor,
  state,
  editing,
}: Props & { state: DemoState; editing?: Project }) {
  const { colors } = useTheme();
  const spaces = state.spaces.filter(
    (space) => freeProjectTables(state, space.id, editing?.id).length,
  );
  const tables = freeProjectTables(state, draft.spaceId, editing?.id);
  return (
    <Section title="Lugar y elementos">
      <Choice
        label="Espacio"
        value={draft.spaceId}
        options={spaces.map((space) => ({
          value: space.id,
          label: space.name,
        }))}
        onChange={(value) => {
          update("spaceId", value);
          update("furnitureId", "");
        }}
      />
      {!!errorFor("spaceId") && (
        <Text accessibilityRole="alert" style={{ color: colors.error }}>
          {errorFor("spaceId")}
        </Text>
      )}
      {!spaces.length && (
        <Text style={{ color: colors.muted }}>
          No hay mesas disponibles. Consultá con la organización para agregar
          lugares.
        </Text>
      )}
      <Choice
        label="Mesa disponible"
        value={draft.furnitureId}
        options={tables.map((table) => ({
          value: table.id,
          label: `Mesa ${table.id}`,
        }))}
        onChange={(value) => update("furnitureId", value)}
      />
      {!!errorFor("furnitureId") && (
        <Text accessibilityRole="alert" style={{ color: colors.error }}>
          {errorFor("furnitureId")}
        </Text>
      )}
      <Text style={{ color: colors.muted }}>
        El lugar queda ocupado cuando un profesor confirma la propuesta.
      </Text>
      {state.resources.map((resource) => (
        <Field
          key={resource.id}
          label={resource.name}
          value={draft.resources[resource.id] ?? "0"}
          keyboardType="number-pad"
          maxLength={8}
          onChangeText={(value) =>
            update("resources", { ...draft.resources, [resource.id]: value })
          }
          error={errorFor(`resource-${resource.id}`)}
          hint={`${resource.total} en el inventario.${resource.total > 1000 ? " Máximo 1000 por propuesta." : ""} Poné 0 si no lo necesitás.`}
        />
      ))}
    </Section>
  );
}
