/**
 * Acceso a datos del inventario: elementos, unidades fuera de servicio,
 * reservas por proyecto e historial de cambios.
 */
import { randomUUID } from 'node:crypto';
import { transaction } from '../config/database.mjs';
import { HttpError, unauthorized } from '../lib/errors.mjs';
import { assertProjectReturned, openLoans, outstanding } from './loan-balances.mjs';

const forbidden = () => new HttpError(403, 'FORBIDDEN', 'No tenés permiso para consultar o modificar el inventario.');
const missing = () => new HttpError(404, 'RESOURCE_NOT_FOUND', 'No encontramos ese elemento.');
const columns = 'r.id, r.name, r.description, r.total, COALESCE(c.unavailable, 0) AS unavailable, r.version, r.created_at AS createdAt, r.updated_at AS updatedAt, r.archived_at AS archivedAt';
/** Reservas confirmadas de los elementos indicados. */
async function allocations(db, ids, locking = false) {
  if (!ids.length) return [];
  const [rows] = await db.execute(`SELECT resource_id AS resourceId, quantity FROM resource_allocations
    WHERE resource_id IN (${ids.map(() => '?').join(',')}) ORDER BY resource_id, project_id${locking ? ' FOR UPDATE' : ''}`, ids);
  return rows;
}
/** Suma de unidades reservadas de un elemento. */
const reserved = (rows, id) => rows.filter(row => row.resourceId === id).reduce((sum, row) => sum + row.quantity, 0);

/** Agrega una entrada al historial del elemento (alta, ajuste, daño, baja). */
export async function recordInventoryEvent(db, { resourceId, actorId, action, previousTotal, total, previousUnavailable, unavailable, note = '', returnId = null }) {
  const id = randomUUID();
  await db.execute('INSERT INTO inventory_events (id, resource_id, actor_id, action, previous_total, total) VALUES (?, ?, ?, ?, ?, ?)', [id, resourceId, actorId, action, previousTotal, total]);
  await db.execute('INSERT INTO inventory_condition_events (event_id, previous_unavailable, unavailable, note, loan_return_id) VALUES (?, ?, ?, ?, ?)', [id, previousUnavailable, unavailable, note, returnId]);
}

/** Elementos pedidos por un proyecto con su saldo pendiente de devolución. */
export async function projectResources(db, projectId, locking = false) {
  const [rows] = await db.execute(`SELECT q.resource_id AS resourceId, q.quantity, r.name, r.total,
    r.archived_at AS archivedAt, COALESCE(c.unavailable, 0) AS unavailable, COALESCE(a.quantity, 0) AS reservedQuantity
    FROM project_resource_requests q JOIN resources r ON r.id = q.resource_id
    LEFT JOIN resource_conditions c ON c.resource_id = r.id
    LEFT JOIN resource_allocations a ON a.project_id = q.project_id AND a.resource_id = q.resource_id
    WHERE q.project_id = ? ORDER BY q.resource_id${locking ? ' FOR UPDATE' : ''}`, [projectId]);
  const assigned = await allocations(db, rows.map(row => row.resourceId), locking);
  const borrowed = await openLoans(db, { resourceIds: rows.map(row => row.resourceId) }, locking);
  return rows.map(row => ({ ...row, available: Math.max(0, row.total - row.unavailable - reserved(assigned, row.resourceId)), outstanding: outstanding(borrowed, row.resourceId, projectId) }));
}
/** Valida que los elementos pedidos existan y estén activos. */
export async function checkRequestedResources(db, requests) {
  if (!requests.length) return;
  const [rows] = await db.execute(`SELECT id FROM resources WHERE id IN (${requests.map(() => '?').join(',')})
    AND archived_at IS NULL ORDER BY id FOR UPDATE`, requests.map(item => item.resourceId));
  if (rows.length !== requests.length) throw new HttpError(409, 'RESOURCE_UNAVAILABLE', 'Algún elemento ya no está disponible en el catálogo. Actualizá los elementos y revisá el pedido.', { resources: 'Quitá los elementos dados de baja antes de reenviar.' });
}
/** Reemplaza el pedido de elementos de un proyecto. */
export async function replaceResourceRequests(db, projectId, requests) {
  await db.execute('DELETE FROM project_resource_requests WHERE project_id = ?', [projectId]);
  if (requests.length) await db.execute(`INSERT INTO project_resource_requests (project_id, resource_id, quantity)
    VALUES ${requests.map(() => '(?, ?, ?)').join(',')}`, requests.flatMap(item => [projectId, item.resourceId, item.quantity]));
}
/** Reserva el pedido al confirmar el proyecto; falla si no alcanzan las unidades. */
export async function reserveProjectResources(db, projectId) {
  const requests = await projectResources(db, projectId, true);
  for (const item of requests) {
    if (item.archivedAt) throw new HttpError(409, 'RESOURCE_UNAVAILABLE', `${item.name} fue dado de baja. El equipo debe revisar su pedido.`);
    if (item.quantity > item.available) throw new HttpError(409, 'RESOURCE_STOCK', `${item.name}: se necesitan ${item.quantity} unidades y hay ${item.available} disponibles. No se reservó ningún elemento ni el puesto.`);
  }
  if (requests.length) await db.execute(`INSERT INTO resource_allocations (project_id, resource_id, quantity)
    VALUES ${requests.map(() => '(?, ?, ?)').join(',')}`, requests.flatMap(item => [projectId, item.resourceId, item.quantity]));
}
/** Libera las reservas al cancelar o reabrir el proyecto. */
export async function releaseProjectResources(db, projectId) {
  await assertProjectReturned(db, projectId);
  await db.execute('DELETE FROM resource_allocations WHERE project_id = ?', [projectId]);
}

/** Crea el repositorio de inventario. */
export function createInventoryRepository(pool) {
  /** Verifica el permiso: catálogo para alumnos; inventario completo para préstamos/admin. */
  async function actor(db, id, writing = false, catalog = false) {
    if (writing) await db.execute("SELECT code FROM roles WHERE code = 'admin' FOR UPDATE");
    const [rows] = await db.execute(`SELECT ur.role_code AS role FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.id = ? AND u.active = TRUE${writing ? ' FOR UPDATE' : ''}`, [id]);
    if (!rows.length) throw unauthorized();
    const allowed = writing ? ['admin'] : catalog ? ['student', 'teacher', 'loans', 'admin'] : ['admin', 'loans'];
    if (!rows.some(row => allowed.includes(row.role))) throw forbidden();
  }
  /** Lee un elemento o responde 404. */
  async function row(db, id, locking = false) {
    const [rows] = await db.execute(`SELECT ${columns} FROM resources r LEFT JOIN resource_conditions c ON c.resource_id = r.id WHERE r.id = ?${locking ? ' FOR UPDATE' : ''}`, [id]);
    if (!rows.length) throw missing();
    return rows[0];
  }
  /** Elemento con reservas, préstamos abiertos, disponibilidad e historial. */
  async function detail(db, id, locking = false) {
    const resource = await row(db, id, locking);
    const used = reserved(await allocations(db, [id], locking), id);
    const borrowed = outstanding(await openLoans(db, { resourceIds: [id] }, locking), id);
    const [events] = await db.execute(`SELECT e.id, e.action, e.previous_total AS previousTotal, e.total, e.created_at AS createdAt,
      ce.previous_unavailable AS previousUnavailable, COALESCE(ce.unavailable, 0) AS unavailable, COALESCE(ce.note, '') AS note,
      u.first_name AS firstName, u.last_name AS lastName FROM inventory_events e JOIN users u ON u.id = e.actor_id
      LEFT JOIN inventory_condition_events ce ON ce.event_id = e.id
      WHERE e.resource_id = ? ORDER BY e.created_at DESC, e.id DESC LIMIT 100${locking ? ' FOR UPDATE' : ''}`, [id]);
    return { ...resource, reserved: used, available: Math.max(0, resource.total - resource.unavailable - used), shortage: Math.max(0, used + resource.unavailable - resource.total), outstanding: borrowed, availableToLend: Math.max(0, resource.total - resource.unavailable - borrowed), events };
  }
  /** Rechaza cambios sobre elementos dados de baja o con versión desactualizada. */
  function editable(resource, version) {
    if (resource.archivedAt) throw new HttpError(409, 'RESOURCE_ARCHIVED', 'Ese elemento fue dado de baja.');
    if (resource.version !== version) throw new HttpError(409, 'RESOURCE_CHANGED', 'Otra persona modificó este elemento. El borrador se conservó. Descartalo y recargá para revisar la versión actual.');
  }
  /** Evita dos elementos activos con el mismo nombre. */
  async function uniqueName(db, name, id = '') {
    const [rows] = await db.execute('SELECT id FROM resources WHERE name = ? AND id <> ? FOR UPDATE', [name, id]);
    if (rows.length) throw new HttpError(409, 'RESOURCE_NAME_EXISTS', 'Ya existe un elemento con ese nombre, incluso entre las bajas.', { name: 'Elegí otro nombre o revisá los elementos dados de baja.' });
  }
  return {
    /** Lista de elementos (o catálogo reducido para propuestas). */
    list: (input, viewerId, catalog = false) => transaction(pool, async db => {
      await actor(db, viewerId, false, catalog);
      const [rows] = await db.query(`SELECT ${columns}, COALESCE(a.reserved, 0) AS reserved,
        GREATEST(CAST(r.total AS SIGNED) - COALESCE(c.unavailable, 0) - COALESCE(a.reserved, 0), 0) AS available,
        GREATEST(COALESCE(a.reserved, 0) + COALESCE(c.unavailable, 0) - CAST(r.total AS SIGNED), 0) AS shortage,
        COALESCE(l.outstanding, 0) AS outstanding,
        GREATEST(CAST(r.total AS SIGNED) - COALESCE(c.unavailable, 0) - COALESCE(l.outstanding, 0), 0) AS availableToLend FROM resources r
        LEFT JOIN resource_conditions c ON c.resource_id = r.id
        LEFT JOIN (SELECT resource_id, SUM(quantity) AS reserved FROM resource_allocations GROUP BY resource_id) a ON a.resource_id = r.id
        LEFT JOIN (SELECT resource_id, SUM(quantity - returned_quantity) AS outstanding FROM loans WHERE quantity > returned_quantity GROUP BY resource_id) l ON l.resource_id = r.id
        WHERE r.archived_at IS ${input.archived && !catalog ? 'NOT ' : ''}NULL ORDER BY r.name, r.id LIMIT ? OFFSET ?`, [catalog ? 500 : input.limit, catalog ? 0 : input.offset]);
      return rows.map(row => ({ ...row, reserved: Number(row.reserved), available: Number(row.available), shortage: Number(row.shortage), outstanding: Number(row.outstanding), availableToLend: Number(row.availableToLend) }));
    }),
    get: (id, viewerId) => transaction(pool, async db => { await actor(db, viewerId); return detail(db, id); }),
    /** Alta de un elemento (solo administración). */
    create: (input, actorId) => transaction(pool, async db => {
      await actor(db, actorId, true);
      const [active] = await db.execute('SELECT id FROM resources WHERE archived_at IS NULL FOR UPDATE');
      if (active.length >= 500) throw new HttpError(409, 'RESOURCE_LIMIT', 'El inventario admite hasta 500 elementos activos.');
      await uniqueName(db, input.name);
      const id = randomUUID();
      await db.execute('INSERT INTO resources (id, name, description, total) VALUES (?, ?, ?, ?)', [id, input.name, input.description, input.total]);
      const unavailable = input.unavailable ?? 0;
      await db.execute('INSERT INTO resource_conditions (resource_id, unavailable) VALUES (?, ?)', [id, unavailable]);
      await recordInventoryEvent(db, { resourceId: id, actorId, action: 'create', previousTotal: null, total: input.total, previousUnavailable: null, unavailable, note: input.note });
      return detail(db, id, true);
    }),
    /** Ajuste de datos, total o unidades fuera de servicio sin dejar reservas sin cubrir. */
    save: (id, input, actorId) => transaction(pool, async db => {
      await actor(db, actorId, true);
      const resource = await row(db, id, true);
      editable(resource, input.version);
      await uniqueName(db, input.name, id);
      const used = reserved(await allocations(db, [id], true), id);
      const borrowed = outstanding(await openLoans(db, { resourceIds: [id] }, true), id), unavailable = input.unavailable ?? resource.unavailable;
      const minimum = Math.max(borrowed, Math.min(used, resource.total - resource.unavailable)) + unavailable;
      if ((input.total !== resource.total || unavailable !== resource.unavailable) && input.total < minimum)
        throw new HttpError(409, 'RESOURCE_RESERVED', 'El ajuste debe conservar las unidades prestadas y no reducir la cobertura de las reservas. Revisá también las unidades fuera de servicio.', { total: `El mínimo actual es ${minimum}.` });
      if (unavailable !== resource.unavailable && (!input.note || input.note.length < 10)) throw new HttpError(400, 'VALIDATION_ERROR', 'Explicá el cambio de unidades fuera de servicio.', { note: 'Escribí entre 10 y 1000 caracteres.' });
      await db.execute('UPDATE resources SET name = ?, description = ?, total = ?, version = version + 1, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [input.name, input.description, input.total, id]);
      await db.execute('INSERT INTO resource_conditions (resource_id, unavailable) VALUES (?, ?) ON DUPLICATE KEY UPDATE unavailable = VALUES(unavailable)', [id, unavailable]);
      await recordInventoryEvent(db, { resourceId: id, actorId, action: 'update', previousTotal: resource.total, total: input.total, previousUnavailable: resource.unavailable, unavailable, note: input.note });
      return detail(db, id, true);
    }),
    /** Baja lógica: conserva el historial y rechaza si hay reservas o préstamos. */
    archive: (id, version, actorId) => transaction(pool, async db => {
      await actor(db, actorId, true);
      const resource = await row(db, id, true);
      editable(resource, version);
      if ((await openLoans(db, { resourceIds: [id] }, true)).length) throw new HttpError(409, 'RESOURCE_HAS_LOANS', 'Este elemento tiene unidades sin devolver. Registrá las devoluciones antes de darlo de baja.');
      const [requests] = await db.execute(`SELECT q.project_id FROM project_resource_requests q JOIN projects p ON p.id = q.project_id
        WHERE q.resource_id = ? AND p.status <> 'cancelled' FOR UPDATE`, [id]);
      if (requests.length || (await allocations(db, [id], true)).length) throw new HttpError(409, 'RESOURCE_IN_USE', 'Hay proyectos vigentes que solicitan este elemento. Primero deben quitarlo de sus propuestas o cancelarse.');
      await db.execute('UPDATE resources SET archived_at = UTC_TIMESTAMP(3), updated_at = UTC_TIMESTAMP(3), version = version + 1 WHERE id = ?', [id]);
      await recordInventoryEvent(db, { resourceId: id, actorId, action: 'archive', previousTotal: resource.total, total: resource.total, previousUnavailable: resource.unavailable, unavailable: resource.unavailable });
    }),
  };
}
