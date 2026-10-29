/**
 * Rutas de la navegación: pantallas de la pila principal, pestañas de la
 * demostración y perfiles ficticios para probar cada rol.
 */
import type { IconName } from "../Icon";
import type { Role } from "../../lib/types";

/** Pantallas de la pila principal y sus parámetros. */
export type RootRoutes = {
  Home: undefined;
  Detail: { projectId: string };
  Form: { projectId?: string } | undefined;
  Presentation: undefined;
  Account: undefined;
  AdminUsers: undefined;
  SharedGallery: undefined;
  SharedSpaces: undefined;
  SharedProjects: undefined;
  SharedProject: { projectId: string; privateView?: boolean };
  SharedProposal: { projectId?: string } | undefined;
  SharedInventory: undefined;
  SharedLoans: undefined;
  SharedPresentation: undefined;
};
/** Pestañas de la demostración. */
export type TabRoutes = {
  map: undefined;
  projects: undefined;
  loans: undefined;
  inventory: undefined;
  gallery: undefined;
  photos: undefined;
  tv: undefined;
};
export type Destination = {
  id: keyof TabRoutes;
  label: string;
  icon: IconName;
  roles: Role[];
};
/** Pestañas de la demo y perfiles que pueden verlas. */
export const destinations: Destination[] = [
  {
    id: "map",
    label: "Espacios",
    icon: "map",
    roles: ["admin", "student", "teacher", "loans", "guest"],
  },
  {
    id: "projects",
    label: "Proyectos",
    icon: "projects",
    roles: ["admin", "student", "teacher"],
  },
  { id: "loans", label: "Préstamos", icon: "loans", roles: ["admin", "loans"] },
  {
    id: "inventory",
    label: "Inventario",
    icon: "inventory",
    roles: ["admin", "loans"],
  },
  {
    id: "gallery",
    label: "Muestra",
    icon: "gallery",
    roles: ["admin", "student", "teacher", "loans", "guest"],
  },
  {
    id: "photos",
    label: "Galería",
    icon: "image",
    roles: ["admin", "student", "teacher", "loans", "guest"],
  },
  { id: "tv", label: "TV", icon: "tv", roles: ["guest"] },
];
/** Perfiles ficticios de la demostración. */
export const profiles: { role: Role; label: string; identity: string }[] = [
  { role: "student", label: "Estudiante", identity: "Lucía Fernández" },
  { role: "teacher", label: "Profesor", identity: "Martín García" },
  { role: "loans", label: "Préstamos", identity: "Responsable de elementos" },
  {
    role: "admin",
    label: "Organización",
    identity: "Administrador de ejemplo",
  },
  { role: "guest", label: "Invitado", identity: "Muestra pública" },
];

/** Secciones a las que se puede ir desde el menú principal. */
export type SectionRoute =
  | "Account"
  | "SharedSpaces"
  | "SharedProjects"
  | "SharedGallery"
  | "SharedPresentation"
  | "SharedInventory"
  | "SharedLoans"
  | "AdminUsers"
  | "Home";
