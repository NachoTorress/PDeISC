import { Router } from 'express';
import { requireSession, rateLimit } from '../middleware/auth.mjs';
import { userId, objectBody } from '../validators/auth.mjs';
import { deliveryBody, returnBody, loansQuery } from '../validators/loans.mjs';

export function loansRoutes(repository, authRepository, service, config) {
  const router = Router();
  router.use(requireSession(service));
  router.post('/query', async (req, res) => res.json(await repository.list(loansQuery(req.body), req.auth.user.id)));
  router.post('/projects/query', async (req, res) => res.json({ projects: await repository.projects(loansQuery(req.body, true), req.auth.user.id) }));
  router.post('/:id/query', async (req, res) => {
    objectBody(req.body, []);
    res.json({ loan: await repository.get(userId(req.params.id), req.auth.user.id) });
  });
  router.use(rateLimit(authRepository, config, { scope: 'loans-write', limit: 120, seconds: 900, byUser: true }));
  router.post('/deliver', async (req, res) => res.status(201).json({ loan: await repository.deliver(deliveryBody(req.body), req.auth.user.id) }));
  router.post('/:id/return', async (req, res) => res.json({ loan: await repository.receive(userId(req.params.id), returnBody(req.body), req.auth.user.id) }));
  return router;
}
