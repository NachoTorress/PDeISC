export type ProjectPeopleRole = "student" | "teacher";

export const projectPeopleLimit = { student: 12, teacher: 5 } as const;

export function projectPeopleEmail(value: string) {
  return value.trim().toLowerCase();
}

export function projectPeopleEmailError(value: string) {
  const email = projectPeopleEmail(value);
  if (
    email.length > 254 ||
    !/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(
      email,
    )
  )
    return "Escribí el correo completo con el que esta persona ingresa a ExpoTec.";
  return "";
}

export function projectPersonAdditionError({
  role,
  personId,
  selectedIds,
  excludedIds,
}: {
  role: ProjectPeopleRole;
  personId: string;
  selectedIds: string[];
  excludedIds: string[];
}) {
  if (selectedIds.includes(personId))
    return role === "student"
      ? "Este alumno ya forma parte del equipo."
      : "Este profesor ya está agregado.";
  if (excludedIds.includes(personId))
    return role === "student"
      ? "Esta persona ya está agregada como profesor responsable. No puede ocupar ambos roles."
      : "Esta persona ya forma parte del equipo de alumnos. No puede ocupar ambos roles.";
  if (selectedIds.length >= projectPeopleLimit[role])
    return role === "student"
      ? "El equipo puede tener hasta 12 alumnos, incluyéndote."
      : "Podés agregar hasta 5 profesores responsables.";
  return "";
}
