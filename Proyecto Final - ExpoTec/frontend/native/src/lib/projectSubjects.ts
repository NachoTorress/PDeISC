/** Materias de un proyecto: sugerencias y validación. */
import { seed } from "./seed";

export const maximumProjectSubjects = 10;

/** Clave para comparar materias sin mayúsculas ni tildes. */
export function projectSubjectKey(value: string) {
  return value.trim().normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** Materias sugeridas de la Tecnicatura. */
export const projectSubjectSuggestions = [
  ...new Map(
    seed.projects.flatMap((project) =>
      project.subjects.map(
        (subject) => [projectSubjectKey(subject), subject] as const,
      ),
    ),
  ).values(),
].sort((left, right) => left.localeCompare(right, "es"));

/** Valida una materia nueva. */
export function projectSubjectInputError(value: string, selected: string[]) {
  const subject = value.trim();
  if (!subject) return "Escribí el nombre de una materia.";
  if (subject.length < 2 || subject.length > 80 || /\p{Cc}/u.test(subject))
    return "Usá entre 2 y 80 caracteres, en una sola línea.";
  if (
    selected.some(
      (item) => projectSubjectKey(item) === projectSubjectKey(subject),
    )
  )
    return "Esa materia ya está agregada.";
  if (selected.length >= maximumProjectSubjects)
    return "Podés agregar hasta 10 materias. Quitá una para elegir otra.";
  return "";
}

/** Sugerencias que coinciden con lo escrito y no están elegidas. */
export function suggestedProjectSubjects(selected: string[], query = "") {
  const keys = new Set(selected.map(projectSubjectKey));
  const term = projectSubjectKey(query);
  return projectSubjectSuggestions.filter(
    (subject) =>
      !keys.has(projectSubjectKey(subject)) &&
      projectSubjectKey(subject).includes(term),
  );
}
