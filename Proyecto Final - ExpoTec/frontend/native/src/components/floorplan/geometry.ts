/**
 * Geometría del plano: tipos de tamaño y posición, y cálculos para mantener
 * cada pieza dentro del escenario aunque esté girada.
 */
import type { Furniture } from "../../lib/types";
import { furnitureSize } from "../../lib/furnitureDrop";
import { resizeDirections } from "../../lib/floorplanSelection";

/** Tamaño en píxeles del escenario o de una pieza. */
export type Size = { width: number; height: number };
/** Posición y tamaño relativos (porcentaje del plano). */
export type Geometry = { x: number; y: number; width: number; height: number };

/** Limita un valor al rango [min, max]. */
export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));
/** Dirección de cada manija de cambio de tamaño. */
export const directions = resizeDirections;

/** Convierte el tamaño relativo guardado en píxeles, sin cambiar los datos del proyecto. */
export function sizeFor(item: Furniture, stage: Size): Size {
  return furnitureSize(item, stage);
}

/** Incluye el giro en la huella del elemento para conservarlo dentro del plano. */
export function fitItem(
  item: Furniture,
  stage: Size,
): { x: number; y: number } {
  const size = sizeFor(item, stage);
  const angle = (item.rotation * Math.PI) / 180;
  const halfX =
    (Math.abs(Math.cos(angle)) * size.width +
      Math.abs(Math.sin(angle)) * size.height) /
      2 +
    2;
  const halfY =
    (Math.abs(Math.sin(angle)) * size.width +
      Math.abs(Math.cos(angle)) * size.height) /
      2 +
    2;
  const minX = Math.min(50, (halfX / stage.width) * 100);
  const minY = Math.min(50, (halfY / stage.height) * 100);
  return {
    x: clamp(item.x, minX, 100 - minX),
    y: clamp(item.y, minY, 100 - minY),
  };
}
