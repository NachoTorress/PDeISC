import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { createUploadsService, optimizeImage, maximumImageBytes } from '../src/services/uploads.mjs';
import { assertOwnedImage } from '../src/repositories/uploads.mjs';
import { createApp } from '../src/create-app.mjs';
import { memoryRepository, testConfig, listen } from './support.mjs';

function uploads() {
  const images = new Map(), published = new Set();
  return { images, published,
    create: async image => images.set(image.id, { ...image, status: 'started' }),
    get: async id => images.get(id),
    claim: async (id, userId) => { const image = images.get(id); if (!image || image.ownerId !== userId || image.status !== 'started') return false; image.status = 'processing'; return true; },
    finish: async (id, state) => { images.get(id).status = state; },
    mayRead: async (image, user) => image.ownerId === user.id || user.roles.includes('admin'),
    publicImage: async id => published.has(id) ? images.get(id) : undefined,
  };
}
const person = () => ({ id: randomUUID(), roles: ['student'] });
const config = { ...testConfig, origins: ['https://expotec.example'] };
const photo = () => sharp({ create: { width: 1900, height: 100, channels: 3, background: '#336b4b' } }).png().toBuffer();
test('fotos: valida contenido real, limita píxeles y elimina metadatos al convertir a JPEG', async () => {
  const result = await optimizeImage(await photo());
  const info = await sharp(result).metadata();
  assert.equal(info.format, 'jpeg'); assert.equal(info.width, 1600); assert.equal(info.exif, undefined);
  for (const bytes of [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), Buffer.from('fake JPEG'), Buffer.alloc(maximumImageBytes + 1)])
    await assert.rejects(() => optimizeImage(bytes), error => error.status === 422);
});
test('fotos: token corto limitado al archivo, propietario y uso; solo publica después de aprobación', async () => {
  const repository = uploads(), objects = new Map(), tokens = [], owner = person(), other = person();
  const storage = { enabled: () => true, token: async options => { tokens.push(options); return 'short-lived-token'; }, read: async path => objects.get(path),
    write: async (path, bytes) => { objects.set(path, bytes); }, remove: async paths => paths.forEach(path => objects.delete(path)) };
  const service = createUploadsService(repository, config, storage);
  for (const body of [{ purpose: 'gallery', contentType: 'image/svg+xml', size: 20 }, { purpose: 'other', contentType: 'image/jpeg', size: 20 }, { purpose: 'gallery', contentType: 'image/jpeg', size: maximumImageBytes + 1 }])
    await assert.rejects(() => service.prepare(body, owner), error => error.status === 422);
  const started = await service.prepare({ purpose: 'gallery', contentType: 'image/png', size: 1000 }, owner);
  assert.equal(tokens[0].allowOverwrite, false); assert.equal(tokens[0].addRandomSuffix, false);
  assert.deepEqual(tokens[0].allowedContentTypes, ['image/png']); assert.equal(tokens[0].maximumSizeInBytes, maximumImageBytes);
  assert(tokens[0].validUntil < Date.now() + 11 * 60_000); assert(started.pathname.includes(owner.id));
  objects.set(started.pathname, await photo());
  await assert.rejects(() => service.complete({ id: started.id }, other), error => error.status === 404);
  const [a, b] = await Promise.allSettled([service.complete({ id: started.id }, owner), service.complete({ id: started.id }, owner)]);
  assert.equal([a,b].filter(r => r.status === 'fulfilled').length, 1);
  const imageUrl = repository.images.get(started.id).imageUrl;
  assert.deepEqual(await service.complete({ id: started.id }, owner), { imageUrl });
  assert(!objects.has(started.pathname));
  await assert.rejects(() => service.publicImage(started.id), error => error.status === 404);
  await assert.rejects(() => service.preview({ imageUrl }, other), error => error.status === 404);
  assert.match((await service.preview({ imageUrl }, owner)).image, /^data:image\/jpeg;base64,/);
  repository.published.add(started.id);
  assert(Buffer.isBuffer(await service.publicImage(started.id)));
  repository.published.delete(started.id);
  await assert.rejects(() => service.publicImage(started.id), error => error.status === 404);
});
test('fotos: el archivo falso falla cerrado y se retira; un enlace ajeno no permite apropiarse de una foto', async () => {
  const repository = uploads(), owner = person(), removed = [];
  const service = createUploadsService(repository, config, { enabled: () => true, token: async () => 'token', read: async () => Buffer.from('fake'), remove: async paths => removed.push(...paths) });
  const started = await service.prepare({ purpose: 'project', contentType: 'image/jpeg', size: 5 }, owner);
  await assert.rejects(() => service.complete({ id: started.id }, owner), error => error.status === 422);
  assert.equal(repository.images.get(started.id).status, 'failed'); assert(removed.includes(started.pathname));
  const imageUrl = `https://expotec.example/api/uploads/${randomUUID()}/image`;
  const row = { ownerId: owner.id, purpose: 'project', imageUrl, status: 'ready' };
  const db = { execute: async () => [[row]] };
  await assertOwnedImage(db, 'https://external.example/image.jpg', person().id, 'project');
  await assert.rejects(() => assertOwnedImage(db, imageUrl, person().id, 'project'), error => error.code === 'IMAGE_NOT_AVAILABLE');
  await assert.rejects(() => assertOwnedImage(db, imageUrl, owner.id, 'gallery'), error => error.code === 'IMAGE_NOT_AVAILABLE');
  await assertOwnedImage(db, imageUrl, person().id, 'project', imageUrl);
});
test('fotos HTTP: ninguna operación de carga ni vista privada admite visitantes', async t => {
  const api = await listen(createApp(memoryRepository(), testConfig, console, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, uploads(), { enabled: () => true }));
  t.after(api.close);
  for (const route of ['prepare', 'complete', 'preview']) assert.equal((await api.request(`/api/uploads/${route}`, {})).status, 401);
  const result = await api.request(`/api/uploads/${randomUUID()}/image`, {}, undefined, { method: 'GET' });
  assert.equal(result.status, 404);
});
