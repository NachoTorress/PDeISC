import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpaceBody, saveSpaceBody } from '../src/validators/spaces.mjs';

const table = { id: 'M01', type: 'table', x: 50, y: 50, rotation: 90, width: 14, height: 9 };
const plan = { name: ' Aula 1 ', description: ' Planta baja ', version: 1, furniture: [table], boothFurnitureIds: ['M01'] };

test('normaliza el plano y distingue mobiliario de puestos inscribibles', () => {
  assert.deepEqual(createSpaceBody({ name: plan.name, description: plan.description }), { name: 'Aula 1', description: 'Planta baja' });
  assert.deepEqual(saveSpaceBody(plan).boothFurnitureIds, ['M01']);
  assert.deepEqual(saveSpaceBody({ ...plan, boothFurnitureIds: [] }).boothFurnitureIds, []);
  assert.throws(() => createSpaceBody({ name: 'x', description: '' }), error => !!error.fields.name);
});
test('rechaza códigos repetidos, tamaños, versiones y puestos fuera del plano', () => {
  for (const value of [
    { ...plan, version: 0 }, { ...plan, version: 1.5 }, { ...plan, furniture: [table, table] },
    { ...plan, furniture: [{ ...table, x: NaN }] }, { ...plan, furniture: [{ ...table, width: 31 }] },
    { ...plan, furniture: [{ ...table, rotation: 360 }] }, { ...plan, boothFurnitureIds: ['missing'] },
    { ...plan, furniture: [{ id: 'B01', type: 'bench', x: 50, y: 50, rotation: 0 }], boothFurnitureIds: ['B01'] },
    { ...plan, furniture: [{ id: 'Z01', type: 'label', x: 50, y: 50, rotation: 0, text: ' ' }], boothFurnitureIds: [] },
    { ...plan, furniture: [{ ...table, admin: true }] }, { ...plan, furniture: Array(151).fill(table) },
  ]) assert.throws(() => saveSpaceBody(value), error => error.status === 400);
});
