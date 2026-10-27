/**
 * Rutas REST del inventario de elementos prestables (zapatillas, alargues, mesas...).
 *
 * | Método | Ruta                    | Acceso                 | Descripción                                  |
 * | ------ | ----------------------- | ---------------------- | -------------------------------------------- |
 * | GET    | /api/inventory/catalog  | sesión                 | Catálogo para pedir elementos en propuestas. |
 * | GET    | /api/inventory          | préstamos / admin      | Lista con existencias (?limit&offset&archived). |
 * | GET    | /api/inventory/:id      | préstamos / admin      | Detalle e historial de un elemento.          |
 * | POST   | /api/inventory          | administrador          | Crea un elemento.                            |
 * | PUT    | /api/inventory/:id      | administrador          | Modifica nombre, total o fuera de servicio.  |
 * | DELETE | /api/inventory/:id      | administrador          | Da de baja conservando historial (?version=N). |
 *
 * El repositorio comprueba el permiso exacto de cada operación.
 */
import { Router } from 'express';
import { requireSession, rateLimit } from '../middleware/auth.mjs';
import { userId } from '../validators/auth.mjs';
import { inventoryQuery, inventoryVersion, resourceBody } from '../validators/inventory.mjs';
import { queryInput, versionQuery, noQuery } from '../validators/query.mjs';

/**
 * Crea el enrutador de inventario.
 *
 * @param {object} repository Repositorio de inventario.
 * @param {object} authRepository Repositorio de cuentas (límite de solicitudes).
 * @param {object} service Servicio de autenticación.
 * @param {object} config Configuración del servidor.
 * @returns {import('express').Router}
 */
export function inventoryRoutes(repository, authRepository, service, config) {
  const router = Router();
  router.use(requireSession(service));

  router.get('/catalog', async (req, res) => {
    noQuery(req.query);
    res.json({ resources: await repository.list({}, req.auth.user.id, true) });
  });
  router.get('/', async (req, res) => {
    const query = inventoryQuery(queryInput(req.query, { limit: 'int', offset: 'int', archived: 'bool' }));
    res.json({ resources: await repository.list(query, req.auth.user.id) });
  });
  router.get('/:id', async (req, res) => {
    noQuery(req.query);
    res.json({ resource: await repository.get(userId(req.params.id), req.auth.user.id) });
  });

  router.use(rateLimit(authRepository, config, { scope: 'inventory-write', limit: 120, seconds: 900, byUser: true }));
  router.post('/', async (req, res) => {
    res.status(201).json({ resource: await repository.create(resourceBody(req.body), req.auth.user.id) });
  });
  router.put('/:id', async (req, res) => {
    res.json({ resource: await repository.save(userId(req.params.id), resourceBody(req.body, true), req.auth.user.id) });
  });
  router.delete('/:id', async (req, res) => {
    const { version } = versionQuery(req.query);
    await repository.archive(userId(req.params.id), inventoryVersion(version), req.auth.user.id);
    res.status(204).end();
  });
  return router;
}
