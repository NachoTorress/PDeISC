import { HttpError } from '../lib/errors.mjs';

export async function openLoans(db, { resourceIds, projectId } = {}, locking = false) {
  if (resourceIds && !resourceIds.length) return [];
  const conditions = ['quantity > returned_quantity'], parameters = [];
  if (resourceIds) { conditions.push(`resource_id IN (${resourceIds.map(() => '?').join(',')})`); parameters.push(...resourceIds); }
  if (projectId) { conditions.push('project_id = ?'); parameters.push(projectId); }
  const [rows] = await db.execute(`SELECT id, resource_id AS resourceId, project_id AS projectId, quantity - returned_quantity AS outstanding
    FROM loans WHERE ${conditions.join(' AND ')} ORDER BY resource_id, project_id, id${locking ? ' FOR UPDATE' : ''}`, parameters);
  return rows;
}
export const outstanding = (rows, resourceId, projectId) => rows.filter(row => (!resourceId || row.resourceId === resourceId) && (!projectId || row.projectId === projectId)).reduce((sum, row) => sum + row.outstanding, 0);
export async function assertProjectReturned(db, projectId) {
  if ((await openLoans(db, { projectId }, true)).length)
    throw new HttpError(409, 'PROJECT_HAS_LOANS', 'Este proyecto tiene elementos sin devolver. Registrá las devoluciones antes de reabrirlo, cancelarlo o cambiar sus pedidos.');
}
