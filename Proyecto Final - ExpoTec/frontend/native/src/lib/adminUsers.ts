/** Tipos y utilidades de la pantalla de usuarios y permisos (administración). */
import type { AccountRole, AccountUser } from "./authTypes";

/** Cuenta tal como la devuelve `POST /api/admin/users/query`. */
export interface ManagedUser extends AccountUser {
  active: boolean;
}

/** Roles asignables con su etiqueta y descripción para la interfaz. */
export const accountRoles: {
  value: AccountRole;
  label: string;
  description: string;
}[] = [
  {
    value: "guest",
    label: "Invitado",
    description:
      "Participa en la galería de la ExpoTec, sin permisos de alumno.",
  },
  {
    value: "student",
    label: "Alumno",
    description: "Presenta proyectos e integra equipos.",
  },
  {
    value: "teacher",
    label: "Profesor",
    description: "Revisa y confirma los proyectos que lo incluyan.",
  },
  {
    value: "loans",
    label: "Encargado de préstamos",
    description: "Registra entregas, devoluciones y novedades.",
  },
  {
    value: "admin",
    label: "Administrador",
    description: "Gestiona espacios, inventario y permisos de otras cuentas.",
  },
];

/** Compara dos listas de roles sin importar el orden. */
export function sameRoles(a: AccountRole[], b: AccountRole[]) {
  return (
    a.length === b.length && [...a].sort().join(",") === [...b].sort().join(",")
  );
}

/** Cuerpo de `PUT /api/admin/users/:id/roles`: roles nuevos y los que se esperaba encontrar. */
export function rolesChangeBody(source: ManagedUser, roles: AccountRole[]) {
  return { roles: [...roles], expectedRoles: [...source.roles] };
}
