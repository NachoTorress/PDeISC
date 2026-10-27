/** Lectura segura del estado guardado de la demostración: valida cada campo antes de usarlo. */
import { LABEL_TEXT_LIMITS, TABLE_LIMITS } from "./layout";
import { projectLinkError } from "./projectLinks";
import { migrateProjectTeams, teamErrors } from "./team";
import type { DemoState } from "./types";
import { demoGalleryImageError, demoCaptionError } from "./demoGallery";

/** Error con la ruta del dato inválido. */
function invalid(path: string): never {
  throw new Error(`Los datos guardados no son válidos: ${path}.`);
}

function record(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    invalid(path);
  return value as Record<string, unknown>;
}

function text(value: unknown, path: string, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && !value.trim()))
    invalid(path);
  return value;
}

function number(
  value: unknown,
  path: string,
  minimum = 0,
  maximum = Infinity,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < minimum ||
    value > maximum
  )
    invalid(path);
  return value;
}

function integer(
  value: unknown,
  path: string,
  minimum = 0,
  maximum = Infinity,
): number {
  const result = number(value, path, minimum, maximum);
  if (!Number.isSafeInteger(result)) invalid(path);
  return result;
}

function date(value: unknown, path: string) {
  const iso = text(value, path);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) invalid(path);
  const timestamp = Date.parse(`${iso}T00:00:00Z`);
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== iso
  )
    invalid(path);
}

function list(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) invalid(path);
  return value;
}

function names(value: unknown, path: string): string[] {
  const values = list(value, path);
  if (!values.length) invalid(path);
  return values.map((item, index) => text(item, `${path}[${index}]`));
}

function records(value: unknown, path: string): Record<string, unknown>[] {
  const ids = new Set<string>();
  return list(value, path).map((item, index) => {
    const entry = record(item, `${path}[${index}]`);
    const id = text(entry.id, `${path}[${index}].id`);
    if (ids.has(id)) invalid(`${path}[${index}].id duplicado`);
    ids.add(id);
    return entry;
  });
}

/** Lee JSON local, verifica los datos consumidos por las pantallas y migra solamente equipos anteriores.
 * No modifica el almacenamiento ni recalcula aprobaciones, reservas o préstamos históricos.
 */
export function parseSavedState(raw: string): DemoState {
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    throw new Error("Los datos guardados no contienen un JSON válido.");
  }
  const state = record(decoded, "estado");
  records(state.spaces, "spaces").forEach((space, index) => {
    const path = `spaces[${index}]`;
    text(space.name, `${path}.name`);
    text(space.description, `${path}.description`, true);
    date(space.createdAt, `${path}.createdAt`);
    records(space.furniture, `${path}.furniture`).forEach((item, itemIndex) => {
      const itemPath = `${path}.furniture[${itemIndex}]`;
      if (
        !["table", "bench", "power", "label"].includes(
          text(item.type, `${itemPath}.type`),
        )
      )
        invalid(`${itemPath}.type`);
      number(item.x, `${itemPath}.x`, 0, 100);
      number(item.y, `${itemPath}.y`, 0, 100);
      number(item.rotation, `${itemPath}.rotation`, -Infinity);
      for (const dimension of ["width", "height"] as const) {
        if (item[dimension] !== undefined)
          number(
            item[dimension],
            `${itemPath}.${dimension}`,
            TABLE_LIMITS[dimension].min,
            TABLE_LIMITS[dimension].max,
          );
      }
      if (item.text !== undefined) text(item.text, `${itemPath}.text`, true);
      if (item.type === "label") {
        const label = text(item.text, `${itemPath}.text`).trim();
        if (
          label.length < LABEL_TEXT_LIMITS.min ||
          label.length > LABEL_TEXT_LIMITS.max
        )
          invalid(`${itemPath}.text`);
      }
    });
  });
  records(state.resources, "resources").forEach((resource, index) => {
    const path = `resources[${index}]`;
    text(resource.name, `${path}.name`);
    integer(resource.total, `${path}.total`);
    date(resource.createdAt, `${path}.createdAt`);
  });
  records(state.projects, "projects").forEach((project, index) => {
    const path = `projects[${index}]`;
    for (const key of [
      "name",
      "description",
      "student",
      "course",
      "spaceId",
      "furnitureId",
    ])
      text(project[key], `${path}.${key}`);
    for (const key of ["image", "video", "feedback"])
      text(project[key], `${path}.${key}`, true);
    names(project.subjects, `${path}.subjects`);
    names(project.teachers, `${path}.teachers`);
    const members =
      project.members === undefined
        ? [text(project.student, `${path}.student`)]
        : names(project.members, `${path}.members`);
    if (Object.keys(teamErrors(members)).length) invalid(`${path}.members`);
    if (
      !["robot", "plant", "energy", "weather"].includes(
        text(project.category, `${path}.category`),
      )
    )
      invalid(`${path}.category`);
    if (
      !["pending", "approved", "changes"].includes(
        text(project.status, `${path}.status`),
      )
    )
      invalid(`${path}.status`);
    const resources = record(project.resources, `${path}.resources`);
    for (const [id, quantity] of Object.entries(resources)) {
      text(id, `${path}.resources.id`);
      integer(quantity, `${path}.resources.${id}`);
    }
    if (
      project.isSoftwareProject !== undefined &&
      typeof project.isSoftwareProject !== "boolean"
    )
      invalid(`${path}.isSoftwareProject`);
    if (projectLinkError(project.githubUrl, "github"))
      invalid(`${path}.githubUrl`);
    if (projectLinkError(project.websiteUrl, "website"))
      invalid(`${path}.websiteUrl`);
    date(project.createdAt, `${path}.createdAt`);
  });
  records(state.loans, "loans").forEach((loan, index) => {
    const path = `loans[${index}]`;
    text(loan.projectId, `${path}.projectId`);
    text(loan.resourceId, `${path}.resourceId`);
    integer(loan.day, `${path}.day`, 1, 3);
    const quantity = integer(loan.quantity, `${path}.quantity`, 1);
    integer(loan.returned, `${path}.returned`, 0, quantity);
    text(loan.notes, `${path}.notes`, true);
    date(loan.createdAt, `${path}.createdAt`);
  });
  if (state.galleryPhotos !== undefined) {
    records(state.galleryPhotos, "galleryPhotos").forEach((photo, index) => {
      const path = `galleryPhotos[${index}]`;
      if (demoGalleryImageError(text(photo.imageUrl, `${path}.imageUrl`), true))
        invalid(`${path}.imageUrl`);
      if (demoCaptionError(text(photo.caption, `${path}.caption`)))
        invalid(`${path}.caption`);
      text(photo.authorName, `${path}.authorName`);
      if (
        !["student", "teacher", "loans", "admin", "guest"].includes(
          text(photo.authorRole, `${path}.authorRole`),
        )
      )
        invalid(`${path}.authorRole`);
      if (
        !["pending", "approved", "rejected"].includes(
          text(photo.status, `${path}.status`),
        )
      )
        invalid(`${path}.status`);
      if (photo.reviewNote !== undefined) {
        const note = text(photo.reviewNote, `${path}.reviewNote`, true);
        if (
          note.length > 1000 ||
          (photo.status === "rejected" && note.trim().length < 10)
        )
          invalid(`${path}.reviewNote`);
      } else if (photo.status === "rejected") invalid(`${path}.reviewNote`);
      date(photo.createdAt, `${path}.createdAt`);
    });
  }
  return migrateProjectTeams(state as unknown as DemoState);
}
