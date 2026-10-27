/** Pruebas unitarias de `floorplanSelection.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import assert from "node:assert/strict";
import test from "node:test";
import { furnitureSelection } from "./floorplanSelection";
import { adjustedTableSize, rotatedFurniture } from "./furnitureControls";
import type { Furniture } from "./types";

const table: Furniture = {
  id: "M1",
  type: "table",
  x: 10,
  y: 15,
  rotation: 30,
  width: 6,
  height: 4,
};
const stage = { width: 300, height: 240 };
const close = (value: number, expected: number) =>
  assert.ok(Math.abs(value - expected) < 1e-8, `${value} != ${expected}`);

test("la selección de una mesa pequeña girada conserva su tamaño real y su centro", () => {
  const points = furnitureSelection(table, stage);
  close(Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y), 18);
  close(Math.hypot(points[2].x - points[1].x, points[2].y - points[1].y), 9.6);
  close(points.reduce((sum, point) => sum + point.x, 0) / 4, 30);
  close(points.reduce((sum, point) => sum + point.y, 0) / 4, 36);
});

test("la selección sigue a la mesa junto al borde y después de cambiar su tamaño", () => {
  const item = { ...table, x: 5, y: 5, rotation: 0 };
  assert.deepEqual(
    furnitureSelection(item, stage).map(({ x, y }) => ({ x, y })),
    [
      { x: 6, y: 7.2 },
      { x: 24, y: 7.2 },
      { x: 24, y: 16.8 },
      { x: 6, y: 16.8 },
    ],
  );
  const points = furnitureSelection(
    { ...item, width: 20, height: 15, x: 50, y: 50 },
    stage,
  );
  close(points[1].x - points[0].x, 60);
  close(points[2].y - points[1].y, 36);
});

test("los giros rápidos conservan todos los grados y normalizan ambos sentidos", () => {
  assert.equal(rotatedFurniture(350, 15), 5);
  assert.equal(rotatedFurniture(5, -15), 350);
  assert.equal(rotatedFurniture(283, 90), 13);
  assert.equal(rotatedFurniture(360, 0), 0);
});

test("los controles de tamaño admiten mesas anteriores y respetan los límites sin cambiar el objeto", () => {
  const original = { ...table };
  assert.equal(adjustedTableSize(table, "width", -2), 6);
  assert.equal(adjustedTableSize(table, "height", -1), 4);
  assert.equal(adjustedTableSize({ ...table, width: 29 }, "width", 2), 30);
  assert.equal(adjustedTableSize({ ...table, height: 24.5 }, "height", 1), 25);
  assert.equal(
    adjustedTableSize({ ...table, width: undefined }, "width", 2),
    16,
  );
  assert.deepEqual(table, original);
});
