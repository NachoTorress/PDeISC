import { HttpError } from '../lib/errors.mjs';
import { transaction } from '../config/database.mjs';

export function managedImageId(value) {
  if (typeof value !== 'string') return null;
  try { return /^\/api\/uploads\/([a-f0-9-]{36})\/image$/.exec(new URL(value).pathname)?.[1] ?? null; }
  catch { return null; }
}

export async function assertOwnedImage(db, imageUrl, ownerId, purpose, existingUrl) {
  const id = managedImageId(imageUrl);
  if (!id) return;
  const [rows] = await db.execute('SELECT owner_id AS ownerId, purpose, image_url AS imageUrl, status FROM image_uploads WHERE id = ? FOR UPDATE', [id]);
  const image = rows[0];
  if (!image || image.imageUrl !== imageUrl || image.status !== 'ready' || image.purpose !== purpose ||
      (image.ownerId !== ownerId && imageUrl !== existingUrl))
    throw new HttpError(400, 'IMAGE_NOT_AVAILABLE', 'Volvé a subir la foto desde esta cuenta.', { imageUrl: 'Esta foto no está disponible para este aporte.' });
}

const columns = 'id, owner_id AS ownerId, purpose, raw_path AS rawPath, image_path AS imagePath, image_url AS imageUrl, status';
const referenced = `EXISTS (SELECT 1 FROM gallery_photos g WHERE g.image_url = i.image_url)
  OR EXISTS (SELECT 1 FROM projects p WHERE p.image_url = i.image_url)`;
export function createUploadsRepository(pool) {
  return {
    async create(image) {
      await pool.execute(`INSERT INTO image_uploads (id, owner_id, purpose, raw_path, image_path, image_url) VALUES (?, ?, ?, ?, ?, ?)`,
        [image.id, image.ownerId, image.purpose, image.rawPath, image.imagePath, image.imageUrl]);
    },
    async get(id) { const [rows] = await pool.execute(`SELECT ${columns} FROM image_uploads WHERE id = ?`, [id]); return rows[0]; },
    async claim(id, ownerId) {
      const [result] = await pool.execute("UPDATE image_uploads SET status = 'processing', updated_at = UTC_TIMESTAMP(3) WHERE id = ? AND owner_id = ? AND status = 'started' AND created_at > UTC_TIMESTAMP(3) - INTERVAL 15 MINUTE", [id, ownerId]);
      return result.affectedRows === 1;
    },
    async finish(id, status) { await pool.execute('UPDATE image_uploads SET status = ?, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [status, id]); },
    async publicImage(id) {
      const [rows] = await pool.execute(`SELECT ${columns} FROM image_uploads i WHERE id = ? AND status = 'ready' AND (
        EXISTS (SELECT 1 FROM gallery_photos g WHERE g.image_url = i.image_url AND g.status = 'approved') OR
        EXISTS (SELECT 1 FROM projects p WHERE p.image_url = i.image_url AND p.status = 'approved'))`, [id]);
      return rows[0];
    },
    async mayRead(image, user) {
      if (image.ownerId === user.id || user.roles.includes('admin')) return true;
      const [rows] = await pool.execute(`SELECT p.id FROM projects p WHERE p.image_url = ? AND (
        EXISTS (SELECT 1 FROM project_members m WHERE m.project_id = p.id AND m.user_id = ?) OR
        EXISTS (SELECT 1 FROM project_teachers t WHERE t.project_id = p.id AND t.user_id = ?)) LIMIT 1`, [image.imageUrl, user.id, user.id]);
      return rows.length > 0;
    },
    async prune(remove) {
      const [rows] = await pool.query(`SELECT id FROM image_uploads i WHERE updated_at < UTC_TIMESTAMP(3) - INTERVAL 7 DAY AND NOT (${referenced}) LIMIT 100`);
      for (const { id } of rows) await transaction(pool, async db => {
        const [current] = await db.execute(`SELECT ${columns} FROM image_uploads i WHERE id = ? AND updated_at < UTC_TIMESTAMP(3) - INTERVAL 7 DAY AND NOT (${referenced}) FOR UPDATE`, [id]);
        if (!current.length) return;
        await remove([current[0].rawPath, current[0].imagePath]);
        await db.execute('DELETE FROM image_uploads WHERE id = ?', [id]);
      });
      return rows.length;
    },
  };
}
