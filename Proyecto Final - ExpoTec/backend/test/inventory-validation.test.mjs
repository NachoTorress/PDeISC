/** Prueba unitaria (sin base de datos real): validación de elementos del inventario. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { resourceBody, resourceRequests, inventoryQuery } from '../src/validators/inventory.mjs';

test('inventario valida cantidades estrictas, campos y versiones', () => {
  const input = { name: '  Alargue 2026 ', description: '', total: 0 };
  assert.equal(resourceBody(input).name, 'Alargue 2026');
  for (const total of [-1, 0.5, '2', null, Infinity, 100001]) assert.throws(() => resourceBody({ ...input, total }));
  assert.throws(() => resourceBody({ ...input, reserved: 0 }));
  assert.throws(() => resourceBody({ ...input, version: 0 }, true));
  assert.deepEqual(inventoryQuery({ archived: true }), { limit: 25, offset: 0, archived: true });
  assert.throws(() => inventoryQuery({ archived: 'true' }));
  assert.equal(resourceBody({ ...input, total: 3, unavailable: 1 }).unavailable, 1);
  assert.equal(resourceBody({ ...input, version: 1 }, true).unavailable, undefined);
  for (const unavailable of [-1, 0.5, '1', null, 4]) assert.throws(() => resourceBody({ ...input, total: 3, unavailable }));
  for (const note of [null, 4, 'x'.repeat(1001)]) assert.throws(() => resourceBody({ ...input, note }));
});
test('los pedidos rechazan duplicados y cantidades inválidas; un cliente anterior no borra los existentes', () => {
  const resourceId = randomUUID();
  assert.deepEqual(resourceRequests(undefined), []);
  assert.equal(resourceRequests(undefined, true), undefined);
  assert.deepEqual(resourceRequests([{ resourceId, quantity: 2 }]), [{ resourceId, quantity: 2 }]);
  for (const value of [null, {}, [{ resourceId, quantity: 0 }], [{ resourceId, quantity: 1.5 }], [{ resourceId, quantity: '2' }], [{ resourceId, quantity: 10001 }], [{ resourceId, quantity: 1, reserved: 1 }], [{ resourceId: 'fake', quantity: 1 }], [{ resourceId, quantity: 1 }, { resourceId, quantity: 2 }]])
    assert.throws(() => resourceRequests(value), error => error.status === 400);
});

test('las notas de inventario validan el texto normalizado antes de guardarlo', () => {
  const input = { name: 'Alargue', description: '', total: 2, unavailable: 1 };
  const boundary = '\u0344'.repeat(500), excessive = '\u0344'.repeat(501);
  for (const editing of [false, true]) {
    const body = { ...input, ...(editing ? { version: 1 } : {}) };
    assert.equal(resourceBody({ ...body, note: boundary }, editing).note.length, 1000);
    assert.throws(() => resourceBody({ ...body, note: excessive }, editing), error => error.status === 400 && !!error.fields?.note);
    assert.equal(resourceBody({ ...body, note: `  ${'e\u0301'.repeat(1000)}  ` }, editing).note, '\u00e9'.repeat(1000));
  }
});
