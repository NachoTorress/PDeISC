import assert from "node:assert/strict";
import test from "node:test";
import {
  dropPosition,
  finishFurnitureDrop,
  furnitureId,
  paletteFurniture,
} from "./furnitureDrop";
import type { Space } from "./types";

const space: Space = {
  id: "patio",
  name: "Patio",
  description: "",
  furniture: [],
  createdAt: "2026-10-14",
};
const rect = { x: 180, y: 230, width: 400, height: 300 };

test("el drop usa coordenadas de ventana con el offset actual del plano", () => {
  assert.deepEqual(
    dropPosition({ x: 280, y: 350 }, rect, paletteFurniture("table")),
    { x: 25, y: 40 },
  );
  assert.deepEqual(
    dropPosition(
      { x: 280, y: 350 },
      { ...rect, x: 80, y: 200 },
      paletteFurniture("table"),
    ),
    { x: 50, y: 50 },
  );
});

test("soltar fuera, incluso un píxel más allá del borde, no crea ni consume un ID", () => {
  let ids = 0;
  for (const end of [
    { x: 179, y: 350 },
    { x: 581, y: 350 },
    { x: 280, y: 229 },
    { x: 280, y: 531 },
    { x: NaN, y: 350 },
  ]) {
    assert.equal(
      finishFurnitureDrop(
        space,
        { type: "table", start: { x: 220, y: 140 }, end },
        rect,
        () => {
          ids++;
          return "aa";
        },
      ),
      null,
    );
  }
  assert.equal(ids, 0);
  assert.equal(space.furniture.length, 0);
});

test("un clic o el temblor mínimo de un toque no agrega una pieza dentro del plano", () => {
  let ids = 0;
  for (const end of [
    { x: 280, y: 350 },
    { x: 283, y: 354 },
  ]) {
    assert.equal(
      finishFurnitureDrop(
        space,
        { type: "bench", start: { x: 280, y: 350 }, end },
        rect,
        () => {
          ids++;
          return "aa";
        },
      ),
      null,
    );
  }
  assert.equal(ids, 0);
});

test("un arrastre válido crea exactamente una pieza y mantiene el espacio recibido intacto", () => {
  let ids = 0;
  const item = finishFurnitureDrop(
    space,
    { type: "label", start: { x: 220, y: 140 }, end: { x: 380, y: 380 } },
    rect,
    () => {
      ids++;
      return "aa";
    },
  );
  assert.equal(ids, 1);
  assert.equal(item?.type, "label");
  assert.equal(item?.text, "Nueva zona");
  assert.equal(item?.x, 50);
  assert.equal(item?.y, 50);
  assert.equal(space.furniture.length, 0);
});

test("el borde válido conserva la pieza completa, incluyendo un banco girado", () => {
  const rotated = { ...paletteFurniture("bench"), rotation: 90 };
  const result = dropPosition({ x: 180, y: 230 }, rect, rotated);
  assert.ok(result);
  assert.ok(Math.abs(result.x - (13 / rect.width) * 100) < 1e-8);
  assert.ok(Math.abs(result.y - (43 / rect.height) * 100) < 1e-8);
  assert.equal(
    dropPosition({ x: 380, y: 380 }, { ...rect, width: 3 }, rotated),
    null,
  );
});

test("crear después de quitar otras piezas no reutiliza un identificador que todavía existe", () => {
  const existing = {
    ...space,
    furniture: [
      { ...paletteFurniture("table"), id: "PAM03-aa" },
      { ...paletteFurniture("table"), id: "PAM04-aa" },
    ],
  };
  assert.equal(furnitureId(existing, "table", "aa"), "PAM05-aa");
});
