import { TABLE_LIMITS, TABLE_SIZE } from "./layout";
import type { Furniture } from "./types";

export function rotatedFurniture(rotation: number, delta: number) {
  return (((rotation + delta) % 360) + 360) % 360;
}

/** Los botones cambian una dimensión y conservan el centro; el plano encaja la nueva huella. */
export function adjustedTableSize(
  item: Furniture,
  dimension: "width" | "height",
  delta: number,
) {
  const limits = TABLE_LIMITS[dimension];
  return Math.max(
    limits.min,
    Math.min(limits.max, (item[dimension] ?? TABLE_SIZE[dimension]) + delta),
  );
}
