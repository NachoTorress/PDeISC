import { randomUUID } from 'node:crypto';
import { transaction } from '../config/database.mjs';
import { HttpError, unauthorized } from '../lib/errors.mjs';

const forbidden = () => new HttpError(403, 'FORBIDDEN', 'No tenés permiso para consultar o modificar el inventario.');
const missing = () => new HttpError(404, 'RESOURCE_NOT_FOUND', 'No encontramos ese elemento.');
const columns = 'r.id, r.name, r.description, r.total, r.version, r.created_at AS createdAt, r.updated_at AS updatedAt, r.archived_at AS archivedAt';
async function allocations(db, ids, locking = false) {
  if (!ids.length) return [];
  const [rows] = await db.execute(`SELECT resource_id AS resourceId, quantity FROM resource_allocations
    WHERE resource_id IN (${ids.map(() => '?').join(',')}) ORDER BY resource_id, project_id${locking ? ' FOR UPDATE' : ''}`, ids);
  return rows;
}
const reserved = (rows, id) => rows.filter(row => row.resourceId === id).reduce((sum, row) => sum + row.quantity, 0);

export function createInventoryRepository(pool) {
  async function actor(db, id, writing = false, catalog = false) {
    if (writing) await db.execute("SELECT code FROM roles WHERE code = 'admin' FOR UPDATE");
    const [rows] = await db.execute(`SELECT ur.role_code AS role FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.id = ? AND u.active = TRUE${writing ? ' FOR UPDATE' : ''}`, [id]);
    if (!rows.length) throw unauthorized();
    const allowed = writing ? ['admin'] : catalog ? ['student', 'teacher', 'loans', 'admin'] : ['admin', 'loans'];
    if (!rows.some(row => allowed.includes(row.role))) throw forbidden();
  }
  async function row(db, id, locking = false) {
    const [rows] = await db.execute(`SELECT ${columns} FROM resources r WHERE r.id = ?${locking ? ' FOR UPDATE' : ''}`, [id]);
    if (!rows.length) throw missing();
    return rows[0];
  }
  async function detail(db, id, locking = false) {
    const resource = await row(db, id, locking);
    const used = reserved(await allocations(db, [id], locking), id);
    const [events] = await db.execute(`SELECT e.id, e.action, e.previous_total AS previousTotal, e.total, e.created_at AS createdAt,
      u.first_name AS firstName, u.last_name AS lastName FROM inventory_events e JOIN users u ON u.id = e.actor_id
      WHERE e.resource_id = ? ORDER BY e.created_at DESC, e.id DESC LIMIT 100${locking ? ' FOR UPDATE' : ''}`, [id]);
    return { ...resource, reserved: used, available: resource.total - used, events };
  }
  function editable(resource, version) {
    if (resource.archivedAt) throw new HttpError(409, 'RESOURCE_ARCHIVED', 'Ese elemento fue dado de baja.');
    if (resource.version !== version) throw new HttpError(409, 'RESOURCE_CHANGED', 'Otra persona modificó este elemento. El borrador se conservó. Descartalo y recargá para revisar la versión actual.');
  }
  async function uniqueName(db, name, id = '') {
    const [rows] = await db.execute('SELECT id FROM resources WHERE name = ? AND id <> ? FOR UPDATE', [name, id]);
    if (rows.length) throw new HttpError(409, 'RESOURCE_NAME_EXISTS', 'Ya existe un elemento con ese nombre, incluso entre las bajas.', { name: 'Elegí otro nombre o revisá los elementos dados de baja.' });
  }
  async function event(db, resourceId, actorId, action, previousTotal, total) {
    await db.execute('INSERT INTO inventory_events (id, resource_id, actor_id, action, previous_total, total) VALUES (?, ?, ?, ?, ?, ?)', [randomUUID(), resourceId, actorId, action, previousTotal, total]);
  }
  return {
    list: (input, viewerId, catalog = false) => transaction(pool, async db => {
      await actor(db, viewerId, false, catalog);
      const [rows] = await db.query(`SELECT ${columns}, COALESCE(a.reserved, 0) AS reserved,
        r.total - COALESCE(a.reserved, 0) AS available FROM resources r
        LEFT JOIN (SELECT resource_id, SUM(quantity) AS reserved FROM resource_allocations GROUP BY resource_id) a ON a.resource_id = r.id
        WHERE r.archived_at IS ${input.archived && !catalog ? 'NOT ' : ''}NULL ORDER BY r.name, r.id LIMIT ? OFFSET ?`, [catalog ? 500 : input.limit, catalog ? 0 : input.offset]);
      return rows.map(row => ({ ...row, reserved: Number(row.reserved), available: Number(row.available) }));
    }),
    get: (id, viewerId) => transaction(pool, async db => { await actor(db, viewerId); return detail(db, id); }),
    create: (input, actorId) => transaction(pool, async db => {
      await actor(db, actorId, true);
      const [active] = await db.execute('SELECT id FROM resources WHERE archived_at IS NULL FOR UPDATE');
      if (active.length >= 500) throw new HttpError(409, 'RESOURCE_LIMIT', 'El inventario admite hasta 500 elementos activos.');
      await uniqueName(db, input.name);
      const id = randomUUID();
      await db.execute('INSERT INTO resources (id, name, description, total) VALUES (?, ?, ?, ?)', [id, input.name, input.description, input.total]);
      await event(db, id, actorId, 'create', null, input.total);
      return detail(db, id, true);
    }),
    save: (id, input, actorId) => transaction(pool, async db => {
      await actor(db, actorId, true);
      const resource = await row(db, id, true);
      editable(resource, input.version);
      await uniqueName(db, input.name, id);
      const used = reserved(await allocations(db, [id], true), id);
      if (input.total < used) throw new HttpError(409, 'RESOURCE_RESERVED', `Hay ${used} unidades reservadas. El total no puede ser menor.`, { total: `El mínimo actual es ${used}.` });
      await db.execute('UPDATE resources SET name = ?, description = ?, total = ?, version = version + 1, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [input.name, input.description, input.total, id]);
      await event(db, id, actorId, 'update', resource.total, input.total);
      return detail(db, id, true);
    }),
    archive: (id, version, actorId) => transaction(pool, async db => {
      await actor(db, actorId, true);
      const resource = await row(db, id, true);
      editable(resource, version);
      const [requests] = await db.execute(`SELECT q.project_id FROM project_resource_requests q JOIN projects p ON p.id = q.project_id
        WHERE q.resource_id = ? AND p.status <> 'cancelled' FOR UPDATE`, [id]);
      if (requests.length || (await allocations(db, [id], true)).length) throw new HttpError(409, 'RESOURCE_IN_USE', 'Hay proyectos vigentes que solicitan este elemento. Primero deben quitarlo de sus propuestas o cancelarse.');
      await db.execute('UPDATE resources SET archived_at = UTC_TIMESTAMP(3), updated_at = UTC_TIMESTAMP(3), version = version + 1 WHERE id = ?', [id]);
      await event(db, id, actorId, 'archive', resource.total, resource.total);
    }),
  };
}
