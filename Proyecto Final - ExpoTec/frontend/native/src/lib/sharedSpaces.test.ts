import test from "node:test";
import assert from "node:assert/strict";
import {
  changeSharedFurniture,
  editSharedSpace,
  sharedSpaceBody,
} from "./sharedSpaces";
import type { SharedSpace } from "./sharedSpaces";

test("el borrador conserva versión y puestos, y quitar una mesa retira su inscripción", () => {
  const source: SharedSpace = {
    id: "space",
    name: "Aula",
    description: "",
    version: 4,
    createdAt: "2026-10-19",
    updatedAt: "2026-10-19",
    furniture: [
      {
        id: "M01",
        type: "table",
        x: 50,
        y: 50,
        rotation: 0,
        width: 14,
        height: 9,
      },
    ],
    booths: [{ id: "booth", furnitureId: "M01" }],
  };
  const draft = editSharedSpace(source);
  draft.space.furniture[0].x = 60;
  assert.equal(source.furniture[0].x, 50);
  assert.equal(sharedSpaceBody(draft).version, 4);
  assert.equal("createdAt" in sharedSpaceBody(draft), false);
  assert.deepEqual(changeSharedFurniture(draft, []).boothFurnitureIds, []);
  assert.deepEqual(draft.boothFurnitureIds, ["M01"]);
});
