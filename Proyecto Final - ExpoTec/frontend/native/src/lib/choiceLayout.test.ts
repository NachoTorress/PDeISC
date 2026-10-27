/** Pruebas unitarias de `choiceLayout.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import assert from "node:assert/strict";
import { test } from "node:test";
import { choiceLayout } from "./choiceLayout";

test("tres opciones comparten fila o se apilan, sin dejar una opción suelta", () => {
  for (const width of [272, 358, 400, 440, 448, 500, 712, 760]) {
    const layout = choiceLayout(width, 3);
    assert.ok(layout.columns === 1 || layout.columns === 3);
    assert.ok(layout.optionWidth! > 0);
    assert.ok(
      layout.optionWidth! * layout.columns + 8 * (layout.columns - 1) <=
        width + 0.001,
    );
  }
  assert.equal(choiceLayout(760, 3).columns, 3);
  assert.equal(choiceLayout(358, 3).columns, 1);
});

test("cuatro filtros conservan filas completas en anchos intermedios", () => {
  assert.equal(choiceLayout(500, 4).columns, 2);
  assert.equal(choiceLayout(760, 4).columns, 4);
  assert.equal(choiceLayout(0, 4).optionWidth, undefined);
});
