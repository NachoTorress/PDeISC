/**
 * Cambios puros sobre el borrador de un plano compartido. Cada función recibe
 * el borrador actual y devuelve uno nuevo, sin modificar el original; las usa
 * el hook `useSharedSpaces` dentro de `setDraft`.
 */
import { changeSharedFurniture } from "./sharedSpaces";
import type { SpaceDraft } from "./sharedSpaces";
import type { Furniture, Space } from "./types";

/** Posición nueva de una pieza (porcentaje del plano). */
export type FurniturePosition = { id: string; x: number; y: number };

/** Mueve las piezas indicadas para que no queden fuera del plano. */
export function fitDraft(
  draft: SpaceDraft,
  positions: FurniturePosition[],
): SpaceDraft {
  return {
    ...draft,
    space: {
      ...draft.space,
      furniture: draft.space.furniture.map((item) => {
        const position = positions.find((entry) => entry.id === item.id);
        return position ? { ...item, x: position.x, y: position.y } : item;
      }),
    },
  };
}

/** Aplica cambios (posición, tamaño, giro…) a una pieza. */
export function updateDraftFurniture(
  draft: SpaceDraft,
  id: string,
  changes: Partial<Furniture>,
): SpaceDraft {
  return changeSharedFurniture(
    draft,
    draft.space.furniture.map((item) =>
      item.id === id ? { ...item, ...changes } : item,
    ),
  );
}

/** Agrega una pieza nueva al final del plano. */
export function addDraftFurniture(
  draft: SpaceDraft,
  item: Furniture,
): SpaceDraft {
  return changeSharedFurniture(draft, [...draft.space.furniture, item]);
}

/** Reemplaza los datos del espacio (nombre, descripción y piezas). */
export function replaceDraftSpace(draft: SpaceDraft, next: Space): SpaceDraft {
  return { ...changeSharedFurniture(draft, next.furniture), space: next };
}

/** Habilita o deshabilita una mesa como puesto para proyectos. */
export function toggleDraftBooth(
  draft: SpaceDraft,
  furnitureId: string,
  enabled: boolean,
): SpaceDraft {
  return {
    ...draft,
    boothFurnitureIds: enabled
      ? [...draft.boothFurnitureIds, furnitureId]
      : draft.boothFurnitureIds.filter((id) => id !== furnitureId),
  };
}
