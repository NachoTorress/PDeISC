/** Pruebas unitarias de `spaceDraftEdits.ts`: cada cambio devuelve un borrador nuevo sin modificar el original. */
import test from "node:test";
import assert from "node:assert/strict";
import {
  addDraftFurniture,
  fitDraft,
  replaceDraftSpace,
  toggleDraftBooth,
  updateDraftFurniture,
} from "./spaceDraftEdits";
import type { SpaceDraft } from "./sharedSpaces";
import type { Furniture } from "./types";

const table = (id: string, x = 50, y = 50): Furniture =>
  ({ id, type: "table", x, y, width: 10, height: 8, rotation: 0 }) as Furniture;

const draft: SpaceDraft = {
  version: 3,
  boothFurnitureIds: ["A1"],
  space: {
    id: "s1",
    name: "Aula",
    description: "",
    createdAt: "2026-10-27",
    furniture: [table("A1"), table("A2", 10, 10)],
  },
};

test("mover, ajustar y agregar piezas no modifica el borrador original", () => {
  const moved = updateDraftFurniture(draft, "A2", { x: 30 });
  assert.equal(moved.space.furniture[1].x, 30);
  assert.equal(draft.space.furniture[1].x, 10);
  const fitted = fitDraft(draft, [{ id: "A1", x: 5, y: 6 }]);
  assert.deepEqual(
    [fitted.space.furniture[0].x, fitted.space.furniture[0].y],
    [5, 6],
  );
  assert.equal(fitted.space.furniture[1], draft.space.furniture[1]);
  const added = addDraftFurniture(draft, table("A3"));
  assert.equal(added.space.furniture.length, 3);
  assert.equal(draft.space.furniture.length, 2);
});

test("habilitar puestos y quitar mesas mantiene la lista de puestos coherente", () => {
  const enabled = toggleDraftBooth(draft, "A2", true);
  assert.deepEqual(enabled.boothFurnitureIds, ["A1", "A2"]);
  assert.deepEqual(toggleDraftBooth(enabled, "A1", false).boothFurnitureIds, [
    "A2",
  ]);
  // Si la mesa deja de existir, su puesto se quita del borrador.
  const replaced = replaceDraftSpace(enabled, {
    ...draft.space,
    furniture: [table("A2")],
  });
  assert.deepEqual(replaced.boothFurnitureIds, ["A2"]);
  assert.equal(replaced.version, 3);
});
