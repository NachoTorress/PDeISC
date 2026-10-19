import type { Furniture, Space } from "./types";

export interface SharedSpace extends Space {
  version: number;
  updatedAt: string;
  booths: { id: string; furnitureId: string }[];
}
export type SpaceSummary = Omit<SharedSpace, "furniture" | "booths"> & {
  furnitureCount: number;
  boothCount: number;
};
export interface SpaceDraft {
  space: Space;
  version: number;
  boothFurnitureIds: string[];
}
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
export function sharedSpaceBody(draft: SpaceDraft) {
  return {
    version: draft.version,
    name: draft.space.name,
    description: draft.space.description,
    furniture: draft.space.furniture,
    boothFurnitureIds: draft.boothFurnitureIds,
  };
}
