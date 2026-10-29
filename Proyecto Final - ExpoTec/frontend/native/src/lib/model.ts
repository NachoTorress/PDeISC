/**
 * Modelo de la demostración local: reglas de negocio de proyectos, espacios,
 * inventario, préstamos y galería sin servidor. Cada acción valida el perfil
 * elegido y devuelve un estado nuevo (inmutable).
 *
 * Las comprobaciones comunes están en `modelGuards.ts` y la validación de
 * datos en `modelValidation.ts`.
 */
import type { DemoState, Mutation, Role } from "./types";
import { isProjectMember } from "./team";
import { cloneData } from "./clone";
import {
  demoGalleryPhotos,
  demoGalleryAuthors,
  demoGalleryImageError,
  demoCaptionError,
} from "./demoGallery";
import {
  STUDENT,
  TEACHER,
  positiveInteger,
  requireRole,
  requireText,
  resourceUsed,
  physicallyOut,
  requireFreePlace,
} from "./modelGuards";
import {
  validateProject,
  validateSpace,
  validateResource,
} from "./modelValidation";

export { resourceOut, resourceUsed } from "./modelGuards";

/** Aplica una acción del prototipo, valida su permiso y devuelve un estado nuevo sin modificar el recibido. */
export function applyMutation(
  state: DemoState,
  action: Mutation,
  role: Role,
  createId: () => string = () => crypto.randomUUID(),
): DemoState {
  const next = cloneData(state);
  switch (action.type) {
    case "submitGalleryPhoto": {
      requireRole(role, "student", "teacher", "loans", "admin", "guest");
      const error =
        demoGalleryImageError(action.imageUrl, true) ||
        demoCaptionError(action.caption);
      if (error) throw new Error(error);
      if (
        JSON.stringify(next).length + action.imageUrl.length >
        4 * 1024 * 1024
      )
        throw new Error(
          "La demostración no tiene espacio para esta foto. Probá con una imagen más liviana.",
        );
      next.galleryPhotos = [
        {
          id: createId(),
          imageUrl: action.imageUrl,
          caption: action.caption.trim().normalize("NFC"),
          authorName: demoGalleryAuthors[role],
          authorRole: role,
          status: "pending",
          createdAt: new Intl.DateTimeFormat("sv-SE", {
            timeZone: "America/Argentina/Buenos_Aires",
          }).format(new Date()),
        },
        ...cloneData(demoGalleryPhotos(next)),
      ];
      break;
    }
    case "reviewGalleryPhoto": {
      requireRole(role, "admin");
      next.galleryPhotos = cloneData(demoGalleryPhotos(next));
      const photo = next.galleryPhotos.find((item) => item.id === action.id);
      if (!photo) throw new Error("La foto ya no existe.");
      if (!["approved", "rejected"].includes(action.decision))
        throw new Error("Elegí una decisión válida.");
      if (action.decision === photo.status)
        throw new Error("La foto ya tiene ese estado.");
      requireText(
        action.note,
        "El mensaje para el autor",
        action.decision === "rejected" ? 10 : 0,
        1000,
      );
      photo.status = action.decision;
      photo.reviewNote = action.note.trim();
      break;
    }
    case "saveProject": {
      requireRole(role, "student");
      const previous = next.projects.find(
        (project) => project.id === action.project.id,
      );
      if (
        previous &&
        (!isProjectMember(previous, STUDENT) || previous.status === "approved")
      ) {
        throw new Error(
          "Solo podés editar tus proyectos pendientes o con cambios solicitados.",
        );
      }
      const project = cloneData(action.project);
      if (previous) project.createdAt = previous.createdAt;
      validateProject(next, project, previous);
      project.status = "pending";
      project.feedback = "";
      const index = next.projects.findIndex((item) => item.id === project.id);
      if (index < 0) next.projects.push(project);
      else next.projects[index] = project;
      break;
    }
    case "review": {
      const project = next.projects.find((item) => item.id === action.id);
      if (!project) throw new Error("El proyecto ya no existe.");
      if (action.action === "reopen") {
        requireRole(role, "admin");
        if (project.status !== "approved")
          throw new Error("Solo se puede reabrir un proyecto aprobado.");
        if (
          next.loans.some(
            (loan) =>
              loan.projectId === project.id && loan.quantity > loan.returned,
          )
        ) {
          throw new Error(
            "Primero deben devolverse todos los elementos prestados antes de reabrir el proyecto.",
          );
        }
        project.status = "changes";
        project.feedback =
          action.feedback?.trim() ||
          "El administrador reabrió el proyecto. Revisá los datos y reenviá la solicitud.";
        break;
      }
      requireRole(role, "teacher");
      if (!project.teachers.includes(TEACHER))
        throw new Error(
          "Solo podés revisar los proyectos que te tienen como profesor responsable.",
        );
      if (project.status !== "pending")
        throw new Error("Solo se pueden revisar proyectos pendientes.");
      if (action.action === "changes") {
        requireText(action.feedback ?? "", "El motivo de los cambios", 10, 800);
        project.status = "changes";
        project.feedback = action.feedback!.trim();
      } else {
        requireFreePlace(next, project);
        const space = next.spaces.find((item) => item.id === project.spaceId);
        if (
          !space?.furniture.some(
            (item) => item.id === project.furnitureId && item.type === "table",
          )
        ) {
          throw new Error("La mesa elegida ya no está disponible.");
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
              `No hay stock suficiente de ${resource?.name ?? "uno de los elementos"} para aprobar este proyecto.`,
            );
          }
        }
        project.status = "approved";
        project.feedback = "";
      }
      break;
    }
    case "deleteProject": {
      requireRole(role, "student", "admin");
      const project = next.projects.find((item) => item.id === action.id);
      if (!project) throw new Error("El proyecto ya no existe.");
      if (
        role === "student" &&
        (!isProjectMember(project, STUDENT) || project.status === "approved")
      ) {
        throw new Error(
          "Solo podés eliminar tus proyectos que todavía no están aprobados.",
        );
      }
      if (next.loans.some((loan) => loan.projectId === project.id))
        throw new Error(
          "No se puede eliminar un proyecto con historial de préstamos.",
        );
      next.projects = next.projects.filter((item) => item.id !== project.id);
      break;
    }
    case "saveSpace": {
      requireRole(role, "admin");
      const space = cloneData(action.space);
      const index = next.spaces.findIndex((item) => item.id === space.id);
      if (index >= 0) space.createdAt = next.spaces[index].createdAt;
      validateSpace(next, space);
      if (index < 0) next.spaces.push(space);
      else next.spaces[index] = space;
      break;
    }
    case "deleteSpace":
      requireRole(role, "admin");
      if (!next.spaces.some((space) => space.id === action.id))
        throw new Error("El espacio ya no existe.");
      if (next.projects.some((project) => project.spaceId === action.id))
        throw new Error(
          "No se puede eliminar un espacio con proyectos asignados.",
        );
      next.spaces = next.spaces.filter((space) => space.id !== action.id);
      break;
    case "saveResource": {
      requireRole(role, "admin");
      const resource = cloneData(action.resource);
      const index = next.resources.findIndex((item) => item.id === resource.id);
      if (index >= 0) resource.createdAt = next.resources[index].createdAt;
      validateResource(next, resource);
      if (index < 0) next.resources.push(resource);
      else next.resources[index] = resource;
      break;
    }
    case "deleteResource":
      requireRole(role, "admin");
      if (!next.resources.some((resource) => resource.id === action.id))
        throw new Error("El elemento ya no existe.");
      if (
        next.projects.some((project) =>
          Object.hasOwn(project.resources, action.id),
        ) ||
        next.loans.some((loan) => loan.resourceId === action.id)
      ) {
        throw new Error(
          "No se puede eliminar un elemento solicitado por proyectos o con historial de préstamos.",
        );
      }
      next.resources = next.resources.filter(
        (resource) => resource.id !== action.id,
      );
      break;
    case "lend": {
      requireRole(role, "loans", "admin");
      if (!Number.isInteger(action.day) || action.day < 1 || action.day > 3)
        throw new Error("Elegí una jornada entre 1 y 3.");
      if (!positiveInteger(action.quantity))
        throw new Error(
          "La cantidad a entregar debe ser un número entero positivo.",
        );
      const project = next.projects.find(
        (item) => item.id === action.projectId,
      );
      const resource = next.resources.find(
        (item) => item.id === action.resourceId,
      );
      if (!project || project.status !== "approved")
        throw new Error(
          "Solo se pueden prestar elementos a un proyecto aprobado.",
        );
      if (!resource || !(project.resources[action.resourceId] > 0))
        throw new Error("Este elemento no está asignado al proyecto.");
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
          "Primero deben devolverse los elementos de la otra jornada antes de registrar un nuevo retiro.",
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
          "Esta entrega supera lo asignado al proyecto para la jornada. Las devoluciones no habilitan otro retiro.",
        );
      }
      if (physicallyOut(next, resource.id) + action.quantity > resource.total) {
        throw new Error(
          "No hay unidades disponibles. Primero deben devolverse los elementos pendientes.",
        );
      }
      next.loans.push({
        id: createId(),
        projectId: project.id,
        resourceId: resource.id,
        day: action.day,
        quantity: action.quantity,
        returned: 0,
        notes: "",
        createdAt: new Intl.DateTimeFormat("sv-SE", {
          timeZone: "America/Argentina/Buenos_Aires",
        }).format(new Date()),
      });
      break;
    }
    case "returnLoan": {
      requireRole(role, "loans", "admin");
      const loan = next.loans.find((item) => item.id === action.id);
      if (!loan) throw new Error("El préstamo ya no existe.");
      if (
        !positiveInteger(action.quantity) ||
        action.quantity > loan.quantity - loan.returned
      ) {
        throw new Error(
          "La devolución debe ser un entero positivo y no superar la cantidad pendiente.",
        );
      }
      if (typeof action.notes !== "string" || action.notes.length > 500)
        throw new Error("La observación puede tener hasta 500 caracteres.");
      loan.returned += action.quantity;
      loan.notes = action.notes.trim();
      break;
    }
  }
  return next;
}
