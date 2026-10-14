import { projectLinkError } from "../lib/projectLinks";
import { projectMembers, teamErrors } from "../lib/team";
import type { DemoState, Project } from "../lib/types";

export const STUDENT = "Lucía Fernández";
export type ProjectDraft = Omit<
  Project,
  | "id"
  | "student"
  | "status"
  | "feedback"
  | "createdAt"
  | "subjects"
  | "resources"
  | "isSoftwareProject"
  | "githubUrl"
  | "websiteUrl"
> & {
  subjects: string;
  resources: Record<string, string>;
  isSoftwareProject: boolean;
  githubUrl: string;
  websiteUrl: string;
};

/** Devuelve mesas existentes que no están reservadas por otro proyecto confirmado. */
export function freeProjectTables(
  state: DemoState,
  spaceId: string,
  projectId?: string,
) {
  return (
    state.spaces.find((space) => space.id === spaceId)?.furniture ?? []
  ).filter(
    (item) =>
      item.type === "table" &&
      !state.projects.some(
        (project) =>
          project.id !== projectId &&
          project.status === "approved" &&
          project.spaceId === spaceId &&
          project.furnitureId === item.id,
      ),
  );
}

/** Crea una copia editable; cancelar el formulario nunca modifica el proyecto original. */
export function makeProjectDraft(
  state: DemoState,
  project?: Project,
): ProjectDraft {
  return {
    name: project?.name ?? "",
    description: project?.description ?? "",
    course: project?.course ?? "",
    members: project ? [...projectMembers(project)] : [STUDENT],
    subjects: project?.subjects.join(", ") ?? "",
    teachers: [...(project?.teachers ?? [])],
    spaceId:
      project?.spaceId ??
      state.spaces.find((space) => freeProjectTables(state, space.id).length)
        ?.id ??
      "",
    furnitureId: project?.furnitureId ?? "",
    image: project?.image ?? "",
    video: project?.video ?? "",
    category: project?.category ?? "robot",
    isSoftwareProject: project?.isSoftwareProject ?? false,
    githubUrl: project?.githubUrl ?? "",
    websiteUrl: project?.websiteUrl ?? "",
    resources: Object.fromEntries(
      state.resources.map((resource) => [
        resource.id,
        String(project?.resources[resource.id] ?? 0),
      ]),
    ),
  };
}

export function projectVideoError(value: string) {
  if (!value.trim()) return "";
  try {
    const url = new URL(value.trim());
    if (
      ["http:", "https:"].includes(url.protocol) &&
      /\.(mp4|webm)$/i.test(url.pathname)
    )
      return "";
  } catch {
    /* El mensaje incluye cómo corregir el enlace. */
  }
  return "Usá un enlace completo http o https a un archivo .mp4 o .webm.";
}

/** Valida el borrador en cada cambio; el modelo vuelve a validar al guardar. */
export function projectDraftErrors(
  draft: ProjectDraft,
  state: DemoState,
  editing?: Project,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const [index, error] of Object.entries(teamErrors(draft.members)))
    errors[`member-${index}`] = error;
  if (draft.name.trim().length < 3 || draft.name.trim().length > 80)
    errors.name = "Escribí un nombre de entre 3 y 80 caracteres.";
  if (draft.course.trim().length < 3 || draft.course.trim().length > 100)
    errors.course =
      "Indicá el curso y la especialidad, entre 3 y 100 caracteres.";
  if (
    draft.description.trim().length < 20 ||
    draft.description.trim().length > 800
  )
    errors.description =
      "Contá qué hace el proyecto en entre 20 y 800 caracteres.";
  const subjects = draft.subjects
    .split(",")
    .map((subject) => subject.trim())
    .filter(Boolean);
  if (
    !subjects.length ||
    subjects.length > 10 ||
    subjects.some((subject) => subject.length > 80)
  )
    errors.subjects =
      "Indicá de 1 a 10 materias, separadas por comas; hasta 80 caracteres cada una.";
  if (!draft.teachers.length)
    errors.teachers = "Elegí al menos un profesor responsable.";
  if (!state.spaces.some((space) => space.id === draft.spaceId))
    errors.spaceId = "Elegí un espacio disponible.";
  if (
    !freeProjectTables(state, draft.spaceId, editing?.id).some(
      (item) => item.id === draft.furnitureId,
    )
  )
    errors.furnitureId = "Elegí una mesa disponible en ese espacio.";
  if (!editing && !draft.image)
    errors.image = "Elegí una imagen de referencia PNG, JPG o WebP.";
  const videoError = projectVideoError(draft.video);
  if (videoError) errors.video = videoError;
  if (draft.isSoftwareProject) {
    const githubError = projectLinkError(draft.githubUrl, "github");
    const websiteError = projectLinkError(draft.websiteUrl, "website");
    if (githubError) errors.githubUrl = githubError;
    if (websiteError) errors.websiteUrl = websiteError;
  }
  for (const resource of state.resources) {
    const value = draft.resources[resource.id] ?? "0";
    const limit = Math.min(resource.total, 1000);
    if (!/^\d+$/.test(value) || Number(value) > limit)
      errors[`resource-${resource.id}`] =
        `Ingresá un entero entre 0 y ${limit}.`;
    if (editing) {
      const borrowedByDay = [1, 2, 3].map((day) =>
        state.loans
          .filter(
            (loan) =>
              loan.projectId === editing.id &&
              loan.resourceId === resource.id &&
              loan.day === day,
          )
          .reduce((quantity, loan) => quantity + loan.quantity, 0),
      );
      const minimum = Math.max(...borrowedByDay);
      if (/^\d+$/.test(value) && Number(value) < minimum)
        errors[`resource-${resource.id}`] =
          `Este proyecto ya recibió ${minimum} unidades en una jornada. No podés reducir la cantidad por debajo de ese historial.`;
    }
  }
  return errors;
}
