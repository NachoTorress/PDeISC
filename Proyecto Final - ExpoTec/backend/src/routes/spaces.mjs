import { Router } from 'express';
import { requireAdmin, requireSession, rateLimit } from '../middleware/auth.mjs';
import { objectBody, userId } from '../validators/auth.mjs';
import { createSpaceBody, saveSpaceBody, spaceVersion } from '../validators/spaces.mjs';

export function spacesRoutes(repository, authRepository, service, config) {
  const router = Router();
  router.post('/query', async (req, res) => {
    objectBody(req.body, []);
    res.json({ spaces: await repository.list() });
  });
  router.post('/:id/query', async (req, res) => {
    objectBody(req.body, []);
    res.json({ space: await repository.get(userId(req.params.id)) });
  });
  router.use(requireSession(service), requireAdmin,
    rateLimit(authRepository, config, { scope: 'spaces-write', limit: 120, seconds: 900 }));
  router.post('/create', async (req, res) => {
    res.status(201).json({ space: await repository.create(createSpaceBody(req.body), req.auth.user.id) });
  });
  router.post('/:id/save', async (req, res) => {
    res.json({ space: await repository.save(userId(req.params.id), saveSpaceBody(req.body), req.auth.user.id) });
  });
  router.post('/:id/archive', async (req, res) => {
    objectBody(req.body, ['version']);
    await repository.archive(userId(req.params.id), spaceVersion(req.body.version), req.auth.user.id);
    res.sendStatus(204);
  });
  return router;
}
