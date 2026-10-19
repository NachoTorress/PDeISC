import type { AccountUser } from "./authTypes";
import { requestsError } from "./sharedInventory";
import type { ProjectResource, ResourceRequestDraft } from "./sharedInventory";
export interface ProjectPerson {
  id?: string;
  firstName: string;
  lastName: string;
}
export interface ProjectParticipant extends ProjectPerson {
  id: string;
}
export type SharedProjectStatus =
  | "pending"
  | "changes"
  | "approved"
  | "cancelled";
export interface ProjectSummary {
  id: string;
  name: string;
  course: string;
  status: SharedProjectStatus;
  imageUrl: string;
  createdAt: string;
  spaceName: string;
  furnitureId: string;
}
export interface SharedProject
  extends Omit<ProjectSummary, "spaceName" | "furnitureId"> {
  description: string;
  videoUrl: string;
  isSoftwareProject: boolean;
  githubUrl: string;
  websiteUrl: string;
  members: ProjectPerson[];
  teachers: ProjectPerson[];
  subjects: string[];
  booth: {
    id: string;
    spaceId: string;
    spaceName: string;
    furnitureId: string;
  };
  creatorId?: string;
  version?: number;
  feedback?: string;
  resources?: ProjectResource[];
  reviews?: {
    id: string;
    action: string;
    note: string;
    createdAt: string;
    firstName: string;
    lastName: string;
  }[];
}
export interface ProposalDraft {
  name: string;
  description: string;
  course: string;
  imageUrl: string;
  videoUrl: string;
  isSoftwareProject: boolean;
  githubUrl: string;
  websiteUrl: string;
  members: ProjectParticipant[];
  teachers: ProjectParticipant[];
  subjects: string[];
  boothId: string;
  creatorId: string;
  version?: number;
  resources: ResourceRequestDraft[];
}
export const sharedStatusLabel: Record<SharedProjectStatus, string> = {
  pending: "Pendiente de revisión",
  changes: "Requiere cambios",
  approved: "Confirmado",
  cancelled: "Cancelado",
};
export function proposalDraft(
  user: AccountUser,
  source?: SharedProject,
): ProposalDraft {
  if (!source)
    return {
      name: "",
      description: "",
      course: "",
      imageUrl: "",
      videoUrl: "",
      isSoftwareProject: false,
      githubUrl: "",
      websiteUrl: "",
      members: [
        { id: user.id, firstName: user.firstName, lastName: user.lastName },
      ],
      teachers: [],
      subjects: [],
      boothId: "",
      creatorId: user.id,
      resources: [],
    };
  return {
    name: source.name,
    description: source.description,
    course: source.course,
    imageUrl: source.imageUrl,
    videoUrl: source.videoUrl,
    isSoftwareProject: source.isSoftwareProject,
    githubUrl: source.githubUrl,
    websiteUrl: source.websiteUrl,
    members: source.members
      .filter((person): person is ProjectParticipant => !!person.id)
      .map((person) => ({ ...person })),
    teachers: source.teachers
      .filter((person): person is ProjectParticipant => !!person.id)
      .map((person) => ({ ...person })),
    subjects: [...source.subjects],
    boothId: source.booth.id,
    creatorId: source.creatorId ?? user.id,
    version: source.version,
    resources: (source.resources ?? []).map((item) => ({
      resourceId: item.resourceId,
      name: item.name,
      quantity: String(item.quantity),
    })),
  };
}
export function proposalRequest(draft: ProposalDraft) {
  return {
    name: draft.name.trim(),
    description: draft.description.trim(),
    course: draft.course.trim(),
    imageUrl: draft.imageUrl.trim(),
    videoUrl: draft.videoUrl.trim(),
    isSoftwareProject: draft.isSoftwareProject,
    githubUrl: draft.githubUrl.trim(),
    websiteUrl: draft.websiteUrl.trim(),
    memberIds: draft.members.map((person) => person.id),
    teacherIds: draft.teachers.map((person) => person.id),
    subjects: draft.subjects.map((subject) => subject.trim()),
    boothId: draft.boothId,
    resources: draft.resources.map((item) => ({
      resourceId: item.resourceId,
      quantity: Number(item.quantity),
    })),
    ...(draft.version === undefined ? {} : { version: draft.version }),
  };
}
export function sharedLinkError(value: string, required = false, kind = "") {
  const link = value.trim();
  if (!link) return required ? "Ingresá un enlace HTTPS." : "";
  try {
    const url = new URL(link);
    if (
      link.length > 2048 ||
      !/^https:\/\//i.test(link) ||
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      /[\s\p{Cc}]/u.test(link)
    )
      throw new Error();
    if (
      kind === "github" &&
      (!["github.com", "www.github.com"].includes(url.hostname) ||
        !/^\/[^/]+\/[^/]+(?:\/|$)/.test(url.pathname))
    )
      return "Usá un repositorio de github.com con usuario y proyecto.";
    if (kind === "video" && !/\.(mp4|webm)$/i.test(url.pathname))
      return "Usá un enlace directo a un video MP4 o WebM.";
    return "";
  } catch {
    return "Usá una URL HTTPS completa, sin credenciales ni espacios.";
  }
}
export function proposalErrors(draft: ProposalDraft, actorId: string) {
  const fields: Record<string, string> = {};
  const resources = requestsError(draft.resources);
  if (resources) fields.resources = resources;
  for (const [key, min, max] of [
    ["name", 2, 120],
    ["description", 20, 5000],
    ["course", 2, 100],
  ] as const) {
    const value = draft[key].trim();
    if (
      value.length < min ||
      value.length > max ||
      (key !== "description" && /\p{Cc}/u.test(value))
    )
      fields[key] = `Usá entre ${min} y ${max} caracteres.`;
  }
  for (const [key, kind] of [
    ["imageUrl", "image"],
    ["videoUrl", "video"],
    ["githubUrl", "github"],
    ["websiteUrl", "website"],
  ] as const) {
    const error = sharedLinkError(draft[key], key === "imageUrl", kind);
    if (error) fields[key] = error;
  }
  if (
    !draft.isSoftwareProject &&
    (draft.githubUrl.trim() || draft.websiteUrl.trim())
  )
    fields.isSoftwareProject =
      "Activá proyecto informático para agregar esos enlaces.";
  if (
    !draft.members.length ||
    draft.members.length > 12 ||
    !draft.members.some((person) => person.id === actorId) ||
    !draft.members.some((person) => person.id === draft.creatorId) ||
    new Set(draft.members.map((person) => person.id)).size !==
      draft.members.length
  )
    fields.memberIds =
      "El equipo admite hasta 12 alumnos e incluye al creador y a quien edita.";
  if (
    !draft.teachers.length ||
    draft.teachers.length > 5 ||
    new Set(draft.teachers.map((person) => person.id)).size !==
      draft.teachers.length ||
    draft.teachers.some((teacher) =>
      draft.members.some((member) => member.id === teacher.id),
    )
  )
    fields.teacherIds =
      "Asigná entre 1 y 5 profesores distintos de los integrantes.";
  const keys = draft.subjects.map((subject) =>
    subject.trim().normalize("NFD").replace(/\p{M}/gu, "").toLowerCase(),
  );
  if (
    !draft.subjects.length ||
    draft.subjects.length > 10 ||
    draft.subjects.some(
      (subject) =>
        subject.trim().length < 2 ||
        subject.trim().length > 80 ||
        /\p{Cc}/u.test(subject),
    ) ||
    new Set(keys).size !== keys.length
  )
    fields.subjects =
      "Agregá entre 1 y 10 materias distintas, de 2 a 80 caracteres.";
  if (!draft.boothId) fields.boothId = "Elegí un puesto habilitado.";
  return fields;
}
