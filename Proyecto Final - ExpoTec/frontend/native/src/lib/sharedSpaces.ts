/** Tipos y edición del plano compartido. */
import type { Furniture, Space } from "./types";

/** Espacio con mobiliario y puestos (`GET /api/spaces/:id`). */
export interface SharedSpace extends Space {
  version: number;
  updatedAt: string;
  booths: { id: string; furnitureId: string; projectId?: string | null; projectName?: string | null }[];
}
/** Espacio de la lista. */
export type SpaceSummary = Omit<SharedSpace, "furniture" | "booths"> & {
  furnitureCount: number;
  boothCount: number;
};
/** Borrador del editor de plano. */
export interface SpaceDraft {
  space: Space;
  version: number;
  boothFurnitureIds: string[];
}
/** Crea el borrador a partir del espacio guardado. */
export function editSharedSpace(source: SharedSpace): SpaceDraft {
  return {
    space: {
      id: source.id,
      name: source.name,
      description: source.description,
      createdAt: source.createdAt,
      furniture: source.furniture.map((item) => ({ ...item })),
    },
    version: source.version,
    boothFurnitureIds: source.booths.map((booth) => booth.furnitureId),
  };
}
/** Aplica un cambio de mobiliario al borrador. */
export function changeSharedFurniture(
  draft: SpaceDraft,
  furniture: Furniture[],
): SpaceDraft {
  return {
    ...draft,
    space: { ...draft.space, furniture },
    boothFurnitureIds: draft.boothFurnitureIds.filter((id) =>
      furniture.some((item) => item.id === id && item.type === "table"),
    ),
  };
}
/** Cuerpo de `PUT /api/spaces/:id`. */
export function sharedSpaceBody(draft: SpaceDraft) {
  return {
    version: draft.version,
    name: draft.space.name,
    description: draft.space.description,
    furniture: draft.space.furniture,
    boothFurnitureIds: draft.boothFurnitureIds,
  };
}
