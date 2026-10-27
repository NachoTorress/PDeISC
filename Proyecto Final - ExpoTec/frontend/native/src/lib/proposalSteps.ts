/** Formulario de propuesta en cuatro pasos: qué campos pertenecen a cada paso y sus errores. */
/** Pasos: proyecto, equipo, puesto y revisión. */
export const proposalSteps = [
  { title: "Proyecto", subtitle: "Qué van a presentar" },
  { title: "Equipo", subtitle: "Alumnos, profesores y materias" },
  { title: "Puesto", subtitle: "Lugar y elementos necesarios" },
  { title: "Revisar", subtitle: "Comprobar y enviar la propuesta" },
] as const;

/** Nombre visible de cada campo para los mensajes. */
export const proposalFieldLabels: Record<string, string> = {
  name: "Nombre del proyecto",
  description: "Descripción",
  course: "Curso y especialidad",
  imageUrl: "Foto",
  videoUrl: "Video",
  isSoftwareProject: "Proyecto informático",
  githubUrl: "GitHub",
  websiteUrl: "Página del proyecto",
  memberIds: "Alumnos del equipo",
  teacherIds: "Profesores responsables",
  subjects: "Materias",
  boothId: "Puesto solicitado",
  resources: "Elementos solicitados",
};

export type ProposalPending = {
  students: boolean;
  teachers: boolean;
  subjects: boolean;
};
const groups = [
  [
    "name",
    "description",
    "course",
    "imageUrl",
    "videoUrl",
    "isSoftwareProject",
    "githubUrl",
    "websiteUrl",
  ],
  ["memberIds", "teacherIds", "subjects"],
  ["boothId", "resources"],
];
/** Paso en el que se corrige un campo. */
export function proposalStepForField(field: string) {
  const index = groups.findIndex((group) => group.includes(field));
  return index < 0 ? 0 : index;
}
/** Errores del borrador agrupados por paso. */
export function proposalFlowErrors(
  errors: Record<string, string>,
  pending: ProposalPending,
): Record<string, string> {
  return {
    ...errors,
    ...(pending.students
      ? {
          memberIds:
            "Hay un alumno sin agregar. Agregá la cuenta encontrada o limpiá su búsqueda.",
        }
      : {}),
    ...(pending.teachers
      ? {
          teacherIds:
            "Hay un profesor sin agregar. Agregá la cuenta encontrada o limpiá su búsqueda.",
        }
      : {}),
    ...(pending.subjects
      ? {
          subjects:
            "La materia escrita todavía no está agregada. Agregala o limpiá el texto para continuar.",
        }
      : {}),
  };
}
/** Errores de un paso puntual. */
export function proposalIssuesForStep(
  errors: Record<string, string>,
  step: number,
) {
  return Object.entries(errors).filter(
    ([field, message]) => message && proposalStepForField(field) === step,
  );
}
/** Primer paso con errores, para llevar a la persona ahí. */
export function firstProposalIssueStep(
  errors: Record<string, string>,
  before = 3,
) {
  for (let step = 0; step < before; step++) {
    if (proposalIssuesForStep(errors, step).length) return step;
  }
  return null;
}
