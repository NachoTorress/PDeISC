import { TABLE_LIMITS, TABLE_SIZE } from './layout';
import type { Furniture } from './types';

export type ResizeHandle = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
type Geometry = Pick<Furniture, 'x' | 'y'> & { width: number; height: number };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Recibe el desplazamiento desde el comienzo del gesto y devuelve la geometría para guardar. */
export function resizeTable(
  item: Furniture,
  handle: ResizeHandle,
  deltaX: number,
  deltaY: number,
  stage: { width: number; height: number },
): Geometry {
  const original: Geometry = {
    x: Number.isFinite(item.x) ? item.x : 50,
    y: Number.isFinite(item.y) ? item.y : 50,
    width: clamp(
      Number.isFinite(item.width) ? item.width! : TABLE_SIZE.width,
      TABLE_LIMITS.width.min,
      TABLE_LIMITS.width.max,
    ),
    height: clamp(
      Number.isFinite(item.height) ? item.height! : TABLE_SIZE.height,
      TABLE_LIMITS.height.min,
      TABLE_LIMITS.height.max,
    ),
  };
  if (
    !Number.isFinite(stage.width) ||
    !Number.isFinite(stage.height) ||
    stage.width <= 4 ||
    stage.height <= 4
  )
    return original;

  const angle = ((Number.isFinite(item.rotation) ? item.rotation % 360 : 0) * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = Number.isFinite(deltaX) ? deltaX : 0;
  const dy = Number.isFinite(deltaY) ? deltaY : 0;
  const horizontal = handle.includes('e') ? 1 : handle.includes('w') ? -1 : 0;
  const vertical = handle.includes('s') ? 1 : handle.includes('n') ? -1 : 0;
  const width = (original.width / 100) * stage.width;
  const height = (original.height / 100) * stage.height;
  const widthChange =
    clamp(
      width + horizontal * (dx * cos + dy * sin),
      (TABLE_LIMITS.width.min / 100) * stage.width,
      (TABLE_LIMITS.width.max / 100) * stage.width,
    ) - width;
  const heightChange =
    clamp(
      height + vertical * (-dx * sin + dy * cos),
      (TABLE_LIMITS.height.min / 100) * stage.height,
      (TABLE_LIMITS.height.max / 100) * stage.height,
    ) - height;
  if (widthChange === 0 && heightChange === 0) return original;
  // El centro acompaña la mitad del cambio: el borde o esquina opuestos quedan inmóviles.
  const shiftX = (horizontal * widthChange * cos - vertical * heightChange * sin) / 2;
  const shiftY = (horizontal * widthChange * sin + vertical * heightChange * cos) / 2;
  const centerX = (original.x / 100) * stage.width;
  const centerY = (original.y / 100) * stage.height;
  const halfX = (Math.abs(cos) * width + Math.abs(sin) * height) / 2;
  const halfY = (Math.abs(sin) * width + Math.abs(cos) * height) / 2;
  const extentX = (Math.abs(cos) * widthChange + Math.abs(sin) * heightChange) / 2;
  const extentY = (Math.abs(sin) * widthChange + Math.abs(cos) * heightChange) / 2;
  const margins = [
    [centerX - halfX - 2, shiftX - extentX],
    [stage.width - 2 - centerX - halfX, -shiftX - extentX],
    [centerY - halfY - 2, shiftY - extentY],
    [stage.height - 2 - centerY - halfY, -shiftY - extentY],
  ];
  let minimum = 0;
  let maximum = 1;
  // Interpolar todo el gesto limita el crecimiento sin mover el ancla ni recortar la mesa.
  for (const [margin, change] of margins) {
    if (change < -1e-9) maximum = Math.min(maximum, -margin / change);
    else if (change > 1e-9) minimum = Math.max(minimum, -margin / change);
    else if (margin < -1e-7) return original;
  }
  if (maximum < minimum || maximum < 0 || minimum > 1) return original;
  const progress = clamp(maximum, 0, 1);
  return {
    x: ((centerX + shiftX * progress) / stage.width) * 100,
    y: ((centerY + shiftY * progress) / stage.height) * 100,
    width: clamp(
      ((width + widthChange * progress) / stage.width) * 100,
      TABLE_LIMITS.width.min,
      TABLE_LIMITS.width.max,
    ),
    height: clamp(
      ((height + heightChange * progress) / stage.height) * 100,
      TABLE_LIMITS.height.min,
      TABLE_LIMITS.height.max,
    ),
  };
}
