/**
 * Rutas REST de préstamos: entregas de elementos a proyectos y devoluciones.
 *
 * | Método | Ruta                       | Acceso            | Descripción                                        |
 * | ------ | -------------------------- | ----------------- | -------------------------------------------------- |
 * | GET    | /api/loans                 | préstamos / admin | Movimientos (?limit&offset&day&openOnly).          |
 * | GET    | /api/loans/projects        | préstamos / admin | Proyectos con reservas para una jornada (?day).    |
 * | GET    | /api/loans/:id             | préstamos / admin | Detalle de un préstamo y sus devoluciones.         |
 * | POST   | /api/loans                 | préstamos / admin | Registra una entrega.                              |
 * | POST   | /api/loans/:id/returns     | préstamos / admin | Registra una devolución (total, parcial o novedad). |
 */
import { Router } from 'express';
import { requireSession, rateLimit } from '../middleware/auth.mjs';
import { userId } from '../validators/auth.mjs';
import { deliveryBody, returnBody, loansQuery } from '../validators/loans.mjs';
import { queryInput, noQuery } from '../validators/query.mjs';

const loanQueryTypes = { limit: 'int', offset: 'int', day: 'int', openOnly: 'bool' };

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

  router.get('/', async (req, res) => {
    res.json(await repository.list(loansQuery(queryInput(req.query, loanQueryTypes)), req.auth.user.id));
  });
  router.get('/projects', async (req, res) => {
    res.json({ projects: await repository.projects(loansQuery(queryInput(req.query, loanQueryTypes), true), req.auth.user.id) });
  });
  router.get('/:id', async (req, res) => {
    noQuery(req.query);
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
