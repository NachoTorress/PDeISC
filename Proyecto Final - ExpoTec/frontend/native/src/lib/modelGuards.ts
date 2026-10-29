/**
 * Comprobaciones comunes del modelo de la demostración: permisos por perfil,
 * textos y fechas obligatorios, cantidades de elementos reservados o
 * prestados y puestos libres. Las usan `modelValidation.ts` y `model.ts`.
 */
import type { DemoState, Project, Role } from "./types";

export const STUDENT = "Lucía Fernández";
export const TEACHER = "Martín García";
export const nonempty = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;
export const positiveInteger = (value: number) =>
  Number.isSafeInteger(value) && value > 0;

/** Lanza un error si el perfil actual no puede hacer la acción. */
export function requireRole(role: Role, ...allowed: Role[]) {
  if (!allowed.includes(role))
    throw new Error("Tu perfil no tiene permiso para realizar esta acción.");
}

/** Valida largo mínimo y máximo de un texto. */
export function requireText(
  value: string,
  label: string,
  min: number,
  max: number,
) {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  ) {
    throw new Error(`${label} debe tener entre ${min} y ${max} caracteres.`);
  }
}

/** Valida una fecha AAAA-MM-DD. */
export function requireDate(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  ) {
    throw new Error("La fecha de creación no es válida.");
  }
}

/** Recibe el estado local y devuelve las cantidades reservadas por proyectos aprobados. */
export function resourceUsed(state: DemoState, id: string): number {
  return state.projects
    .filter((project) => project.status === "approved")
    .reduce((total, project) => total + (project.resources[id] ?? 0), 0);
}

/** Recibe un recurso y una jornada; devuelve las unidades todavía pendientes de devolución. */
export function resourceOut(state: DemoState, id: string, day: number): number {
  return state.loans
    .filter((loan) => loan.resourceId === id && loan.day === day)
    .reduce((total, loan) => total + loan.quantity - loan.returned, 0);
}

/** Unidades sin devolver de un elemento en todas las jornadas. */
export function physicallyOut(state: DemoState, id: string): number {
  // Un elemento no devuelto sigue ocupado aunque cambie la jornada.
  return state.loans
    .filter((loan) => loan.resourceId === id)
    .reduce((total, loan) => total + loan.quantity - loan.returned, 0);
}

/** Impide confirmar dos proyectos en el mismo puesto. */
export function requireFreePlace(state: DemoState, project: Project) {
  if (
    state.projects.some(
      (other) =>
        other.id !== project.id &&
        other.status === "approved" &&
        other.spaceId === project.spaceId &&
        other.furnitureId === project.furnitureId,
    )
  ) {
    throw new Error(
      "Esta mesa ya está ocupada por un proyecto aprobado. Elegí otra ubicación.",
    );
  }
}
