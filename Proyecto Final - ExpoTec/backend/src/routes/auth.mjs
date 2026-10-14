import { Router } from 'express';
import { credentials, refreshToken, objectBody, pagination, userId, roleList } from '../validators/auth.mjs';
import { requireSession, requireAdmin, rateLimit } from '../middleware/auth.mjs';

export function authRoutes(repository, service, config) {
  const router = Router();
  const ipLimit = rateLimit(repository, config, { scope: 'auth-ip', limit: 40, seconds: 900 });
  const loginLimit = rateLimit(repository, config, { scope: 'login-email', limit: 10, seconds: 900, byEmail: true });
  router.post('/register', ipLimit, async (req, res) => {
    res.status(201).json(await service.register(credentials(req.body, true)));
  });
  router.post('/login', ipLimit, loginLimit, async (req, res) => {
    res.json(await service.login(credentials(req.body)));
  });
  router.post('/refresh', ipLimit, async (req, res) => {
    res.json(await service.refresh(refreshToken(req.body)));
  });
  router.post('/logout', ipLimit, async (req, res) => {
    await service.logout(refreshToken(req.body));
    res.sendStatus(204);
  });
  router.post('/session', requireSession(service), async (req, res) => {
    objectBody(req.body, []);
    res.json({ user: req.auth.user });
  });
  return router;
}

export function adminRoutes(repository, service) {
  const router = Router();
  router.use(requireSession(service), requireAdmin);
  router.post('/users/query', async (req, res) => {
    res.json({ users: await repository.listUsers(pagination(req.body)) });
  });
  router.patch('/users/:id/roles', async (req, res) => {
    res.json({ user: await repository.setRoles(userId(req.params.id), roleList(req.body), req.auth.user.id) });
  });
  return router;
}
