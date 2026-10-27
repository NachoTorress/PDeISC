/** Presentación TV: carga paginada de proyectos confirmados y navegación entre fichas. */
import type { ApiCall } from "./authTypes";
/** Proyecto mostrado en la presentación. */
export interface PresentationProject {
  id: string;
  name: string;
  description: string;
  course: string;
  imageUrl: string;
  videoUrl: string;
  spaceName: string;
  furnitureId: string;
  members: { firstName: string; lastName: string }[];
  teachers: { firstName: string; lastName: string }[];
  subjects: string[];
}
export interface PresentationPage {
  projects: PresentationProject[];
  nextCursor: string | null;
}
type PublicQuery = ApiCall;

/** Recorre todas las páginas de `GET /api/projects/presentation`. */
export async function loadPresentation(
  query: PublicQuery,
  current = () => true,
) {
  const projects = new Map<string, PresentationProject>();
  const cursors = new Set<string>();
  let after: string | undefined;
  do {
    const page = await query<PresentationPage>(
      "/api/projects/presentation",
      { limit: 100, ...(after ? { after } : {}) },
        "GET",
    );
    if (!current()) return null;
    if (
      !Array.isArray(page.projects) ||
      (page.nextCursor !== null &&
        (typeof page.nextCursor !== "string" ||
          !page.nextCursor ||
          !page.projects.length ||
          cursors.has(page.nextCursor)))
    )
      throw new Error(
        "La presentación devolvió una página inválida. Volvé a actualizar.",
      );
    for (const project of page.projects) projects.set(project.id, project);
    after = page.nextCursor ?? undefined;
    if (after) cursors.add(after);
  } while (after);
  return [...projects.values()];
}

/** Proyecto siguiente o anterior (circular). */
export function presentationSelection(
  projects: PresentationProject[],
  currentId: string,
  direction = 0,
) {
  if (!projects.length) return "";
  const index = Math.max(
    0,
    projects.findIndex((project) => project.id === currentId),
  );
  return projects[
    (index + (direction % projects.length) + projects.length) % projects.length
  ].id;
}
/** Clave para reiniciar el video al cambiar de proyecto. */
export const presentationMediaKey = (project: PresentationProject) =>
  `${project.id}:${project.videoUrl}`;
