/** Tipos de datos de la demostración local (perfiles, espacios, proyectos, inventario y préstamos). */
import type { DemoGalleryPhoto } from "./demoGallery";

/** Perfil de la demostración. */
export type Role = "student" | "teacher" | "loans" | "admin" | "guest";
export type Page =
  "map" | "projects" | "loans" | "inventory" | "gallery" | "photos" | "tv";
export type ProjectStatus = "pending" | "approved" | "changes";
/** Pieza del plano: mesa, banco, punto eléctrico o rótulo. */
export interface Furniture {
  id: string;
  type: "table" | "bench" | "power" | "label";
  x: number;
  y: number;
  rotation: number;
  /** Tamaño de la mesa como porcentaje del plano; los datos anteriores usan el tamaño inicial. */
  width?: number;
  height?: number;
  /** Texto visible de una etiqueta de orientación. */
  text?: string;
}
/** Espacio con su mobiliario. */
export interface Space {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  furniture: Furniture[];
}
/** Elemento del inventario. */
export interface Resource {
  id: string;
  name: string;
  total: number;
  createdAt: string;
}
/** Proyecto de la demo. */
export interface Project {
  id: string;
  name: string;
  description: string;
  /** Alumno que creó la propuesta; permanece dentro del equipo. */
  student: string;
  /** Equipo de alumnos responsables de la propuesta. */
  members: string[];
  course: string;
  subjects: string[];
  teachers: string[];
  spaceId: string;
  furnitureId: string;
  resources: Record<string, number>;
  image: string;
  video: string;
  /** Activa los enlaces opcionales del proyecto informático; ausente en datos anteriores. */
  isSoftwareProject?: boolean;
  githubUrl?: string;
  websiteUrl?: string;
  category: "robot" | "plant" | "energy" | "weather";
  status: ProjectStatus;
  feedback: string;
  createdAt: string;
}
/** Préstamo de la demo. */
export interface Loan {
  id: string;
  projectId: string;
  resourceId: string;
  day: number;
  quantity: number;
  returned: number;
  notes: string;
  createdAt: string;
}
/** Estado completo de la demostración. */
export interface DemoState {
  spaces: Space[];
  projects: Project[];
  resources: Resource[];
  loans: Loan[];
  galleryPhotos?: DemoGalleryPhoto[];
}
/** Acciones que modifican el estado de la demo. */
export type Mutation =
  | { type: "submitGalleryPhoto"; imageUrl: string; caption: string }
  | {
      type: "reviewGalleryPhoto";
      id: string;
      decision: "approved" | "rejected";
      note: string;
    }
  | { type: "saveProject"; project: Project }
  | {
      type: "review";
      id: string;
      action: "approve" | "changes" | "reopen";
      feedback?: string;
    }
  | { type: "deleteProject"; id: string }
  | { type: "saveSpace"; space: Space }
  | { type: "deleteSpace"; id: string }
  | { type: "saveResource"; resource: Resource }
  | { type: "deleteResource"; id: string }
  | {
      type: "lend";
      projectId: string;
      resourceId: string;
      day: number;
      quantity: number;
    }
  | { type: "returnLoan"; id: string; quantity: number; notes: string };
