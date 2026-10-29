/**
 * Validación de los datos que se guardan en la demostración: propuestas de
 * proyecto, espacios con su plano y elementos del inventario. Cada función
 * lanza un Error con un mensaje claro si algo no es válido.
 */
import type { DemoState, Project, Resource, Space } from "./types";
import { LABEL_TEXT_LIMITS, TABLE_LIMITS } from "./layout";
import { isProjectMember, teamErrors } from "./team";
import { projectLinkError, safeProjectLink } from "./projectLinks";
import {
  STUDENT,
  nonempty,
  positiveInteger,
  requireText,
  requireDate,
  resourceUsed,
  physicallyOut,
  requireFreePlace,
} from "./modelGuards";

/** Valida los datos de una propuesta de la demo. */
export function validateProject(
  state: DemoState,
  project: Project,
  previous?: Project,
) {
  if (!nonempty(project.id))
    throw new Error("El proyecto necesita un identificador.");
  requireText(project.name, "El nombre del proyecto", 3, 80);
  requireText(project.description, "La descripción", 20, 800);
  requireText(project.course, "El curso", 3, 100);
  if (
    previous
      ? project.student !== previous.student
      : project.student !== STUDENT
  )
    throw new Error(
      previous
        ? "No podés cambiar el alumno que creó la propuesta."
        : "Las propuestas nuevas deben tener a Lucía Fernández como creadora.",
    );
  if (!Array.isArray(project.members) || !project.members.length)
    throw new Error("Agregá al menos un integrante al equipo.");
  const teamError = Object.values(teamErrors(project.members))[0];
  if (teamError) throw new Error(teamError);
  if (!isProjectMember(project, project.student))
    throw new Error(
      "El alumno que creó la propuesta debe permanecer en el equipo.",
    );
  if (!isProjectMember(project, STUDENT))
    throw new Error(
      "Lucía Fernández debe permanecer en el equipo para guardar sus cambios.",
    );
  project.members = project.members.map((name) =>
    name.normalize("NFC").trim().replace(/\s+/gu, " "),
  );
  for (const [label, values] of [
    ["profesor", project.teachers],
    ["materia", project.subjects],
  ] as const) {
    if (
      !Array.isArray(values) ||
      !values.length ||
      values.some((value) => !nonempty(value) || value.trim().length > 80)
    ) {
      throw new Error(
        `Agregá al menos un ${label}; cada nombre puede tener hasta 80 caracteres.`,
      );
    }
  }
  const space = state.spaces.find((item) => item.id === project.spaceId);
  if (
    !space ||
    !space.furniture.some(
      (item) => item.id === project.furnitureId && item.type === "table",
    )
  ) {
    throw new Error(
      "Elegí un espacio existente y una mesa válida dentro de ese espacio.",
    );
  }
  requireFreePlace(state, project);
  if (
    !project.resources ||
    typeof project.resources !== "object" ||
    Array.isArray(project.resources)
  ) {
    throw new Error("La lista de elementos solicitados no es válida.");
  }
  for (const [id, quantity] of Object.entries(project.resources)) {
    const resource = state.resources.find((item) => item.id === id);
    if (!resource)
      throw new Error("Uno de los elementos solicitados ya no existe.");
    if (
      !positiveInteger(quantity) ||
      quantity > 1000 ||
      quantity > resource.total
    ) {
      throw new Error(
        `La cantidad de ${resource.name} debe ser un entero positivo y no superar el stock (${resource.total}).`,
      );
    }
  }
  if (project.image === "") {
    if (!previous || previous.image !== "")
      throw new Error("Agregá una imagen referencial PNG, JPG o WebP.");
  } else if (
    typeof project.image !== "string" ||
    !/^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(
      project.image,
    )
  ) {
    throw new Error("La imagen debe ser un archivo PNG, JPG o WebP.");
  }
  if (project.video) {
    let valid = false;
    try {
      const url = new URL(project.video);
      valid =
        ["http:", "https:"].includes(url.protocol) &&
        /\.(mp4|webm)$/i.test(url.pathname);
    } catch {
      /* La validación muestra el mismo mensaje para cualquier URL incorrecta. */
    }
    if (!valid)
      throw new Error(
        "El video debe ser un enlace HTTP o HTTPS directo a un archivo MP4 o WebM.",
      );
  } else if (typeof project.video !== "string") {
    throw new Error("El enlace del video no es válido.");
  }
  if (!["robot", "plant", "energy", "weather"].includes(project.category)) {
    throw new Error("La categoría del proyecto no es válida.");
  }
  if (
    project.isSoftwareProject !== undefined &&
    typeof project.isSoftwareProject !== "boolean"
  )
    throw new Error(
      "La opción de proyecto informático debe ser verdadera o falsa.",
    );
  for (const [value, kind] of [
    [project.githubUrl, "github"],
    [project.websiteUrl, "website"],
  ] as const) {
    const error = projectLinkError(value, kind);
    if (error) throw new Error(error);
  }
  project.isSoftwareProject = project.isSoftwareProject ?? false;
  project.githubUrl = safeProjectLink(project.githubUrl, "github");
  project.websiteUrl = safeProjectLink(project.websiteUrl, "website");
  if (!project.isSoftwareProject && (project.githubUrl || project.websiteUrl))
    throw new Error(
      "Activá la opción de proyecto informático para guardar sus enlaces.",
    );
  requireDate(project.createdAt);
  if (previous) {
    const history = state.loans.filter(
      (loan) => loan.projectId === previous.id,
    );
    if (
      history.some((loan) => loan.quantity > loan.returned) &&
      (project.spaceId !== previous.spaceId ||
        project.furnitureId !== previous.furnitureId)
    ) {
      throw new Error(
        "Devolvé los elementos prestados antes de cambiar la ubicación del proyecto.",
      );
    }
    for (const loan of history) {
      const borrowed = history
        .filter(
          (item) =>
            item.resourceId === loan.resourceId && item.day === loan.day,
        )
        .reduce((total, item) => total + item.quantity, 0);
      if ((project.resources[loan.resourceId] ?? 0) < borrowed) {
        throw new Error(
          "No podés reducir un elemento por debajo de lo que ya se prestó al proyecto en una jornada.",
        );
      }
    }
  }
}

/** Valida un espacio y su mobiliario. */
export function validateSpace(state: DemoState, space: Space) {
  if (!nonempty(space.id) || !nonempty(space.name))
    throw new Error("El espacio necesita un nombre y un identificador.");
  requireDate(space.createdAt);
  if (!Array.isArray(space.furniture))
    throw new Error("El mobiliario del espacio no es válido.");
  const ids = new Set<string>();
  for (const item of space.furniture) {
    if (!nonempty(item.id) || ids.has(item.id))
      throw new Error(
        "Cada elemento del plano necesita un identificador único.",
      );
    ids.add(item.id);
    if (
      !["table", "bench", "power", "label"].includes(item.type) ||
      !Number.isFinite(item.x) ||
      item.x < 0 ||
      item.x > 100 ||
      !Number.isFinite(item.y) ||
      item.y < 0 ||
      item.y > 100 ||
      !Number.isFinite(item.rotation)
    ) {
      throw new Error(
        "Los elementos del plano deben tener un tipo válido y coordenadas entre 0 y 100.",
      );
    }
    for (const dimension of ["width", "height"] as const) {
      const value = item[dimension];
      const limits = TABLE_LIMITS[dimension];
      if (
        value !== undefined &&
        (!Number.isFinite(value) || value < limits.min || value > limits.max)
      ) {
        const label = dimension === "width" ? "El ancho" : "El alto";
        throw new Error(
          `${label} de la mesa debe estar entre ${limits.min} y ${limits.max}% del plano.`,
        );
      }
    }
    if (item.type === "label") {
      requireText(
        item.text ?? "",
        "El texto de la etiqueta",
        LABEL_TEXT_LIMITS.min,
        LABEL_TEXT_LIMITS.max,
      );
      item.text = item.text!.trim();
    }
  }
  if (
    state.projects.some(
      (project) =>
        project.spaceId === space.id &&
        !space.furniture.some(
          (item) => item.id === project.furnitureId && item.type === "table",
        ),
    )
  ) {
    throw new Error(
      "No podés quitar ni cambiar el tipo de una mesa que tiene un proyecto asignado.",
    );
  }
}

/** Valida un elemento del inventario. */
export function validateResource(state: DemoState, resource: Resource) {
  if (!nonempty(resource.id))
    throw new Error("El elemento necesita un identificador.");
  requireText(resource.name, "El nombre del elemento", 2, 80);
  if (
    state.resources.some(
      (item) =>
        item.id !== resource.id &&
        item.name.trim().toLocaleLowerCase("es") ===
          resource.name.trim().toLocaleLowerCase("es"),
    )
  ) {
    throw new Error("Ya existe un elemento con ese nombre.");
  }
  if (!Number.isSafeInteger(resource.total) || resource.total < 0)
    throw new Error("El stock debe ser un número entero igual o mayor a cero.");
  requireDate(resource.createdAt);
  if (resource.total < resourceUsed(state, resource.id))
    throw new Error(
      "El stock no puede ser menor que la cantidad reservada por proyectos aprobados.",
    );
  if (resource.total < physicallyOut(state, resource.id))
    throw new Error(
      "El stock no puede ser menor que la cantidad pendiente de devolución.",
    );
}
