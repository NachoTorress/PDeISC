/**
 * Rutas de préstamos: entregas de elementos a proyectos y devoluciones.
 * Las consultas usan POST con sus datos en el cuerpo JSON: la API no usa GET.
 *
 * | Método | Ruta                       | Acceso            | Cuerpo JSON                              | Descripción                                         |
 * | ------ | -------------------------- | ----------------- | ---------------------------------------- | --------------------------------------------------- |
 * | POST   | /api/loans/query           | préstamos / admin | `{ limit?, offset?, day?, openOnly? }`   | Movimientos registrados.                            |
 * | POST   | /api/loans/projects/query  | préstamos / admin | `{ day }`                                | Proyectos con reservas para una jornada.            |
 * | POST   | /api/loans/:id/query       | préstamos / admin | `{}`                                     | Detalle de un préstamo y sus devoluciones.          |
 * | POST   | /api/loans                 | préstamos / admin | entrega                                  | Registra una entrega.                               |
 * | POST   | /api/loans/:id/returns     | préstamos / admin | devolución + `version`                   | Registra una devolución (total, parcial o novedad). |
 */
import { Router } from 'express';
import { requireSession, rateLimit } from '../middleware/auth.mjs';
import { userId } from '../validators/auth.mjs';
import { deliveryBody, returnBody, loansQuery } from '../validators/loans.mjs';
import { queryInput, noInput } from '../validators/query.mjs';


/**
 * Crea el enrutador de préstamos.
 *
 * @param {object} repository Repositorio de préstamos.
 * @param {object} authRepository Repositorio de cuentas (límite de solicitudes).
 * @param {object} service Servicio de autenticación.
 * @param {object} config Configuración del servidor.
 * @returns {import('express').Router}
 */
export function loansRoutes(repository, authRepository, service, config) {
  const router = Router();
  router.use(requireSession(service));

  router.post('/query', async (req, res) => {
    res.json(await repository.list(loansQuery(queryInput(req.body)), req.auth.user.id));
  });
  router.post('/projects/query', async (req, res) => {
    res.json({ projects: await repository.projects(loansQuery(queryInput(req.body), true), req.auth.user.id) });
  });
  router.post('/:id/query', async (req, res) => {
    noInput(req.body);
    res.json({ loan: await repository.get(userId(req.params.id), req.auth.user.id) });
  });

  router.use(rateLimit(authRepository, config, { scope: 'loans-write', limit: 120, seconds: 900, byUser: true }));
  router.post('/', async (req, res) => {
    res.status(201).json({ loan: await repository.deliver(deliveryBody(req.body), req.auth.user.id) });
  });
  router.post('/:id/returns', async (req, res) => {
    res.json({ loan: await repository.receive(userId(req.params.id), returnBody(req.body), req.auth.user.id) });
  });
  return router;
}
