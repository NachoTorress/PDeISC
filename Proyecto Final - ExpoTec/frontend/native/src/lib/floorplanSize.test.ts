import assert from "node:assert/strict";
import { test } from "node:test";
import { floorplanSize } from "./floorplanSize";

test("el plano conserva su tamaño aunque las mediciones repitan pequeñas fracciones", () => {
  const viewport = { width: 1280, height: 900 };
  const expected = floorplanSize(628, viewport);
  for (const width of [628.02, 627.94, 628.08, 628, 627.99]) {
    assert.deepEqual(floorplanSize(width, viewport), expected);
  }
  // Volver a medir el resultado tampoco aumenta su altura: no hay realimentación.
  assert.deepEqual(floorplanSize(expected.width, viewport), expected);
});

test("el plano de consulta conserva sus dimensiones en teléfono y escritorio", () => {
  assert.deepEqual(floorplanSize(628, { width: 1280, height: 900 }), {
    width: 628,
    height: 377,
  });
  assert.deepEqual(floorplanSize(350, { width: 390, height: 844 }), {
    width: 350,
    height: 324,
  });
  assert.deepEqual(floorplanSize(280, { width: 320, height: 568 }), {
    width: 280,
    height: 234,
  });
  assert.deepEqual(floorplanSize(640, { width: 690, height: 390 }), {
    width: 640,
    height: 288,
  });
});

test("el editor móvil deja lugar para los controles sin achicar la consulta pública", () => {
  assert.deepEqual(floorplanSize(350, { width: 390, height: 844 }, true), {
    width: 350,
    height: 273,
  });
  assert.deepEqual(floorplanSize(280, { width: 320, height: 568 }, true), {
    width: 280,
    height: 208,
  });
  assert.deepEqual(floorplanSize(640, { width: 690, height: 390 }, true), {
    width: 640,
    height: 205,
  });
  assert.deepEqual(floorplanSize(720, { width: 800, height: 390 }, true), {
    width: 720,
    height: 230,
  });
});
