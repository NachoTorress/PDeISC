import { randomUUID } from 'node:crypto';
import { transaction } from '../config/database.mjs';
import { HttpError, unauthorized } from '../lib/errors.mjs';
import { projectResources, checkRequestedResources, replaceResourceRequests, reserveProjectResources, releaseProjectResources } from './inventory.mjs';
import { assertProjectReturned } from './loan-balances.mjs';

const missing = () => new HttpError(404, 'PROJECT_NOT_FOUND', 'No encontramos ese proyecto o no tenés acceso.');
const forbidden = () => new HttpError(403, 'FORBIDDEN', 'No tenés permiso para realizar esta operación.');
const columns = `p.id, p.creator_id AS creatorId, p.requested_booth_id AS boothId, p.name, p.description, p.course,
  p.image_url AS imageUrl, p.video_url AS videoUrl, p.is_software AS isSoftwareProject, p.github_url AS githubUrl,
  p.website_url AS websiteUrl, p.status, p.feedback, p.version, p.created_at AS createdAt, p.updated_at AS updatedAt`;

export function createProjectsRepository(pool) {
  async function actor(db, id, writing = false) {
    // Serializa con cambios de roles y planos para verificar permisos y referencias al confirmar.
    if (writing) await db.execute("SELECT code FROM roles WHERE code = 'admin' FOR UPDATE");
    const [rows] = await db.execute(`SELECT u.id, ur.role_code AS role FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.id = ? AND u.active = TRUE${writing ? ' FOR UPDATE' : ''}`, [id]);
    if (!rows.length) throw unauthorized();
    return rows.map(row => row.role).filter(Boolean);
  }
  async function row(db, id, lock = false) {
    const [rows] = await db.execute(`SELECT ${columns} FROM projects p WHERE p.id = ?${lock ? ' FOR UPDATE' : ''}`, [id]);
    if (!rows.length) throw missing();
    return { ...rows[0], isSoftwareProject: Boolean(rows[0].isSoftwareProject) };
  }
  function version(project, expected) {
    if (project.version !== expected) throw new HttpError(409, 'PROJECT_CHANGED', 'Otra persona modificó el proyecto. Tu borrador se conservó. Recargá la versión guardada antes de volver a enviarlo.');
  }
  async function people(db, table, id, locking = false) {
    const [rows] = await db.execute(`SELECT u.id, u.first_name AS firstName, u.last_name AS lastName FROM ${table} rel
      JOIN users u ON u.id = rel.user_id WHERE rel.project_id = ? ORDER BY u.last_name, u.first_name, u.id${locking ? ' FOR UPDATE' : ''}`, [id]);
    return rows;
  }
  async function detail(db, id, viewerId, locking = false) {
    const project = await row(db, id, locking);
    const members = await people(db, 'project_members', id, locking), teachers = await people(db, 'project_teachers', id, locking);
    if (viewerId) {
      const roles = await actor(db, viewerId, locking);
      if (!roles.includes('admin') && !(roles.includes('student') && members.some(person => person.id === viewerId)) &&
          !(roles.includes('teacher') && teachers.some(person => person.id === viewerId))) throw missing();
    } else if (project.status !== 'approved') throw missing();
    const [subjects] = await db.execute(`SELECT s.name FROM subjects s JOIN project_subjects ps ON ps.subject_id = s.id
      WHERE ps.project_id = ? ORDER BY s.name${locking ? ' FOR UPDATE' : ''}`, [id]);
    const [booths] = await db.execute(`SELECT b.id, b.space_id AS spaceId, b.furniture_code AS furnitureId, s.name AS spaceName
      FROM booths b JOIN spaces s ON s.id = b.space_id WHERE b.id = ?${locking ? ' FOR UPDATE' : ''}`, [project.boothId]);
    const base = { ...project, subjects: subjects.map(subject => subject.name), booth: booths[0] };
    delete base.boothId;
    if (!viewerId) {
      const { creatorId, feedback, version, updatedAt, ...published } = base;
      const names = list => list.map(({ firstName, lastName }) => ({ firstName, lastName }));
      return { ...published, members: names(members), teachers: names(teachers) };
    }
    const [reviews] = await db.execute(`SELECT r.id, r.action, r.note, r.created_at AS createdAt,
      u.first_name AS firstName, u.last_name AS lastName FROM project_reviews r JOIN users u ON u.id = r.actor_id
      WHERE r.project_id = ? ORDER BY r.created_at, r.id LIMIT 100${locking ? ' FOR UPDATE' : ''}`, [id]);
    const resources = await projectResources(db, id, locking);
    return { ...base, members, teachers, reviews, resources, openLoanQuantity: resources.reduce((sum, resource) => sum + resource.outstanding, 0) };
  }
  async function availableBooth(db, id, projectId = '') {
    const [rows] = await db.execute(`SELECT b.id FROM booths b JOIN spaces s ON s.id = b.space_id
      JOIN furniture f ON f.space_id = b.space_id AND f.code = b.furniture_code
      WHERE b.id = ? AND b.active = TRUE AND s.archived_at IS NULL AND f.active = TRUE AND f.type = 'table' FOR UPDATE`, [id]);
    if (!rows.length) throw new HttpError(409, 'BOOTH_UNAVAILABLE', 'El puesto ya no está habilitado. Elegí otro.');
    const [assigned] = await db.execute('SELECT project_id AS projectId FROM booth_allocations WHERE booth_id = ? FOR UPDATE', [id]);
    if (assigned.length && assigned[0].projectId !== projectId) throw new HttpError(409, 'BOOTH_OCCUPIED', 'Otro proyecto ya confirmó ese puesto. Elegí otro antes de reenviar.');
  }
  async function validatePeople(db, memberIds, teacherIds, creatorId) {
    if (!memberIds.includes(creatorId) || memberIds.some(id => teacherIds.includes(id)))
      throw new HttpError(400, 'PARTICIPANTS_INVALID', 'El creador debe permanecer en el equipo y los profesores deben ser cuentas distintas de los alumnos integrantes.');
    const ids = [...memberIds, ...teacherIds];
    const [rows] = await db.execute(`SELECT u.id, ur.role_code AS role FROM users u JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.active = TRUE AND u.id IN (${ids.map(() => '?').join(',')}) FOR UPDATE`, ids);
    if (memberIds.some(id => !rows.some(person => person.id === id && person.role === 'student')) ||
        teacherIds.some(id => !rows.some(person => person.id === id && person.role === 'teacher')))
      throw new HttpError(400, 'PARTICIPANTS_INVALID', 'Revisá las cuentas de alumnos y profesores: deben estar activas y conservar su permiso.');
  }
  async function relations(db, id, input) {
    for (const table of ['project_members', 'project_teachers', 'project_subjects']) await db.execute(`DELETE FROM ${table} WHERE project_id = ?`, [id]);
    for (const [table, ids] of [['project_members', input.memberIds], ['project_teachers', input.teacherIds]])
      await db.execute(`INSERT INTO ${table} (project_id, user_id) VALUES ${ids.map(() => '(?, ?)').join(',')}`, ids.flatMap(userId => [id, userId]));
    await db.execute(`INSERT IGNORE INTO subjects (id, name) VALUES ${input.subjects.map(() => '(?, ?)').join(',')}`, input.subjects.flatMap(name => [randomUUID(), name]));
    const [subjects] = await db.execute(`SELECT id FROM subjects WHERE name IN (${input.subjects.map(() => '?').join(',')}) FOR UPDATE`, input.subjects);
    await db.execute(`INSERT INTO project_subjects (project_id, subject_id) VALUES ${subjects.map(() => '(?, ?)').join(',')}`, subjects.flatMap(subject => [id, subject.id]));
  }
  const content = input => [input.boothId, input.name, input.description, input.course, input.imageUrl, input.videoUrl,
    input.isSoftwareProject, input.githubUrl, input.websiteUrl];
  async function event(db, id, actorId, action, note = '') {
    await db.execute('INSERT INTO project_reviews (id, project_id, actor_id, action, note) VALUES (?, ?, ?, ?, ?)', [randomUUID(), id, actorId, action, note]);
  }
  return {
    async list({ limit, offset }, viewerId) {
      let condition = "p.status = 'approved'", parameters = [];
      if (viewerId) {
        const roles = await actor(pool, viewerId);
        condition = roles.includes('admin') ? 'TRUE' : `(${roles.includes('student') ? 'TRUE' : 'FALSE'} AND EXISTS (SELECT 1 FROM project_members m WHERE m.project_id = p.id AND m.user_id = ?))
          OR (${roles.includes('teacher') ? 'TRUE' : 'FALSE'} AND EXISTS (SELECT 1 FROM project_teachers t WHERE t.project_id = p.id AND t.user_id = ?))`;
        if (!roles.includes('admin')) parameters = [viewerId, viewerId];
      }
      const [rows] = await pool.query(`SELECT p.id, p.name, p.course, p.status, p.image_url AS imageUrl, p.created_at AS createdAt,
        s.name AS spaceName, b.furniture_code AS furnitureId FROM projects p JOIN booths b ON b.id = p.requested_booth_id
        JOIN spaces s ON s.id = b.space_id WHERE (${condition}) ORDER BY p.created_at DESC, p.id LIMIT ? OFFSET ?`, [...parameters, limit, offset]);
      return rows;
    },
    get: (id, viewerId) => transaction(pool, db => detail(db, id, viewerId)),
    async person(input, viewerId) {
      const roles = await actor(pool, viewerId);
      if (!roles.includes('student') && !roles.includes('admin')) throw forbidden();
      const [rows] = await pool.execute(`SELECT u.id, u.first_name AS firstName, u.last_name AS lastName FROM users u
        JOIN user_roles ur ON ur.user_id = u.id WHERE u.email = ? AND u.active = TRUE AND ur.role_code = ?`, [input.email, input.role]);
      if (!rows.length) throw new HttpError(404, 'PERSON_NOT_FOUND', 'No encontramos una cuenta activa con ese correo y permiso.');
      return rows[0];
    },
    create: (input, actorId) => transaction(pool, async db => {
      const roles = await actor(db, actorId, true);
      if (!roles.includes('student')) throw forbidden();
      if (!input.memberIds.includes(actorId)) throw new HttpError(400, 'PARTICIPANTS_INVALID', 'La cuenta que presenta el proyecto debe integrar el equipo.');
      await validatePeople(db, input.memberIds, input.teacherIds, actorId);
      await availableBooth(db, input.boothId);
      await checkRequestedResources(db, input.resources ?? []);
      const id = randomUUID();
      await db.execute(`INSERT INTO projects (id, creator_id, requested_booth_id, name, description, course, image_url, video_url,
        is_software, github_url, website_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [id, actorId, ...content(input)]);
      await relations(db, id, input);
      await replaceResourceRequests(db, id, input.resources ?? []);
      await event(db, id, actorId, 'submit');
      return detail(db, id, actorId, true);
    }),
    save: (id, input, actorId) => transaction(pool, async db => {
      const roles = await actor(db, actorId, true);
      const project = await row(db, id, true);
      const members = await people(db, 'project_members', id, true);
      if (!roles.includes('student') || !members.some(person => person.id === actorId)) throw missing();
      version(project, input.version);
      if (!['pending', 'changes'].includes(project.status)) throw new HttpError(409, 'PROJECT_LOCKED', 'Solo se pueden editar propuestas pendientes o con cambios solicitados.');
      await assertProjectReturned(db, id);
      if (!input.memberIds.includes(actorId)) throw new HttpError(400, 'PARTICIPANTS_INVALID', 'La persona que edita debe permanecer en el equipo.');
      await validatePeople(db, input.memberIds, input.teacherIds, project.creatorId);
      await availableBooth(db, input.boothId, id);
      const requests = input.resources ?? await projectResources(db, id, true);
      await checkRequestedResources(db, requests);
      await db.execute(`UPDATE projects SET requested_booth_id = ?, name = ?, description = ?, course = ?, image_url = ?, video_url = ?,
        is_software = ?, github_url = ?, website_url = ?, status = 'pending', feedback = '', version = version + 1, updated_at = UTC_TIMESTAMP(3) WHERE id = ?`, [...content(input), id]);
      await relations(db, id, input);
      await replaceResourceRequests(db, id, requests);
      await event(db, id, actorId, 'resubmit');
      return detail(db, id, actorId, true);
    }),
    review: (id, input, actorId) => transaction(pool, async db => {
      const roles = await actor(db, actorId, true);
      const project = await row(db, id, true);
      const teachers = await people(db, 'project_teachers', id, true);
      if (input.action === 'reopen' ? !roles.includes('admin') : !roles.includes('teacher') || !teachers.some(person => person.id === actorId)) throw forbidden();
      version(project, input.version);
      if (input.action === 'reopen' ? project.status !== 'approved' : project.status !== 'pending')
        throw new HttpError(409, 'PROJECT_LOCKED', 'El proyecto ya no admite esa revisión. Actualizá su ficha.');
      const status = { approve: 'approved', changes: 'changes', reopen: 'pending' }[input.action];
      if (input.action === 'approve') {
        const members = await people(db, 'project_members', id, true);
        await validatePeople(db, members.map(person => person.id), teachers.map(person => person.id), project.creatorId);
        await availableBooth(db, project.boothId, id);
        await reserveProjectResources(db, id);
        await db.execute('INSERT INTO booth_allocations (booth_id, project_id) VALUES (?, ?)', [project.boothId, id]);
      } else if (input.action === 'reopen') {
        await db.execute('DELETE FROM booth_allocations WHERE project_id = ?', [id]);
        await releaseProjectResources(db, id);
      }
      await db.execute('UPDATE projects SET status = ?, feedback = ?, version = version + 1, updated_at = UTC_TIMESTAMP(3) WHERE id = ?', [status, input.note, id]);
      await event(db, id, actorId, input.action, input.note);
      return detail(db, id, actorId, true);
    }),
    cancel: (id, expectedVersion, actorId) => transaction(pool, async db => {
      const roles = await actor(db, actorId, true);
      const project = await row(db, id, true);
      const members = await people(db, 'project_members', id, true);
      if (!roles.includes('admin') && (!roles.includes('student') || !members.some(person => person.id === actorId))) throw missing();
      version(project, expectedVersion);
      if (project.status === 'cancelled' || (project.status === 'approved' && !roles.includes('admin')))
        throw new HttpError(409, 'PROJECT_LOCKED', 'Ese proyecto no se puede cancelar con el estado o permiso actuales.');
      await db.execute('DELETE FROM booth_allocations WHERE project_id = ?', [id]);
      await releaseProjectResources(db, id);
      await db.execute("UPDATE projects SET status = 'cancelled', version = version + 1, updated_at = UTC_TIMESTAMP(3) WHERE id = ?", [id]);
      await event(db, id, actorId, 'cancel');
      return detail(db, id, actorId, true);
    }),
  };
}
