/**
 * Prueba de integración contra una base MySQL/TiDB exclusiva (TEST_DB_NAME): galería con moderación y versiones.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createDatabase } from '../src/config/database.mjs';
import { createAuthRepository } from '../src/repositories/auth.mjs';
import { createGalleryRepository } from '../src/repositories/gallery.mjs';
import { createApp } from '../src/create-app.mjs';
import { migrate } from '../scripts/migrations.mjs';
import { listen, testConfig } from './support.mjs';

const database = process.env.TEST_DB_NAME;
test('TiDB: invitados, privacidad de fotos, moderación atómica, retiro y límites de pendientes', {
  skip: !database ? 'Configurá TEST_DB_NAME con una base exclusiva de pruebas.' : false,
}, async t => {
  assert.match(database, /^expotec_test_[a-z0-9_]+$/);
  assert.notEqual(database, process.env.DB_NAME);
  const pool = createDatabase({ ...process.env, DB_NAME: database, VERCEL: '0' });
  const ids = [];
  t.after(async () => {
    for (const id of ids) {
      await pool.execute('DELETE FROM gallery_reviews WHERE photo_id IN (SELECT id FROM gallery_photos WHERE author_id = ?)', [id]);
      await pool.execute('DELETE FROM gallery_photos WHERE author_id = ?', [id]);
      await pool.execute('DELETE FROM refresh_tokens WHERE session_id IN (SELECT id FROM sessions WHERE user_id = ?)', [id]);
      await pool.execute('DELETE FROM sessions WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
      await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    }
    await pool.end();
  });
  await migrate(pool);
  await migrate(pool);
  const auth = createAuthRepository(pool), gallery = createGalleryRepository(pool);
  const api = await listen(createApp(auth, testConfig, console, undefined, undefined, undefined, undefined, undefined, gallery));
  t.after(api.close);
  async function register(type) {
    const result = await api.request('/api/auth/register', { firstName: 'Lucía', lastName: 'Prueba', email: `gallery-${randomUUID()}@example.com`, password: 'Contraseña de prueba 2026', ...(type ? { accountType: type } : {}) });
    assert.equal(result.status, 201, JSON.stringify(result.body));
    ids.push(result.body.user.id);
    return result.body;
  }
  const guest = await register('guest'), other = await register('guest'), admin = await register();
  assert.deepEqual(guest.user.roles, ['guest']);
  assert.deepEqual(admin.user.roles, ['student']);
  await pool.execute("INSERT INTO user_roles (user_id, role_code) VALUES (?, 'admin')", [admin.user.id]);
  assert.equal((await api.request('/api/admin/users/query', {}, guest.accessToken)).status, 403);
  const input = { imageUrl: 'https://example.com/expo.jpg', caption: 'Un recuerdo de la ExpoTec' };
  const submitted = await api.request('/api/gallery', input, guest.accessToken);
  assert.equal(submitted.status, 201, JSON.stringify(submitted.body));
  const id = submitted.body.photo.id;
  const publicPhotos = async () => (await api.request('/api/gallery/public/query', { limit: 100 })).body.photos;
  assert.equal((await publicPhotos()).some(photo => photo.id === id), false);
  assert.equal((await api.request('/api/gallery/mine/query', {}, other.accessToken)).body.photos.some(photo => photo.id === id), false);
  const own = (await api.request('/api/gallery/mine/query', {}, guest.accessToken)).body.photos.find(photo => photo.id === id);
  assert.equal(own.status, 'pending');
  assert.equal(own.version, 1);
  assert.equal((await api.request('/api/gallery/moderation/query', {}, guest.accessToken)).status, 403);
  assert.equal((await api.patch(`/api/gallery/${id}`, { version: 1, decision: 'approved' }, guest.accessToken)).status, 403);
  const concurrent = await Promise.all([
    api.patch(`/api/gallery/${id}`, { version: 1, decision: 'approved' }, admin.accessToken),
    api.patch(`/api/gallery/${id}`, { version: 1, decision: 'rejected', note: 'Revisar esta imagen antes de publicar' }, admin.accessToken),
  ]);
  assert.deepEqual(concurrent.map(result => result.status).sort(), [200, 409]);
  let [[current]] = await pool.execute('SELECT status, version FROM gallery_photos WHERE id = ?', [id]);
  const [[count]] = await pool.execute('SELECT COUNT(*) AS count FROM gallery_reviews WHERE photo_id = ?', [id]);
  assert.equal(count.count, 1);
  if (current.status !== 'approved') {
    const approval = await api.patch(`/api/gallery/${id}`, { version: current.version, decision: 'approved' }, admin.accessToken);
    assert.equal(approval.status, 200);
    current = approval.body.photo;
  }
  const published = (await publicPhotos()).find(photo => photo.id === id);
  assert.ok(published);
  assert.deepEqual(Object.keys(published).sort(), ['id', 'imageUrl', 'caption', 'authorName', 'createdAt'].sort());
  assert.equal(JSON.stringify(published).includes(guest.user.email), false);
  assert.equal((await api.request('/api/gallery/public/query', { status: 'pending' })).status, 400);
  const note = 'Retirada para revisar la foto enviada';
  const removed = await api.patch(`/api/gallery/${id}`, { version: current.version, decision: 'rejected', note }, admin.accessToken);
  assert.equal(removed.status, 200);
  assert.equal((await publicPhotos()).some(photo => photo.id === id), false);
  assert.equal((await api.request('/api/gallery/mine/query', {}, guest.accessToken)).body.photos.find(photo => photo.id === id).reviewNote, note);
  const stale = await api.patch(`/api/gallery/${id}`, { version: 1, decision: 'approved' }, admin.accessToken);
  assert.equal(stale.status, 409);
  await pool.execute("DELETE FROM user_roles WHERE user_id = ? AND role_code = 'admin'", [admin.user.id]);
  await assert.rejects(gallery.review(id, { version: removed.body.photo.version, decision: 'approved', note: '' }, admin.user.id), error => error.status === 403);
  // Los dos envíos compiten por la última plaza pendiente, bajo el bloqueo de su autor.
  for (let index = 0; index < 19; index++)
    await pool.execute('INSERT INTO gallery_photos (id, author_id, image_url, caption) VALUES (?, ?, ?, ?)', [randomUUID(), other.user.id, input.imageUrl, input.caption]);
  const finalSlot = await Promise.allSettled([gallery.submit(input, other.user.id), gallery.submit(input, other.user.id)]);
  assert.equal(finalSlot.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(finalSlot.find(result => result.status === 'rejected').reason.code, 'GALLERY_PENDING_LIMIT');
  const [[pending]] = await pool.execute("SELECT COUNT(*) AS count FROM gallery_photos WHERE author_id = ? AND status = 'pending'", [other.user.id]);
  assert.equal(pending.count, 20);
  const page1 = await api.request('/api/gallery/mine/query', { limit: 10, offset: 0 }, other.accessToken);
  const page2 = await api.request('/api/gallery/mine/query', { limit: 10, offset: 10 }, other.accessToken);
  assert.equal(new Set([...page1.body.photos, ...page2.body.photos].map(photo => photo.id)).size, 20);
});
