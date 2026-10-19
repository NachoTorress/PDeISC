import { Router } from 'express';
import { requireSession, rateLimit } from '../middleware/auth.mjs';
import { objectBody, userId } from '../validators/auth.mjs';
import { inventoryQuery, inventoryVersion, resourceBody } from '../validators/inventory.mjs';

export function inventoryRoutes(repository, authRepository, service, config) {
  const router = Router();
  router.use(requireSession(service));
  router.post('/catalog/query', async (req, res) => {
    objectBody(req.body, []);
    res.json({ resources: await repository.list({}, req.auth.user.id, true) });
  });
  router.post('/query', async (req, res) => res.json({ resources: await repository.list(inventoryQuery(req.body), req.auth.user.id) }));
  router.post('/:id/query', async (req, res) => {
    objectBody(req.body, []);
    res.json({ resource: await repository.get(userId(req.params.id), req.auth.user.id) });
  });
  router.use(rateLimit(authRepository, config, { scope: 'inventory-write', limit: 120, seconds: 900, byUser: true }));
  router.post('/create', async (req, res) => res.status(201).json({ resource: await repository.create(resourceBody(req.body), req.auth.user.id) }));
  router.post('/:id/save', async (req, res) => res.json({ resource: await repository.save(userId(req.params.id), resourceBody(req.body, true), req.auth.user.id) }));
  router.post('/:id/archive', async (req, res) => {
    objectBody(req.body, ['version']);
    await repository.archive(userId(req.params.id), inventoryVersion(req.body.version), req.auth.user.id);
    res.status(204).end();
  });
  return router;
}
