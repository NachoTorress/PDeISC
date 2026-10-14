import type { DemoState, Mutation, Project, Resource, Role, Space } from './types';
import { LABEL_TEXT_LIMITS, TABLE_LIMITS } from './layout';
import { isProjectMember, teamErrors } from './team';
import { projectLinkError, safeProjectLink } from './projectLinks';

const STUDENT = 'Lucía Fernández';
const TEACHER = 'Martín García';
const nonempty = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const positiveInteger = (value: number) => Number.isSafeInteger(value) && value > 0;

function requireRole(role: Role, ...allowed: Role[]) {
  if (!allowed.includes(role))
    throw new Error('Tu perfil no tiene permiso para realizar esta acción.');
}

function requireText(value: string, label: string, min: number, max: number) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
    throw new Error(`${label} debe tener entre ${min} y ${max} caracteres.`);
  }
}

function requireDate(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) !== value
  ) {
    throw new Error('La fecha de creación no es válida.');
  }
}

/** Recibe el estado local y devuelve las cantidades reservadas por proyectos aprobados. */
export function resourceUsed(state: DemoState, id: string): number {
  return state.projects
    .filter((project) => project.status === 'approved')
    .reduce((total, project) => total + (project.resources[id] ?? 0), 0);
}

/** Recibe un recurso y una jornada; devuelve las unidades todavía pendientes de devolución. */
export function resourceOut(state: DemoState, id: string, day: number): number {
  return state.loans
    .filter((loan) => loan.resourceId === id && loan.day === day)
    .reduce((total, loan) => total + loan.quantity - loan.returned, 0);
}

function physicallyOut(state: DemoState, id: string): number {
  // Un elemento no devuelto sigue ocupado aunque cambie la jornada.
  return state.loans
    .filter((loan) => loan.resourceId === id)
    .reduce((total, loan) => total + loan.quantity - loan.returned, 0);
}

function requireFreePlace(state: DemoState, project: Project) {
  if (
    state.projects.some(
      (other) =>
        other.id !== project.id &&
        other.status === 'approved' &&
        other.spaceId === project.spaceId &&
        other.furnitureId === project.furnitureId,
    )
  ) {
    throw new Error('Esta mesa ya está ocupada por un proyecto aprobado. Elegí otra ubicación.');
  }
}

function validateProject(state: DemoState, project: Project, previous?: Project) {
  if (!nonempty(project.id)) throw new Error('El proyecto necesita un identificador.');
  requireText(project.name, 'El nombre del proyecto', 3, 80);
  requireText(project.description, 'La descripción', 20, 800);
  requireText(project.course, 'El curso', 3, 100);
  if (previous ? project.student !== previous.student : project.student !== STUDENT)
    throw new Error(
      previous
        ? 'No podés cambiar el alumno que creó la propuesta.'
        : 'Las propuestas nuevas deben tener a Lucía Fernández como creadora.',
    );
  if (!Array.isArray(project.members) || !project.members.length)
    throw new Error('Agregá al menos un integrante al equipo.');
  const teamError = Object.values(teamErrors(project.members))[0];
  if (teamError) throw new Error(teamError);
  if (!isProjectMember(project, project.student))
    throw new Error('El alumno que creó la propuesta debe permanecer en el equipo.');
  if (!isProjectMember(project, STUDENT))
    throw new Error('Lucía Fernández debe permanecer en el equipo para guardar sus cambios.');
  project.members = project.members.map((name) =>
    name.normalize('NFC').trim().replace(/\s+/gu, ' '),
  );
  for (const [label, values] of [
    ['profesor', project.teachers],
    ['materia', project.subjects],
  ] as const) {
    if (
      !Array.isArray(values) ||
      !values.length ||
      values.some((value) => !nonempty(value) || value.trim().length > 80)
    ) {
      throw new Error(`Agregá al menos un ${label}; cada nombre puede tener hasta 80 caracteres.`);
    }
  }
  const space = state.spaces.find((item) => item.id === project.spaceId);
  if (
    !space ||
    !space.furniture.some((item) => item.id === project.furnitureId && item.type === 'table')
  ) {
    throw new Error('Elegí un espacio existente y una mesa válida dentro de ese espacio.');
  }
  requireFreePlace(state, project);
  if (
    !project.resources ||
    typeof project.resources !== 'object' ||
    Array.isArray(project.resources)
  ) {
    throw new Error('La lista de elementos solicitados no es válida.');
  }
  for (const [id, quantity] of Object.entries(project.resources)) {
    const resource = state.resources.find((item) => item.id === id);
    if (!resource) throw new Error('Uno de los elementos solicitados ya no existe.');
    if (!positiveInteger(quantity) || quantity > 1000 || quantity > resource.total) {
      throw new Error(
        `La cantidad de ${resource.name} debe ser un entero positivo y no superar el stock (${resource.total}).`,
      );
    }
  }
  if (project.image === '') {
    if (!previous || previous.image !== '')
      throw new Error('Agregá una imagen referencial PNG, JPG o WebP.');
  } else if (
    typeof project.image !== 'string' ||
    !/^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(project.image)
  ) {
    throw new Error('La imagen debe ser un archivo PNG, JPG o WebP.');
  }
  if (project.video) {
    let valid = false;
    try {
      const url = new URL(project.video);
      valid = ['http:', 'https:'].includes(url.protocol) && /\.(mp4|webm)$/i.test(url.pathname);
    } catch {
      /* La validación muestra el mismo mensaje para cualquier URL incorrecta. */
    }
    if (!valid)
      throw new Error('El video debe ser un enlace HTTP o HTTPS directo a un archivo MP4 o WebM.');
  } else if (typeof project.video !== 'string') {
    throw new Error('El enlace del video no es válido.');
  }
  if (!['robot', 'plant', 'energy', 'weather'].includes(project.category)) {
    throw new Error('La categoría del proyecto no es válida.');
  }
  if (project.isSoftwareProject !== undefined && typeof project.isSoftwareProject !== 'boolean')
    throw new Error('La opción de proyecto informático debe ser verdadera o falsa.');
  for (const [value, kind] of [
    [project.githubUrl, 'github'],
    [project.websiteUrl, 'website'],
  ] as const) {
    const error = projectLinkError(value, kind);
    if (error) throw new Error(error);
  }
  project.isSoftwareProject = project.isSoftwareProject ?? false;
  project.githubUrl = safeProjectLink(project.githubUrl, 'github');
  project.websiteUrl = safeProjectLink(project.websiteUrl, 'website');
  if (!project.isSoftwareProject && (project.githubUrl || project.websiteUrl))
    throw new Error('Activá la opción de proyecto informático para guardar sus enlaces.');
  requireDate(project.createdAt);
  if (previous) {
    const history = state.loans.filter((loan) => loan.projectId === previous.id);
    if (
      history.some((loan) => loan.quantity > loan.returned) &&
      (project.spaceId !== previous.spaceId || project.furnitureId !== previous.furnitureId)
    ) {
      throw new Error(
        'Devolvé los elementos prestados antes de cambiar la ubicación del proyecto.',
      );
    }
    for (const loan of history) {
      const borrowed = history
        .filter((item) => item.resourceId === loan.resourceId && item.day === loan.day)
        .reduce((total, item) => total + item.quantity, 0);
      if ((project.resources[loan.resourceId] ?? 0) < borrowed) {
        throw new Error(
          'No podés reducir un elemento por debajo de lo que ya se prestó al proyecto en una jornada.',
        );
      }
    }
  }
}

function validateSpace(state: DemoState, space: Space) {
  if (!nonempty(space.id) || !nonempty(space.name))
    throw new Error('El espacio necesita un nombre y un identificador.');
  requireDate(space.createdAt);
  if (!Array.isArray(space.furniture)) throw new Error('El mobiliario del espacio no es válido.');
  const ids = new Set<string>();
  for (const item of space.furniture) {
    if (!nonempty(item.id) || ids.has(item.id))
      throw new Error('Cada elemento del plano necesita un identificador único.');
    ids.add(item.id);
    if (
      !['table', 'bench', 'power', 'label'].includes(item.type) ||
      !Number.isFinite(item.x) ||
      item.x < 0 ||
      item.x > 100 ||
      !Number.isFinite(item.y) ||
      item.y < 0 ||
      item.y > 100 ||
      !Number.isFinite(item.rotation)
    ) {
      throw new Error(
        'Los elementos del plano deben tener un tipo válido y coordenadas entre 0 y 100.',
      );
    }
    for (const dimension of ['width', 'height'] as const) {
      const value = item[dimension];
      const limits = TABLE_LIMITS[dimension];
      if (
        value !== undefined &&
        (!Number.isFinite(value) || value < limits.min || value > limits.max)
      ) {
        const label = dimension === 'width' ? 'El ancho' : 'El alto';
        throw new Error(
          `${label} de la mesa debe estar entre ${limits.min} y ${limits.max}% del plano.`,
        );
      }
    }
    if (item.type === 'label') {
      requireText(
        item.text ?? '',
        'El texto de la etiqueta',
        LABEL_TEXT_LIMITS.min,
        LABEL_TEXT_LIMITS.max,
      );
      item.text = item.text!.trim();
    }
  }
  if (
    state.projects.some(
      (project) =>
        project.spaceId === space.id &&
        !space.furniture.some((item) => item.id === project.furnitureId && item.type === 'table'),
    )
  ) {
    throw new Error(
      'No podés quitar ni cambiar el tipo de una mesa que tiene un proyecto asignado.',
    );
  }
}

function validateResource(state: DemoState, resource: Resource) {
  if (!nonempty(resource.id)) throw new Error('El elemento necesita un identificador.');
  requireText(resource.name, 'El nombre del elemento', 2, 80);
  if (
    state.resources.some(
      (item) =>
        item.id !== resource.id &&
        item.name.trim().toLocaleLowerCase('es') === resource.name.trim().toLocaleLowerCase('es'),
    )
  ) {
    throw new Error('Ya existe un elemento con ese nombre.');
  }
  if (!Number.isSafeInteger(resource.total) || resource.total < 0)
    throw new Error('El stock debe ser un número entero igual o mayor a cero.');
  requireDate(resource.createdAt);
  if (resource.total < resourceUsed(state, resource.id))
    throw new Error(
      'El stock no puede ser menor que la cantidad reservada por proyectos aprobados.',
    );
  if (resource.total < physicallyOut(state, resource.id))
    throw new Error('El stock no puede ser menor que la cantidad pendiente de devolución.');
}

/** Aplica una acción del prototipo, valida su permiso y devuelve un estado nuevo sin modificar el recibido. */
export function applyMutation(state: DemoState, action: Mutation, role: Role): DemoState {
  const next = structuredClone(state);
  switch (action.type) {
    case 'saveProject': {
      requireRole(role, 'student');
      const previous = next.projects.find((project) => project.id === action.project.id);
      if (previous && (!isProjectMember(previous, STUDENT) || previous.status === 'approved')) {
        throw new Error('Solo podés editar tus proyectos pendientes o con cambios solicitados.');
      }
      const project = structuredClone(action.project);
      if (previous) project.createdAt = previous.createdAt;
      validateProject(next, project, previous);
      project.status = 'pending';
      project.feedback = '';
      const index = next.projects.findIndex((item) => item.id === project.id);
      if (index < 0) next.projects.push(project);
      else next.projects[index] = project;
      break;
    }
    case 'review': {
      const project = next.projects.find((item) => item.id === action.id);
      if (!project) throw new Error('El proyecto ya no existe.');
      if (action.action === 'reopen') {
        requireRole(role, 'admin');
        if (project.status !== 'approved')
          throw new Error('Solo se puede reabrir un proyecto aprobado.');
        if (
          next.loans.some((loan) => loan.projectId === project.id && loan.quantity > loan.returned)
        ) {
          throw new Error(
            'Primero deben devolverse todos los elementos prestados antes de reabrir el proyecto.',
          );
        }
        project.status = 'changes';
        project.feedback =
          action.feedback?.trim() ||
          'El administrador reabrió el proyecto. Revisá los datos y reenviá la solicitud.';
        break;
      }
      requireRole(role, 'teacher');
      if (!project.teachers.includes(TEACHER))
        throw new Error(
          'Solo podés revisar los proyectos que te tienen como profesor responsable.',
        );
      if (project.status !== 'pending')
        throw new Error('Solo se pueden revisar proyectos pendientes.');
      if (action.action === 'changes') {
        requireText(action.feedback ?? '', 'El motivo de los cambios', 10, 800);
        project.status = 'changes';
        project.feedback = action.feedback!.trim();
      } else {
        requireFreePlace(next, project);
        const space = next.spaces.find((item) => item.id === project.spaceId);
        if (
          !space?.furniture.some((item) => item.id === project.furnitureId && item.type === 'table')
        ) {
          throw new Error('La mesa elegida ya no está disponible.');
        }
        for (const [id, quantity] of Object.entries(project.resources)) {
          const resource = next.resources.find((item) => item.id === id);
          if (
            !resource ||
            !positiveInteger(quantity) ||
            quantity > 1000 ||
            resourceUsed(next, id) + quantity > resource.total
          ) {
            throw new Error(
              `No hay stock suficiente de ${resource?.name ?? 'uno de los elementos'} para aprobar este proyecto.`,
            );
          }
        }
        project.status = 'approved';
        project.feedback = '';
      }
      break;
    }
    case 'deleteProject': {
      requireRole(role, 'student', 'admin');
      const project = next.projects.find((item) => item.id === action.id);
      if (!project) throw new Error('El proyecto ya no existe.');
      if (
        role === 'student' &&
        (!isProjectMember(project, STUDENT) || project.status === 'approved')
      ) {
        throw new Error('Solo podés eliminar tus proyectos que todavía no están aprobados.');
      }
      if (next.loans.some((loan) => loan.projectId === project.id))
        throw new Error('No se puede eliminar un proyecto con historial de préstamos.');
      next.projects = next.projects.filter((item) => item.id !== project.id);
      break;
    }
    case 'saveSpace': {
      requireRole(role, 'admin');
      const space = structuredClone(action.space);
      const index = next.spaces.findIndex((item) => item.id === space.id);
      if (index >= 0) space.createdAt = next.spaces[index].createdAt;
      validateSpace(next, space);
      if (index < 0) next.spaces.push(space);
      else next.spaces[index] = space;
      break;
    }
    case 'deleteSpace':
      requireRole(role, 'admin');
      if (!next.spaces.some((space) => space.id === action.id))
        throw new Error('El espacio ya no existe.');
      if (next.projects.some((project) => project.spaceId === action.id))
        throw new Error('No se puede eliminar un espacio con proyectos asignados.');
      next.spaces = next.spaces.filter((space) => space.id !== action.id);
      break;
    case 'saveResource': {
      requireRole(role, 'admin');
      const resource = structuredClone(action.resource);
      const index = next.resources.findIndex((item) => item.id === resource.id);
      if (index >= 0) resource.createdAt = next.resources[index].createdAt;
      validateResource(next, resource);
      if (index < 0) next.resources.push(resource);
      else next.resources[index] = resource;
      break;
    }
    case 'deleteResource':
      requireRole(role, 'admin');
      if (!next.resources.some((resource) => resource.id === action.id))
        throw new Error('El elemento ya no existe.');
      if (
        next.projects.some((project) => Object.hasOwn(project.resources, action.id)) ||
        next.loans.some((loan) => loan.resourceId === action.id)
      ) {
        throw new Error(
          'No se puede eliminar un elemento solicitado por proyectos o con historial de préstamos.',
        );
      }
      next.resources = next.resources.filter((resource) => resource.id !== action.id);
      break;
    case 'lend': {
      requireRole(role, 'loans', 'admin');
      if (!Number.isInteger(action.day) || action.day < 1 || action.day > 3)
        throw new Error('Elegí una jornada entre 1 y 3.');
      if (!positiveInteger(action.quantity))
        throw new Error('La cantidad a entregar debe ser un número entero positivo.');
      const project = next.projects.find((item) => item.id === action.projectId);
      const resource = next.resources.find((item) => item.id === action.resourceId);
      if (!project || project.status !== 'approved')
        throw new Error('Solo se pueden prestar elementos a un proyecto aprobado.');
      if (!resource || !(project.resources[action.resourceId] > 0))
        throw new Error('Este elemento no está asignado al proyecto.');
      if (
        next.loans.some(
          (loan) =>
            loan.projectId === project.id &&
            loan.resourceId === resource.id &&
            loan.day !== action.day &&
            loan.quantity > loan.returned,
        )
      ) {
        throw new Error(
          'Primero deben devolverse los elementos de la otra jornada antes de registrar un nuevo retiro.',
        );
      }
      const alreadyLent = next.loans
        .filter(
          (loan) =>
            loan.projectId === project.id &&
            loan.resourceId === resource.id &&
            loan.day === action.day,
        )
        .reduce((total, loan) => total + loan.quantity, 0);
      if (alreadyLent + action.quantity > project.resources[resource.id]) {
        throw new Error(
          'Esta entrega supera lo asignado al proyecto para la jornada. Las devoluciones no habilitan otro retiro.',
        );
      }
      if (physicallyOut(next, resource.id) + action.quantity > resource.total) {
        throw new Error(
          'No hay unidades disponibles. Primero deben devolverse los elementos pendientes.',
        );
      }
      next.loans.push({
        id: crypto.randomUUID(),
        projectId: project.id,
        resourceId: resource.id,
        day: action.day,
        quantity: action.quantity,
        returned: 0,
        notes: '',
        createdAt: new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'America/Argentina/Buenos_Aires',
        }).format(new Date()),
      });
      break;
    }
    case 'returnLoan': {
      requireRole(role, 'loans', 'admin');
      const loan = next.loans.find((item) => item.id === action.id);
      if (!loan) throw new Error('El préstamo ya no existe.');
      if (!positiveInteger(action.quantity) || action.quantity > loan.quantity - loan.returned) {
        throw new Error(
          'La devolución debe ser un entero positivo y no superar la cantidad pendiente.',
        );
      }
      if (typeof action.notes !== 'string' || action.notes.length > 500)
        throw new Error('La observación puede tener hasta 500 caracteres.');
      loan.returned += action.quantity;
      loan.notes = action.notes.trim();
      break;
    }
  }
  return next;
}
