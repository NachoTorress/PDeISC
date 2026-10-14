import type { Furniture, Space } from "./types";
import { TABLE_SIZE } from "./layout";

export type Point = { x: number; y: number };
export type WindowRect = Point & { width: number; height: number };
export type PaletteDrag = { type: Furniture["type"]; start: Point; end: Point };
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/** La paleta y el plano usan la misma huella para que la vista previa coincida al soltar. */
export function furnitureSize(
  item: Furniture,
  stage: { width: number; height: number },
) {
  if (item.type === "table")
    return {
      width: ((item.width ?? TABLE_SIZE.width) / 100) * stage.width,
      height: ((item.height ?? TABLE_SIZE.height) / 100) * stage.height,
    };
  if (item.type === "bench") return { width: 82, height: 22 };
  if (item.type === "label")
    return {
      width: Math.min(
        stage.width - 16,
        clamp((item.text?.length ?? 10) * 7 + 24, 78, 224),
      ),
      height: 32,
    };
  return { width: 32, height: 32 };
}

export function paletteFurniture(type: Furniture["type"]): Furniture {
  return {
    id: "",
    type,
    x: 50,
    y: 50,
    rotation: 0,
    ...(type === "table" ? TABLE_SIZE : {}),
    ...(type === "label" ? { text: "Nueva zona" } : {}),
  };
}

/** Convierte coordenadas de ventana en porcentajes. Soltar fuera nunca se convierte en un borde válido. */
export function dropPosition(
  point: Point,
  rect: WindowRect,
  item: Furniture,
): Point | null {
  if (
    ![
      point.x,
      point.y,
      rect.x,
      rect.y,
      rect.width,
      rect.height,
      item.rotation,
    ].every(Number.isFinite) ||
    rect.width <= 4 ||
    rect.height <= 4
  )
    return null;
  if (
    point.x < rect.x ||
    point.y < rect.y ||
    point.x > rect.x + rect.width ||
    point.y > rect.y + rect.height
  )
    return null;
  const size = furnitureSize(item, rect);
  const radians = (item.rotation * Math.PI) / 180;
  const halfX =
    (Math.abs(Math.cos(radians)) * size.width +
      Math.abs(Math.sin(radians)) * size.height) /
      2 +
    2;
  const halfY =
    (Math.abs(Math.sin(radians)) * size.width +
      Math.abs(Math.cos(radians)) * size.height) /
      2 +
    2;
  if (halfX * 2 > rect.width || halfY * 2 > rect.height) return null;
  return {
    x: (clamp(point.x - rect.x, halfX, rect.width - halfX) / rect.width) * 100,
    y:
      (clamp(point.y - rect.y, halfY, rect.height - halfY) / rect.height) * 100,
  };
}

/** Crea una pieza solo después de un arrastre real y un destino válido; el toque simple no consume un ID. */
export function finishFurnitureDrop(
  space: Space,
  drag: PaletteDrag,
  rect: WindowRect,
  createId: () => string,
): Furniture | null {
  if (
    ![drag.start.x, drag.start.y].every(Number.isFinite) ||
    Math.hypot(drag.end.x - drag.start.x, drag.end.y - drag.start.y) < 6
  )
    return null;
  const item = paletteFurniture(drag.type);
  const position = dropPosition(drag.end, rect, item);
  if (!position) return null;
  return {
    ...item,
    ...position,
    id: furnitureId(space, drag.type, createId()),
  };
}

/** Los números ya usados permanecen reservados mientras su pieza exista, incluso tras otras eliminaciones. */
export function furnitureId(
  space: Space,
  type: Furniture["type"],
  randomId: string,
) {
  const base = `${space.id.slice(0, 2).toUpperCase()}${{ table: "M", bench: "B", power: "E", label: "Z" }[type]}`;
  let sequence = space.furniture.length + 1;
  while (
    space.furniture.some((item) =>
      item.id.startsWith(`${base}${String(sequence).padStart(2, "0")}-`),
    )
  )
    sequence++;
  let id = `${base}${String(sequence).padStart(2, "0")}-${randomId.slice(0, 2)}`;
  while (space.furniture.some((item) => item.id === id))
    id = `${base}${String(++sequence).padStart(2, "0")}-${randomId.slice(0, 2)}`;
  return id;
}
