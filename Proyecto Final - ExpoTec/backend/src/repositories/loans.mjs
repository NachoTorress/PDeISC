import { randomUUID } from 'node:crypto';
import { transaction } from '../config/database.mjs';
import { HttpError, unauthorized } from '../lib/errors.mjs';
import { openLoans, outstanding } from './loan-balances.mjs';
import { recordInventoryEvent } from './inventory.mjs';

const columns = `l.id, l.project_id AS projectId, l.resource_id AS resourceId, l.day, l.quantity, l.returned_quantity AS returned,
  l.version, l.recipient_id AS recipientId, l.note, l.created_at AS createdAt, p.name AS projectName, r.name AS resourceName,
  recipient.first_name AS recipientFirstName, recipient.last_name AS recipientLastName,
  operator.first_name AS deliveredFirstName, operator.last_name AS deliveredLastName`;
const joins = `FROM loans l JOIN projects p ON p.id = l.project_id JOIN resources r ON r.id = l.resource_id
  JOIN users recipient ON recipient.id = l.recipient_id JOIN users operator ON operator.id = l.delivered_by`;

export function createLoansRepository(pool) {
  async function actor(db, id, writing = false) {
    if (writing) await db.execute("SELECT code FROM roles WHERE code = 'admin' FOR UPDATE");
    const [rows] = await db.execute(`SELECT ur.role_code AS role FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.id = ? AND u.active = TRUE${writing ? ' FOR UPDATE' : ''}`, [id]);
    if (!rows.length) throw unauthorized();
    if (!rows.some(row => ['admin', 'loans'].includes(row.role))) throw new HttpError(403, 'FORBIDDEN', 'Necesitás permiso de préstamos o administración.');
  }
  async function row(db, id, locking = false) {
    const [rows] = await db.execute(`SELECT ${columns} ${joins} WHERE l.id = ?${locking ? ' FOR UPDATE' : ''}`, [id]);
    if (!rows.length) throw new HttpError(404, 'LOAN_NOT_FOUND', 'No encontramos ese préstamo.');
    return rows[0];
  }
  async function detail(db, id, locking = false) {
    const loan = await row(db, id, locking);
    const [returns] = await db.execute(`SELECT r.id, r.quantity, r.damaged_quantity AS damagedQuantity, r.note, r.created_at AS createdAt,
      u.first_name AS firstName, u.last_name AS lastName FROM loan_returns r JOIN users u ON u.id = r.received_by
      WHERE r.loan_id = ? ORDER BY r.created_at DESC, r.id DESC LIMIT 100${locking ? ' FOR UPDATE' : ''}`, [id]);
    return { ...loan, returns };
  }
  return {
    list: (input, viewerId) => transaction(pool, async db => {
      await actor(db, viewerId);
      const filters = [], parameters = [];
      if (input.day) { filters.push('l.day = ?'); parameters.push(input.day); }
      if (input.openOnly) filters.push('l.quantity > l.returned_quantity');
      const [loans] = await db.query(`SELECT ${columns} ${joins} ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
        ORDER BY l.created_at DESC, l.id DESC LIMIT ? OFFSET ?`, [...parameters, input.limit, input.offset]);
      const [summary] = await db.execute('SELECT COUNT(*) AS pendingCount, COALESCE(SUM(quantity - returned_quantity), 0) AS pendingQuantity FROM loans WHERE quantity > returned_quantity');
      return { loans, summary: { pendingCount: Number(summary[0].pendingCount), pendingQuantity: Number(summary[0].pendingQuantity) } };
    }),
    get: (id, viewerId) => transaction(pool, async db => { await actor(db, viewerId); return detail(db, id); }),
    projects: (input, viewerId) => transaction(pool, async db => {
      await actor(db, viewerId);
      const [projects] = await db.query(`SELECT p.id, p.name, p.course, p.version, s.name AS spaceName, b.furniture_code AS furnitureId
        FROM projects p JOIN booths b ON b.id = p.requested_booth_id JOIN spaces s ON s.id = b.space_id
        WHERE p.status = 'approved' AND EXISTS (SELECT 1 FROM resource_allocations a WHERE a.project_id = p.id)
        ORDER BY p.name, p.id LIMIT ? OFFSET ?`, [input.limit, input.offset]);
      if (!projects.length) return [];
      const ids = projects.map(project => project.id), marks = ids.map(() => '?').join(',');
      const [requests] = await db.execute(`SELECT a.project_id AS projectId, a.resource_id AS resourceId, a.quantity AS reservedQuantity,
        r.name, r.total, r.archived_at AS archivedAt, COALESCE(c.unavailable, 0) AS unavailable
        FROM resource_allocations a JOIN resources r ON r.id = a.resource_id LEFT JOIN resource_conditions c ON c.resource_id = r.id
        WHERE a.project_id IN (${marks}) ORDER BY r.name, r.id`, ids);
      const [members] = await db.execute(`SELECT m.project_id AS projectId, u.id, u.first_name AS firstName, u.last_name AS lastName
        FROM project_members m JOIN users u ON u.id = m.user_id JOIN user_roles ur ON ur.user_id = u.id AND ur.role_code = 'student'
        WHERE m.project_id IN (${marks}) AND u.active = TRUE ORDER BY u.last_name, u.first_name, u.id`, ids);
      const [delivered] = await db.execute(`SELECT id, project_id AS projectId, resource_id AS resourceId FROM loans WHERE project_id IN (${marks}) AND day = ?`, [...ids, input.day]);
      const borrowed = await openLoans(db, { resourceIds: [...new Set(requests.map(item => item.resourceId))] });
      return projects.map(project => ({ ...project, members: members.filter(member => member.projectId === project.id).map(({ projectId, ...member }) => member),
        resources: requests.filter(item => item.projectId === project.id).map(({ projectId, ...item }) => {
          const own = outstanding(borrowed, item.resourceId, project.id), physical = Math.max(0, item.total - item.unavailable - outstanding(borrowed, item.resourceId));
          const existing = delivered.find(loan => loan.projectId === project.id && loan.resourceId === item.resourceId);
          return { ...item, outstanding: own, availableToLend: physical, loanId: existing?.id ?? null,
            deliverable: existing || item.archivedAt ? 0 : Math.max(0, Math.min(item.reservedQuantity - own, physical)) };
        }) }));
    }),
    deliver: (input, actorId) => transaction(pool, async db => {
      await actor(db, actorId, true);
      const [projects] = await db.execute('SELECT id, status, version FROM projects WHERE id = ? FOR UPDATE', [input.projectId]);
      if (!projects.length || projects[0].status !== 'approved') throw new HttpError(409, 'PROJECT_NOT_APPROVED', 'Solo se entregan elementos a proyectos confirmados. Actualizá los proyectos.');
      if (projects[0].version !== input.projectVersion) throw new HttpError(409, 'PROJECT_CHANGED', 'El proyecto cambió. Actualizá los proyectos antes de entregar.');
      const [allocations] = await db.execute(`SELECT a.quantity, r.total, r.archived_at AS archivedAt, COALESCE(c.unavailable, 0) AS unavailable
        FROM resource_allocations a JOIN resources r ON r.id = a.resource_id LEFT JOIN resource_conditions c ON c.resource_id = r.id
        WHERE a.project_id = ? AND a.resource_id = ? FOR UPDATE`, [input.projectId, input.resourceId]);
      if (!allocations.length || allocations[0].archivedAt) throw new HttpError(409, 'RESOURCE_NOT_RESERVED', 'El proyecto no tiene una reserva activa de ese elemento.');
      const [previous] = await db.execute('SELECT id FROM loans WHERE project_id = ? AND resource_id = ? AND day = ? FOR UPDATE', [input.projectId, input.resourceId, input.day]);
      if (previous.length) throw new HttpError(409, 'ALREADY_DELIVERED', 'Ya hay una entrega de este elemento para el proyecto en esa jornada, incluso si fue devuelta. Consultá el historial.');
      const [members] = await db.execute(`SELECT u.id FROM project_members m JOIN users u ON u.id = m.user_id
        JOIN user_roles ur ON ur.user_id = u.id AND ur.role_code = 'student'
        WHERE m.project_id = ? AND m.user_id = ? AND u.active = TRUE FOR UPDATE`, [input.projectId, input.recipientId]);
      if (!members.length) throw new HttpError(400, 'RECIPIENT_INVALID', 'Elegí un alumno activo que integre el equipo para registrar quién retira.');
      const borrowed = await openLoans(db, { resourceIds: [input.resourceId] }, true), allocation = allocations[0];
      const own = outstanding(borrowed, input.resourceId, input.projectId), physical = allocation.total - allocation.unavailable - outstanding(borrowed, input.resourceId);
      if (input.quantity + own > allocation.quantity) throw new HttpError(409, 'PROJECT_LOAN_LIMIT', `El proyecto ya tiene ${own} unidades sin devolver. La entrega debe respetar su reserva de ${allocation.quantity}.`);
      if (input.quantity > physical) throw new HttpError(409, 'LOAN_STOCK', `Hay ${Math.max(0, physical)} unidades utilizables disponibles para entregar. No se registró la entrega.`);
      const id = randomUUID();
      await db.execute('INSERT INTO loans (id, project_id, resource_id, day, quantity, recipient_id, delivered_by, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, input.projectId, input.resourceId, input.day, input.quantity, input.recipientId, actorId, input.note]);
      return detail(db, id, true);
    }),
    receive: (id, input, actorId) => transaction(pool, async db => {
      await actor(db, actorId, true);
      const loan = await row(db, id, true);
      if (loan.version !== input.version) throw new HttpError(409, 'LOAN_CHANGED', 'Otra persona registró un movimiento. El borrador se conservó; actualizá el préstamo antes de volver a enviar.');
      if (input.quantity > loan.quantity - loan.returned) throw new HttpError(409, 'RETURN_EXCEEDS_LOAN', 'La cantidad recibida supera lo que falta devolver. No se registró la devolución.');
      const returnId = randomUUID();
      await db.execute('INSERT INTO loan_returns (id, loan_id, quantity, damaged_quantity, note, received_by) VALUES (?, ?, ?, ?, ?, ?)', [returnId, id, input.quantity, input.damagedQuantity, input.note, actorId]);
      await db.execute('UPDATE loans SET returned_quantity = returned_quantity + ?, version = version + 1 WHERE id = ?', [input.quantity, id]);
      if (input.damagedQuantity) {
        const [resources] = await db.execute(`SELECT r.total, COALESCE(c.unavailable, 0) AS unavailable FROM resources r
          LEFT JOIN resource_conditions c ON c.resource_id = r.id WHERE r.id = ? FOR UPDATE`, [loan.resourceId]);
        const resource = resources[0], unavailable = resource.unavailable + input.damagedQuantity;
        if (unavailable > resource.total) throw new HttpError(409, 'RESOURCE_STATE_CHANGED', 'Revisá las existencias del elemento antes de registrar esas unidades dañadas.');
        await db.execute('INSERT INTO resource_conditions (resource_id, unavailable) VALUES (?, ?) ON DUPLICATE KEY UPDATE unavailable = VALUES(unavailable)', [loan.resourceId, unavailable]);
        await db.execute('UPDATE resources SET version = version + 1, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [loan.resourceId]);
        await recordInventoryEvent(db, { resourceId: loan.resourceId, actorId, action: 'damage', previousTotal: resource.total, total: resource.total, previousUnavailable: resource.unavailable, unavailable, note: input.note, returnId });
      }
      return detail(db, id, true);
    }),
  };
}
