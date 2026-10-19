import { randomUUID } from 'node:crypto';
import { transaction } from '../config/database.mjs';
import { HttpError } from '../lib/errors.mjs';

const columns = 'id, name, description, version, created_at AS createdAt, updated_at AS updatedAt';
const conflict = () => new HttpError(409, 'SPACE_CHANGED', 'Otra persona modificó este espacio. Conservá tu borrador y recargá la versión guardada antes de editar nuevamente.');

export function createSpacesRepository(pool) {
  async function admin(db, actorId) {
    // Comparte el bloqueo con la asignación de roles para comprobar el permiso al escribir.
    await db.execute("SELECT code FROM roles WHERE code = 'admin' FOR UPDATE");
    const [rows] = await db.execute(`SELECT u.id FROM users u JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.id = ? AND u.active = TRUE AND ur.role_code = 'admin' FOR UPDATE`, [actorId]);
    if (!rows.length) throw new HttpError(403, 'FORBIDDEN', 'Necesitás permiso de administrador.');
  }
  async function spaceRow(db, id, version) {
    const [rows] = await db.execute(`SELECT ${columns} FROM spaces WHERE id = ? AND archived_at IS NULL${version === undefined ? '' : ' FOR UPDATE'}`, [id]);
    if (!rows.length) throw new HttpError(404, 'SPACE_NOT_FOUND', 'No encontramos ese espacio.');
    if (version !== undefined && rows[0].version !== version) throw conflict();
    return rows[0];
  }
  async function detail(db, id, locking = false) {
    const space = await spaceRow(db, id);
    const [items] = await db.execute(`SELECT code AS id, type, x, y, rotation, width, height, text
      FROM furniture WHERE space_id = ? AND active = TRUE ORDER BY sort_order, code${locking ? ' FOR UPDATE' : ''}`, [id]);
    const [booths] = await db.execute(`SELECT b.id, b.furniture_code AS furnitureId, p.id AS projectId, p.name AS projectName
      FROM booths b LEFT JOIN booth_allocations a ON a.booth_id = b.id LEFT JOIN projects p ON p.id = a.project_id AND p.status = 'approved'
      WHERE b.space_id = ? AND b.active = TRUE ORDER BY b.furniture_code${locking ? ' FOR UPDATE' : ''}`, [id]);
    return { ...space, furniture: items.map(({ width, height, text, ...item }) => ({ ...item,
      ...(item.type === 'table' ? { width, height } : {}), ...(item.type === 'label' ? { text } : {}) })), booths };
  }
  async function referencedBooths(db, id) {
    const [rows] = await db.execute(`SELECT b.furniture_code AS code FROM booths b JOIN projects p ON p.requested_booth_id = b.id
      WHERE b.space_id = ? AND p.status <> 'cancelled' FOR UPDATE`, [id]);
    return rows;
  }
  return {
    async list() {
      const [rows] = await pool.execute(`SELECT ${columns},
        (SELECT COUNT(*) FROM furniture f WHERE f.space_id = spaces.id AND f.active = TRUE) AS furnitureCount,
        (SELECT COUNT(*) FROM booths b WHERE b.space_id = spaces.id AND b.active = TRUE) AS boothCount
        FROM spaces WHERE archived_at IS NULL ORDER BY created_at, id LIMIT 100`);
      return rows;
    },
    get: id => transaction(pool, db => detail(db, id)),
    create: (input, actorId) => transaction(pool, async db => {
      await admin(db, actorId);
      const [rows] = await db.execute('SELECT COUNT(*) AS count FROM spaces WHERE archived_at IS NULL');
      if (rows[0].count >= 100) throw new HttpError(409, 'SPACE_LIMIT', 'La exposición admite hasta 100 espacios activos.');
      const id = randomUUID();
      await db.execute('INSERT INTO spaces (id, name, description) VALUES (?, ?, ?)', [id, input.name, input.description]);
      return detail(db, id, true);
    }),
    save: (id, input, actorId) => transaction(pool, async db => {
      await admin(db, actorId);
      await spaceRow(db, id, input.version);
      const referenced = await referencedBooths(db, id);
      if (referenced.some(booth => !input.boothFurnitureIds.includes(booth.code)))
        throw new HttpError(409, 'SPACE_IN_USE', 'Hay proyectos vigentes asociados a esos puestos. Conservá sus mesas y habilitaciones.');
      const [existing] = await db.execute('SELECT code, type, active FROM furniture WHERE space_id = ? FOR UPDATE', [id]);
      for (const item of input.furniture) {
        const previous = existing.find(row => row.code === item.id);
        if (previous && (!previous.active || previous.type !== item.type))
          throw new HttpError(409, 'FURNITURE_ID_RESERVED', 'Ese código pertenece a otro elemento o a uno retirado. Agregá una pieza nueva sin reutilizarlo.');
      }
      // Dar de baja preserva identidades y permite referencias históricas en los próximos hitos.
      await db.execute('UPDATE booths SET active = FALSE WHERE space_id = ?', [id]);
      await db.execute('UPDATE furniture SET active = FALSE WHERE space_id = ?', [id]);
      if (input.furniture.length) {
        const values = input.furniture.flatMap((item, order) =>
          [id, item.id, item.type, item.x, item.y, item.rotation, item.width ?? null, item.height ?? null, item.text ?? null, order]);
        await db.execute(`INSERT INTO furniture (space_id, code, type, x, y, rotation, width, height, text, sort_order)
          VALUES ${input.furniture.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(',')} ON DUPLICATE KEY UPDATE
          x = VALUES(x), y = VALUES(y), rotation = VALUES(rotation), width = VALUES(width), height = VALUES(height),
          text = VALUES(text), sort_order = VALUES(sort_order), active = TRUE`, values);
      }
      if (input.boothFurnitureIds.length)
        await db.execute(`INSERT INTO booths (id, space_id, furniture_code)
          VALUES ${input.boothFurnitureIds.map(() => '(?, ?, ?)').join(',')} ON DUPLICATE KEY UPDATE active = TRUE`,
          input.boothFurnitureIds.flatMap(code => [randomUUID(), id, code]));
      await db.execute('UPDATE spaces SET name = ?, description = ?, version = version + 1, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [input.name, input.description, id]);
      return detail(db, id, true);
    }),
    archive: (id, version, actorId) => transaction(pool, async db => {
      await admin(db, actorId);
      await spaceRow(db, id, version);
      if ((await referencedBooths(db, id)).length)
        throw new HttpError(409, 'SPACE_IN_USE', 'Este espacio tiene proyectos vigentes. Primero deben cancelarse o trasladarse.');
      await db.execute('UPDATE booths SET active = FALSE WHERE space_id = ?', [id]);
      await db.execute('UPDATE furniture SET active = FALSE WHERE space_id = ?', [id]);
      await db.execute('UPDATE spaces SET archived_at = UTC_TIMESTAMP(3), updated_at = UTC_TIMESTAMP(3), version = version + 1 WHERE id = ?', [id]);
    }),
  };
}
