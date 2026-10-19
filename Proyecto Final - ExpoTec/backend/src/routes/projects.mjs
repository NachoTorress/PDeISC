import { Router } from 'express';
import { requireSession, rateLimit } from '../middleware/auth.mjs';
import { userId, pagination, objectBody } from '../validators/auth.mjs';
import { spaceVersion } from '../validators/spaces.mjs';
import { proposalBody, reviewBody, personBody } from '../validators/projects.mjs';

export function projectsRoutes(repository, authRepository, service, config) {
  const router = Router();
  router.post('/public/query', async (req, res) => res.json({ projects: await repository.list(pagination(req.body)) }));
  router.post('/public/:id/query', async (req, res) => {
    objectBody(req.body, []);
    res.json({ project: await repository.get(userId(req.params.id)) });
  });
  router.use(requireSession(service));
  router.post('/query', async (req, res) => res.json({ projects: await repository.list(pagination(req.body), req.auth.user.id) }));
  router.post('/:id/query', async (req, res) => {
    objectBody(req.body, []);
    res.json({ project: await repository.get(userId(req.params.id), req.auth.user.id) });
  });
  router.post('/people/find', rateLimit(authRepository, config, { scope: 'project-people', limit: 30, seconds: 900, byUser: true }), async (req, res) => {
    res.json({ person: await repository.person(personBody(req.body), req.auth.user.id) });
  });
  router.use(rateLimit(authRepository, config, { scope: 'projects-write', limit: 120, seconds: 900, byUser: true }));
  router.post('/create', async (req, res) => res.status(201).json({ project: await repository.create(proposalBody(req.body), req.auth.user.id) }));
  router.post('/:id/save', async (req, res) => res.json({ project: await repository.save(userId(req.params.id), proposalBody(req.body, true), req.auth.user.id) }));
  router.post('/:id/review', async (req, res) => res.json({ project: await repository.review(userId(req.params.id), reviewBody(req.body), req.auth.user.id) }));
  router.post('/:id/cancel', async (req, res) => {
    objectBody(req.body, ['version']);
    res.json({ project: await repository.cancel(userId(req.params.id), spaceVersion(req.body.version), req.auth.user.id) });
  });
  return router;
}
