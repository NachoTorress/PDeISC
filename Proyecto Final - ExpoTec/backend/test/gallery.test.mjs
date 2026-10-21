import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createApp } from '../src/create-app.mjs';
import { galleryPhoto, galleryQuery, galleryReview } from '../src/validators/gallery.mjs';
import { memoryRepository, listen, testConfig } from './support.mjs';

const photo = { imageUrl: 'https://example.com/expo.jpg', caption: 'Un recuerdo de la exposición' };
test('galería: enlaces HTTPS, descripciones, decisiones y filtros estrictos', () => {
  assert.deepEqual(galleryPhoto({ imageUrl: ` ${photo.imageUrl} `, caption: ` ${photo.caption} ` }), photo);
  for (const body of [{ ...photo, imageUrl: 'javascript:alert(1)' }, { ...photo, imageUrl: 'http://example.com/foto.jpg' },
    { ...photo, imageUrl: 'https://user:password@example.com/foto.jpg' }, { ...photo, imageUrl: null },
    { ...photo, caption: 'Hola' }, { ...photo, caption: 'Una\nfoto' }, { ...photo, caption: 'x'.repeat(401) },
    { ...photo, authorId: randomUUID() }, { ...photo, status: 'approved' }])
    assert.throws(() => galleryPhoto(body), error => error.status === 400);
  assert.deepEqual(galleryQuery({}), { limit: 25, offset: 0 });
  assert.deepEqual(galleryQuery({}, true), { limit: 25, offset: 0, status: 'pending' });
  for (const body of [{ status: 'pending' }, { authorId: randomUUID() }, { limit: 101 }, { offset: -1 }])
    assert.throws(() => galleryQuery(body), error => error.status === 400);
  assert.throws(() => galleryQuery({ status: 'private' }, true), error => error.status === 400);
  assert.deepEqual(galleryReview({ version: 1, decision: 'approved' }), { version: 1, decision: 'approved', note: '' });
  for (const body of [{ version: 0, decision: 'approved' }, { version: 1, decision: 'pending' },
    { version: 1, decision: 'rejected', note: 'breve' }, { version: 1, decision: 'approved', note: 4 },
    { version: 1, decision: 'approved', actorId: randomUUID() }])
    assert.throws(() => galleryReview(body), error => error.status === 400);
});

test('galería: visitante consulta, invitado aporta, solo administración modera', async t => {
  const auth = memoryRepository(), calls = [];
  const id = randomUUID();
  const repository = {
    async publicList(page) { calls.push(['public', page]); return []; },
    async mine(page, actor) { calls.push(['mine', page, actor]); return []; },
    async moderation(page) { calls.push(['moderation', page]); return []; },
    async submit(input, actor) { calls.push(['submit', input, actor]); return { id, status: 'pending', version: 1 }; },
    async review(key, input, actor) { calls.push(['review', key, input, actor]); return { id: key, status: input.decision, version: 2 }; },
  };
  const api = await listen(createApp(auth, testConfig, console, undefined, undefined, undefined, undefined, undefined, repository));
  t.after(api.close);
  assert.equal((await api.request('/api/gallery/public/query')).status, 200);
  for (const route of ['mine/query', 'submit', 'moderation/query', `${id}/review`])
    assert.equal((await api.request(`/api/gallery/${route}`)).status, 401);
  const account = { firstName: 'Ana', lastName: 'García', email: 'guest@example.com', password: 'Una contraseña larga 2026', accountType: 'guest' };
  for (const type of ['admin', 'teacher', 'loans', '', null])
    assert.equal((await api.request('/api/auth/register', { ...account, accountType: type })).status, 400);
  const registration = await api.request('/api/auth/register', account);
  assert.equal(registration.status, 201);
  const { user, accessToken } = registration.body;
  assert.deepEqual(user.roles, ['guest']);
  assert.equal(user.passwordHash, undefined);
  assert.equal((await api.request('/api/admin/users/query', {}, accessToken)).status, 403);
  assert.equal((await api.request('/api/gallery/mine/query', {}, accessToken)).status, 200);
  assert.deepEqual(calls.at(-1), ['mine', { limit: 25, offset: 0 }, user.id]);
  assert.equal((await api.request('/api/gallery/mine/query', { authorId: randomUUID() }, accessToken)).status, 400);
  const submitted = await api.request('/api/gallery/submit', photo, accessToken);
  assert.equal(submitted.status, 201);
  assert.equal(submitted.body.photo.status, 'pending');
  assert.deepEqual(calls.at(-1), ['submit', photo, user.id]);
  assert.equal((await api.request('/api/gallery/submit', { ...photo, status: 'approved' }, accessToken)).status, 400);
  assert.equal((await api.request('/api/gallery/moderation/query', {}, accessToken)).status, 403);
  assert.equal((await api.request(`/api/gallery/${id}/review`, { version: 1, decision: 'approved' }, accessToken)).status, 403);
  auth.users.get(user.id).roles.push('admin');
  assert.equal((await api.request('/api/gallery/moderation/query', {}, accessToken)).status, 200);
  assert.equal((await api.request(`/api/gallery/${id}/review`, { version: 1, decision: 'approved' }, accessToken)).status, 200);
  assert.deepEqual(calls.at(-1), ['review', id, { version: 1, decision: 'approved', note: '' }, user.id]);
  auth.users.get(user.id).roles = ['guest'];
  assert.equal((await api.request(`/api/gallery/${id}/review`, { version: 2, decision: 'rejected', note: 'Retirada para revisar' }, accessToken)).status, 403);
  auth.consumeRate = async () => 60;
  const limited = await api.request('/api/gallery/submit', photo, accessToken);
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '60');
});
