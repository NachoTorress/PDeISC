/** Perfiles disponibles para aplicar permisos en la demostración local. */
export type Role = 'student' | 'teacher' | 'loans' | 'admin' | 'guest';
/** Identificadores de las secciones que admite la navegación. */
export type Page = 'map' | 'projects' | 'loans' | 'inventory' | 'gallery' | 'tv';
/** Estados posibles del ciclo de revisión de una propuesta. */
export type ProjectStatus = 'pending' | 'approved' | 'changes';
/** Elemento del plano con posición, dimensiones y propiedades visuales. */
export interface Furniture {
  id: string;
  type: 'table' | 'bench' | 'power' | 'label';
  x: number;
  y: number;
  rotation: number;
  /** Tamaño de la mesa como porcentaje del plano; los datos anteriores usan el tamaño inicial. */
  width?: number;
  height?: number;
  /** Texto visible de una etiqueta de orientación. */
  text?: string;
}
/** Espacio de la exposición y mobiliario que contiene. */
export interface Space {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  furniture: Furniture[];
}
/** Recurso del inventario con sus cantidades y condición. */
export interface Resource {
  id: string;
  name: string;
  total: number;
  createdAt: string;
}
/** Propuesta local con equipo, ubicación, estado y recursos solicitados. */
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
  category: 'robot' | 'plant' | 'energy' | 'weather';
  status: ProjectStatus;
  feedback: string;
  createdAt: string;
}
/** Entrega de recursos y cantidades devueltas en la demostración. */
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
/** Estado completo de la demostración guardado en el dispositivo. */
export interface DemoState {
  spaces: Space[];
  projects: Project[];
  resources: Resource[];
  loans: Loan[];
}
/** Operaciones admitidas para modificar el estado local de demostración. */
export type Mutation =
  | { type: 'saveProject'; project: Project }
  | { type: 'review'; id: string; action: 'approve' | 'changes' | 'reopen'; feedback?: string }
  | { type: 'deleteProject'; id: string }
  | { type: 'saveSpace'; space: Space }
  | { type: 'deleteSpace'; id: string }
  | { type: 'saveResource'; resource: Resource }
  | { type: 'deleteResource'; id: string }
  | { type: 'lend'; projectId: string; resourceId: string; day: number; quantity: number }
  | { type: 'returnLoan'; id: string; quantity: number; notes: string };
