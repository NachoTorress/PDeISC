import type { AccountRole, AccountUser } from "./authTypes";

export interface ManagedUser extends AccountUser {
  active: boolean;
}

export const accountRoles: { value: AccountRole; label: string; description: string }[] = [
  { value: "student", label: "Alumno", description: "Presenta proyectos e integra equipos." },
  { value: "teacher", label: "Profesor", description: "Revisa y confirma los proyectos que lo incluyan." },
  { value: "loans", label: "Encargado de préstamos", description: "Registra entregas, devoluciones y novedades." },
  { value: "admin", label: "Administrador", description: "Gestiona espacios, inventario y permisos de otras cuentas." },
];

export function sameRoles(a: AccountRole[], b: AccountRole[]) {
  return a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",");
}

export function rolesChangeBody(source: ManagedUser, roles: AccountRole[]) {
  return { roles: [...roles], expectedRoles: [...source.roles] };
}
