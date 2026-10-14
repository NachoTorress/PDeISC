import type { DemoState, Project } from "./types";

type ProjectTeam = Pick<Project, "student"> & Partial<Pick<Project, "members">>;

const cleanName = (name: string) =>
  name.normalize("NFC").trim().replace(/\s+/gu, " ");

/** Compara nombres de integrantes sin diferencias de espacios o mayúsculas. */
export const memberKey = (name: string): string =>
  cleanName(name).toLocaleLowerCase("es");

/** Lee el equipo y conserva la compatibilidad con propuestas guardadas antes de esta función. */
export function projectMembers(project: ProjectTeam): string[] {
  return Array.isArray(project.members)
    ? [...project.members]
    : [project.student];
}

export function isProjectMember(project: ProjectTeam, name: string): boolean {
  return projectMembers(project).some(
    (member) => memberKey(member) === memberKey(name),
  );
}

/** Devuelve un mensaje para el formulario y la validación del modelo; vacío significa válido. */
export function memberNameError(name: string): string {
  if (typeof name !== "string")
    return "Ingresá el nombre y apellido del integrante.";
  const cleaned = cleanName(name);
  if (cleaned.length < 3 || cleaned.length > 100)
    return "El nombre y apellido deben tener entre 3 y 100 caracteres.";
  if (!/^[\p{L}'’ ]+$/u.test(cleaned))
    return "Usá solo letras, espacios y apóstrofes en el nombre y apellido.";
  if (cleaned.split(" ").length < 2)
    return "Ingresá al menos un nombre y un apellido.";
  if (!/^\p{L}+(?:['’]\p{L}+)*(?: \p{L}+(?:['’]\p{L}+)*)+$/u.test(cleaned))
    return "Los apóstrofes deben estar entre letras del nombre o apellido.";
  return "";
}

/** Devuelve errores por fila para que el formulario y el modelo compartan la misma validación. */
export function teamErrors(members: string[]): Record<number, string> {
  const errors: Record<number, string> = {};
  const positions = new Map<string, number>();
  members.forEach((name, index) => {
    const error = memberNameError(name);
    if (error) {
      errors[index] = error;
      return;
    }
    const key = memberKey(name);
    const first = positions.get(key);
    if (first !== undefined) {
      errors[first] = errors[index] =
        "No podés agregar dos veces al mismo integrante.";
    } else positions.set(key, index);
  });
  return errors;
}

/** Agrega equipos a los datos locales anteriores sin modificar espacios, préstamos ni inventario. */
export function migrateProjectTeams(state: DemoState): DemoState {
  return {
    ...state,
    projects: state.projects.map((project) => ({
      ...project,
      members: projectMembers(project),
    })),
  };
}
