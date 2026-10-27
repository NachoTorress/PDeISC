/** Prueba unitaria (sin base de datos real): validación de entregas y devoluciones. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { deliveryBody, returnBody, loansQuery } from '../src/validators/loans.mjs';

test('entregas exigen jornada, cantidad, versión y responsables válidos', () => {
  const input = { projectId: randomUUID(), projectVersion: 1, resourceId: randomUUID(), recipientId: randomUUID(), quantity: 2, day: 1 };
  assert.equal(deliveryBody(input).quantity, 2);
  for (const change of [{ quantity: 0 }, { quantity: 1.5 }, { quantity: '2' }, { day: '1' }, { day: 4 }, { projectVersion: 0 }, { recipientId: 'fake' }, { returned: 0 }]) assert.throws(() => deliveryBody({ ...input, ...change }));
  assert.deepEqual(loansQuery({ openOnly: true }), { limit: 25, offset: 0, day: undefined, openOnly: true });
  assert.throws(() => loansQuery({}, true));
});
test('devoluciones y novedades no admiten daños superiores a lo recibido ni cantidades fraccionadas', () => {
  assert.equal(returnBody({ version: 1, quantity: 2 }).damagedQuantity, 0);
  assert.equal(returnBody({ version: 1, quantity: 0, note: 'Falta devolver una unidad del equipo.' }).quantity, 0);
  for (const body of [{ version: 1, quantity: 0 }, { version: 1, quantity: -1 }, { version: 1, quantity: 1.5 }, { version: 1, quantity: 1, damagedQuantity: 2 }, { version: 1, quantity: 1, damagedQuantity: 1 }, { version: 0, quantity: 1 }, { version: 1, quantity: 1, receivedBy: randomUUID() }]) assert.throws(() => returnBody(body));
});
