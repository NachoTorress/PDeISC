/** Geometría de la selección de piezas del plano (esquinas y tiradores). */
import type { Furniture } from "./types";
import type { ResizeHandle } from "./resizeTable";
import { furnitureSize } from "./furnitureDrop";

/** Dirección de cada tirador de tamaño. */
export const resizeDirections: Record<ResizeHandle, [number, number]> = {
  nw: [-1, -1],
  n: [0, -1],
  ne: [1, -1],
  e: [1, 0],
  se: [1, 1],
  s: [0, 1],
  sw: [-1, 1],
  w: [-1, 0],
};

/** El contorno sigue las esquinas reales, sin agrandar ni desplazar la selección para los tiradores. */
export function furnitureSelection(
  item: Furniture,
  stage: { width: number; height: number },
  handles: ResizeHandle[] = ["nw", "ne", "se", "sw"],
) {
  const size = furnitureSize(item, stage);
  const radians = (item.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const centerX = (item.x / 100) * stage.width;
  const centerY = (item.y / 100) * stage.height;
  return handles.map((handle) => {
    const [horizontal, vertical] = resizeDirections[handle];
    const localX = (horizontal * size.width) / 2;
    const localY = (vertical * size.height) / 2;
    return {
      handle,
      x: centerX + localX * cos - localY * sin,
      y: centerY + localX * sin + localY * cos,
    };
  });
}
