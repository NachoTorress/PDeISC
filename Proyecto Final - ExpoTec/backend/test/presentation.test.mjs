import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { presentationQuery } from '../src/validators/presentation.mjs';
import { createApp } from '../src/create-app.mjs';
import { listen, memoryRepository, testConfig } from './support.mjs';

test('presentación valida páginas y cursores, sin aceptar filtros privados', () => {
  assert.deepEqual(presentationQuery({}), { limit: 100, after: undefined });
  const after = randomUUID();
  assert.deepEqual(presentationQuery({ limit: 1, after }), { limit: 1, after });
  for (const body of [{ limit: 0 }, { limit: 101 }, { limit: '10' }, { limit: 1.5 }, { after: 'SQL' }, { after: null }, { status: 'pending' }, { userId: after }])
    assert.throws(() => presentationQuery(body), error => error.status === 400);
});

test('la presentación es pública y valida antes de consultar el repositorio', async t => {
  let called = 0;
  const repository = { async presentation(input) { called++; assert.equal(input.limit, 100); return { projects: [], nextCursor: null }; } };
  const api = await listen(createApp(memoryRepository(), testConfig, console, undefined, undefined, repository));
  t.after(api.close);
  const result = await api.request('/api/projects/presentation/query');
  assert.equal(result.status, 200); assert.deepEqual(result.body, { projects: [], nextCursor: null });
  assert.equal((await api.request('/api/projects/presentation/query', { status: 'pending' })).status, 400);
  assert.equal(called, 1);
});
