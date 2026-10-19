import { Router } from 'express';
import { credentials, refreshToken, objectBody, pagination, userId, roleList } from '../validators/auth.mjs';
import { requireSession, requireAdmin, rateLimit } from '../middleware/auth.mjs';
import { HttpError } from '../lib/errors.mjs';

export function authRoutes(repository, service, config) {
  const router = Router();
  const ipLimit = rateLimit(repository, config, { scope: 'auth-ip', limit: 40, seconds: 900 });
  const loginLimit = rateLimit(repository, config, { scope: 'login-email', limit: 10, seconds: 900, byEmail: true });
  const cookieName = config.production ? '__Secure-expotec-refresh' : 'expotec-refresh';
  const cookieOptions = { httpOnly: true, secure: config.production, sameSite: 'strict', path: '/api/auth/browser' };
  const browser = Router();
  browser.use((req, res, next) => {
    if (!config.origins.includes(req.get('origin')) || !req.is('application/json'))
      throw new HttpError(403, 'ORIGIN_FORBIDDEN', 'Ese origen no está autorizado.');
    next();
  });
  function browserResponse(res, session, status = 200) {
    const { refreshToken, ...body } = session;
    res.cookie(cookieName, refreshToken, { ...cookieOptions, maxAge: config.sessionSeconds * 1000 });
    res.status(status).json(body);
  }
  function browserToken(req) {
    objectBody(req.body, []);
    const cookies = (req.get('cookie') ?? '').split(';').map(value => value.trim());
    return refreshToken({ refreshToken: cookies.find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) });
  }
  browser.post('/register', ipLimit, async (req, res) => {
    browserResponse(res, await service.register(credentials(req.body, true)), 201);
  });
  browser.post('/login', ipLimit, loginLimit, async (req, res) => {
    browserResponse(res, await service.login(credentials(req.body)));
  });
  browser.post('/refresh', ipLimit, async (req, res) => {
    try {
      browserResponse(res, await service.refresh(browserToken(req)));
    } catch (error) {
      if (error.status === 401) res.clearCookie(cookieName, cookieOptions);
      throw error;
    }
  });
  browser.post('/logout', ipLimit, async (req, res) => {
    try {
      await service.logout(browserToken(req));
    } catch (error) {
      if (error.status !== 401) throw error;
    }
    res.clearCookie(cookieName, cookieOptions);
    res.sendStatus(204);
  });
  router.use('/browser', browser);
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
