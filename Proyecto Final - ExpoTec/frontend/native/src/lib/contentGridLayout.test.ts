import assert from "node:assert/strict";
import { test } from "node:test";
import { contentGridLayout } from "./contentGridLayout";

const defaults = {
  itemCount: 6,
  minItemWidth: 320,
  maxColumns: 3,
  gap: 16,
};

test("conserva tres columnas con anchos fraccionales de escritorio", () => {
  // Las capturas al 125 % generan anchos fraccionales. El flex de cada fila
  // reparte ese ancho; no se redondea y suma un ancho fijo por tarjeta.
  for (const width of [992, 1008.7999877929688, 1113.6, 1281.5999755859375]) {
    assert.equal(contentGridLayout({ ...defaults, width }).columns, 3);
    assert.equal(contentGridLayout({ ...defaults, width, maxColumns: 2 }).columns, 2);
  }
});

test("cambia columnas por espacio útil y aprovecha listas cortas", () => {
  for (const [width, columns] of [[358.4, 1], [655.99, 1], [656, 2], [991.99, 2], [992, 3]]) {
    assert.equal(contentGridLayout({ ...defaults, width }).columns, columns);
  }
  assert.equal(contentGridLayout({ ...defaults, width: 1200, itemCount: 1 }).columns, 1);
  assert.equal(contentGridLayout({ ...defaults, width: 1200, itemCount: 2 }).columns, 2);
  assert.equal(contentGridLayout({ ...defaults, width: 0, itemCount: 0 }).columns, 1);
});

test("el límite opcional de tarjetas se aplica a la fila con sus separaciones", () => {
  assert.equal(contentGridLayout({ ...defaults, width: 1200 }).maxRowWidth, undefined);
  assert.equal(contentGridLayout({ ...defaults, width: 1200, maxItemWidth: 350 }).maxRowWidth, 1082);
  assert.equal(contentGridLayout({ ...defaults, width: 1200, itemCount: 2, maxItemWidth: 350 }).maxRowWidth, 716);
});
