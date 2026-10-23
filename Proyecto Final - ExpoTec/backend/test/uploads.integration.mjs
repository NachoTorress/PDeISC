import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { put as clientPut } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { createDatabase } from '../src/config/database.mjs';
import { createAuthRepository } from '../src/repositories/auth.mjs';
import { createGalleryRepository } from '../src/repositories/gallery.mjs';
import { createUploadsRepository } from '../src/repositories/uploads.mjs';
import { createApp } from '../src/create-app.mjs';
import { migrate } from '../scripts/migrations.mjs';
import { listen, testConfig } from './support.mjs';
import { createRequire } from 'node:module';

const database = process.env.TEST_DB_NAME;
test('TiDB y Blob privado: carga real, validación, propiedad, moderación y limpieza', {
  skip: !database || !process.env.BLOB_READ_WRITE_TOKEN ? 'Requiere base exclusiva TEST_DB_NAME y Blob de pruebas configurado.' : false,
}, async t => {
  assert.match(database, /^expotec_test_[a-z0-9_]+$/); assert.notEqual(database, process.env.DB_NAME);
  const nativeRequire = createRequire(new URL('../../frontend/native/package.json', import.meta.url));
  nativeRequire('tsx/cjs');
  const { photoUploadRequest } = nativeRequire('./src/lib/blobUpload.ts');
  const pool = createDatabase({ ...process.env, DB_NAME: database, VERCEL: '0' }), users = [], paths = [];
  t.after(async () => {
    if (paths.length) await del(paths);
    for (const id of users) {
      await pool.execute('DELETE FROM gallery_reviews WHERE photo_id IN (SELECT id FROM gallery_photos WHERE author_id = ?)', [id]);
      await pool.execute('DELETE FROM gallery_photos WHERE author_id = ?', [id]);
      await pool.execute('DELETE FROM image_uploads WHERE owner_id = ?', [id]);
      await pool.execute('DELETE FROM refresh_tokens WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)', [id]);
      await pool.execute('DELETE FROM sessions WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    }
    await pool.end();
  });
  await migrate(pool);
  const uploads = createUploadsRepository(pool), auth = createAuthRepository(pool);
  const config = { ...testConfig, social: { webOrigin: 'https://upload-test.example', providers: {} } };
  const api = await listen(createApp(auth, config, console, undefined, undefined, undefined, undefined, undefined, createGalleryRepository(pool), undefined, undefined, uploads));
  t.after(api.close);
  async function register() {
    const result = await api.request('/api/auth/register', { firstName: 'Prueba', lastName: 'Fotos', email: `upload-${randomUUID()}@example.com`, password: 'Contraseña de prueba 2026', accountType: 'guest' });
    assert.equal(result.status, 201); users.push(result.body.user.id); return result.body;
  }
  const owner = await register(), other = await register(), admin = await register();
  await pool.execute("INSERT INTO user_roles (user_id, role_code) VALUES (?, 'admin')", [admin.user.id]);
  const bytes = await sharp({ create: { width: 1800, height: 300, channels: 3, background: '#316d4c' } }).png().toBuffer();
  const preparedBytes = await sharp(bytes).resize({ width: 1600 }).jpeg({ quality: 85 }).toBuffer();
  const prepared = await api.request('/api/uploads/prepare', { purpose: 'gallery', contentType: 'image/jpeg', size: preparedBytes.length }, owner.accessToken);
  assert.equal(prepared.status, 201, JSON.stringify(prepared.body));
  const image = await uploads.get(prepared.body.id); paths.push(image.rawPath, image.imagePath);
  // El mismo destino y encabezados del cliente Android, con bytes JPEG reales.
  const nativeRequest = photoUploadRequest(prepared.body.pathname, prepared.body.clientToken, { type: 'image/jpeg', size: preparedBytes.length });
  const nativeResponse = await fetch(nativeRequest.url, { method: 'PUT', body: preparedBytes, headers: nativeRequest.headers });
  assert.ok(nativeResponse.ok, `Transporte Android: HTTP ${nativeResponse.status}`);
  const raw = await nativeResponse.json();
  assert([401,403,404].includes((await fetch(raw.url)).status), 'El objeto privado no se puede leer sin autorización');
  assert.equal((await api.request('/api/uploads/complete', { id: image.id }, other.accessToken)).status, 404);
  const completed = await api.request('/api/uploads/complete', { id: image.id }, owner.accessToken);
  assert.equal(completed.status, 200, JSON.stringify(completed.body));
  assert.equal((await api.request('/api/uploads/complete', { id: image.id }, owner.accessToken)).status, 200);
  const body = { imageUrl: completed.body.imageUrl };
  assert.equal((await api.request('/api/uploads/preview', body, owner.accessToken)).status, 200);
  assert.equal((await api.request('/api/uploads/preview', body, admin.accessToken)).status, 200);
  assert.equal((await api.request('/api/uploads/preview', body, other.accessToken)).status, 404);
  assert.equal((await fetch(`${api.base}/api/uploads/${image.id}/image`)).status, 404);
  const payload = { ...body, caption: 'Foto controlada para probar la moderación.' };
  assert.equal((await api.request('/api/gallery/submit', payload, other.accessToken)).status, 400);
  const submitted = await api.request('/api/gallery/submit', payload, owner.accessToken);
  assert.equal(submitted.status, 201, JSON.stringify(submitted.body));
  const photoId = submitted.body.photo.id;
  assert.equal((await fetch(`${api.base}/api/uploads/${image.id}/image`)).status, 404);
  assert.equal((await api.request(`/api/gallery/${photoId}/review`, { decision: 'approved', version: 1 }, admin.accessToken)).status, 200);
  const published = await fetch(`${api.base}/api/uploads/${image.id}/image`);
  assert.equal(published.status, 200); assert.equal(published.headers.get('content-type'), 'image/jpeg');
  const info = await sharp(Buffer.from(await published.arrayBuffer())).metadata();
  assert.equal(info.width, 1600); assert.equal(info.exif, undefined);
  assert.equal((await api.request(`/api/gallery/${photoId}/review`, { decision: 'rejected', version: 2, note: 'Retirar esta imagen controlada de prueba.' }, admin.accessToken)).status, 200);
  assert.equal((await fetch(`${api.base}/api/uploads/${image.id}/image`)).status, 404);
  const fake = await api.request('/api/uploads/prepare', { purpose: 'gallery', contentType: 'image/png', size: 4 }, owner.accessToken);
  const bad = await uploads.get(fake.body.id); paths.push(bad.rawPath, bad.imagePath);
  await clientPut(bad.rawPath, Buffer.from('fake'), { access: 'private', token: fake.body.clientToken, contentType: 'image/png' });
  assert.equal((await api.request('/api/uploads/complete', { id: bad.id }, owner.accessToken)).status, 422);
  await pool.execute('UPDATE image_uploads SET updated_at = UTC_TIMESTAMP(3) - INTERVAL 8 DAY WHERE owner_id = ?', [owner.user.id]);
  const cleaned = [];
  await uploads.prune(async obsolete => { cleaned.push(...obsolete); await del(obsolete); });
  assert(cleaned.includes(bad.rawPath)); assert(!cleaned.includes(image.imagePath), 'Conserva las fotos referenciadas incluso si fueron rechazadas');
});
