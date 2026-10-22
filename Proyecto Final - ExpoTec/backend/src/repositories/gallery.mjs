import { randomUUID } from 'node:crypto';
import { transaction } from '../config/database.mjs';
import { HttpError } from '../lib/errors.mjs';
import { assertOwnedImage } from './uploads.mjs';

const columns = `p.id, p.image_url AS imageUrl, p.caption,
  CONCAT(u.first_name, ' ', u.last_name) AS authorName, p.created_at AS createdAt`;
const privateColumns = `p.status, p.version, p.updated_at AS updatedAt, COALESCE(r.note, '') AS reviewNote`;

export function createGalleryRepository(pool) {
  async function member(db, actorId, admin = false) {
    if (admin) await db.execute("SELECT code FROM roles WHERE code = 'admin' FOR UPDATE");
    const [rows] = await db.execute(`SELECT id FROM users WHERE id = ? AND active = TRUE FOR UPDATE`, [actorId]);
    if (!rows.length) throw new HttpError(403, 'FORBIDDEN', 'La cuenta no está activa.');
    if (admin) {
      const [assigned] = await db.execute("SELECT user_id FROM user_roles WHERE user_id = ? AND role_code = 'admin' FOR UPDATE", [actorId]);
      if (!assigned.length) throw new HttpError(403, 'FORBIDDEN', 'Necesitás permiso de administrador.');
    }
  }
  async function list({ limit, offset, status }, authorId, publicView = false) {
    const conditions = [], values = [];
    if (publicView) conditions.push("p.status = 'approved'");
    if (authorId) { conditions.push('p.author_id = ?'); values.push(authorId); }
    if (status && status !== 'all') { conditions.push('p.status = ?'); values.push(status); }
    const [rows] = await pool.query(`SELECT ${columns}${publicView ? '' : `, ${privateColumns}`}
      FROM gallery_photos p JOIN users u ON u.id = p.author_id
      ${publicView ? '' : 'LEFT JOIN gallery_reviews r ON r.photo_id = p.id AND r.photo_version = p.version'}
      ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?`, [...values, limit, offset]);
    return rows;
  }
  return {
    publicList: page => list(page, null, true),
    mine: (page, actorId) => list(page, actorId),
    moderation: page => list(page),
    async submit(input, actorId) {
      return transaction(pool, async db => {
        await member(db, actorId);
        await assertOwnedImage(db, input.imageUrl, actorId, 'gallery');
        const [pending] = await db.execute("SELECT id FROM gallery_photos WHERE author_id = ? AND status = 'pending' FOR UPDATE", [actorId]);
        if (pending.length >= 20) throw new HttpError(409, 'GALLERY_PENDING_LIMIT', 'Ya tenés 20 fotos pendientes. Esperá a que la organización las revise.');
        const id = randomUUID();
        await db.execute('INSERT INTO gallery_photos (id, author_id, image_url, caption) VALUES (?, ?, ?, ?)', [id, actorId, input.imageUrl, input.caption]);
        return { id, status: 'pending', version: 1 };
      });
    },
    async review(id, input, actorId) {
      return transaction(pool, async db => {
        await member(db, actorId, true);
        const [rows] = await db.execute('SELECT status, version FROM gallery_photos WHERE id = ? FOR UPDATE', [id]);
        if (!rows.length) throw new HttpError(404, 'PHOTO_NOT_FOUND', 'No encontramos esa foto.');
        if (rows[0].version !== input.version)
          throw new HttpError(409, 'PHOTO_CHANGED', 'Otra persona revisó esta foto. Actualizá la lista antes de decidir nuevamente.');
        if (rows[0].status === input.decision)
          throw new HttpError(409, 'PHOTO_ALREADY_REVIEWED', 'La foto ya tiene ese estado. Actualizá la lista.');
        const version = input.version + 1;
        await db.execute('UPDATE gallery_photos SET status = ?, version = ?, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [input.decision, version, id]);
        await db.execute('INSERT INTO gallery_reviews (id, photo_id, actor_id, photo_version, decision, note) VALUES (?, ?, ?, ?, ?, ?)', [randomUUID(), id, actorId, version, input.decision, input.note]);
        return { id, status: input.decision, version };
      });
    },
  };
}
