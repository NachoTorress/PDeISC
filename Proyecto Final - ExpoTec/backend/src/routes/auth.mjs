import { Router } from 'express';
import { credentials, refreshToken, objectBody, usersQuery, userId, roleList, rolesChange } from '../validators/auth.mjs';
import { requireSession, requireAdmin, rateLimit } from '../middleware/auth.mjs';
import { HttpError } from '../lib/errors.mjs';
import { randomBytes } from 'node:crypto';

export function authRoutes(repository, service, config, social) {
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
  if (social) {
    const bindingCookie = config.production ? '__Host-expotec-social' : 'expotec-social';
    const bindingOptions = { httpOnly: true, secure: config.production, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 };
    const binding = req => {
      const value = (req.get('cookie') ?? '').split(';').map(value => value.trim()).find(value => value.startsWith(`${bindingCookie}=`))?.slice(bindingCookie.length + 1);
      return /^[A-Za-z0-9_-]{43}$/.test(value ?? '') ? value : undefined;
    };
    router.post('/social/providers/query', (req, res) => {
      objectBody(req.body, []);
      res.json(social.providers());
    });
    router.post('/social/google/native/start', ipLimit, async (req, res) => res.json(await social.startNativeGoogle(req.body)));
    router.post('/social/google/native/verify', ipLimit, async (req, res) => res.json(await social.verifyNativeGoogle(req.body)));
    browser.post('/social/start', ipLimit, async (req, res) => {
      const key = binding(req) ?? randomBytes(32).toString('base64url');
      const result = await social.start(req.body, key);
      res.cookie(bindingCookie, key, bindingOptions);
      res.json(result);
    });
    browser.post('/social/status', ipLimit, async (req, res) => res.json(await social.status(req.body)));
    browser.post('/social/complete', ipLimit, async (req, res) => browserResponse(res, await social.complete(req.body)));
    router.post('/social/status', ipLimit, async (req, res) => res.json(await social.status(req.body)));
    router.post('/social/complete', ipLimit, async (req, res) => res.json(await social.complete(req.body)));
    router.get('/social/:provider/callback', ipLimit, async (req, res) => {
      res.redirect(303, await social.callback(req.params.provider, req.query, binding(req)));
    });
  }
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

export function adminRoutes(repository, service, config) {
  const router = Router();
  router.use(requireSession(service), requireAdmin);
  router.post('/users/query', async (req, res) => {
    res.json({ users: await repository.listUsers(usersQuery(req.body)) });
  });
  router.post('/users/:id/query', async (req, res) => {
    objectBody(req.body, []);
    res.json({ user: await repository.getUser(userId(req.params.id)) });
  });
  router.post('/users/:id/roles/save',
    rateLimit(repository, config, { scope: 'admin-roles', limit: 60, seconds: 900, byUser: true }),
    async (req, res) => {
      const { roles, expectedRoles } = rolesChange(req.body);
      res.json({ user: await repository.setRoles(userId(req.params.id), roles, req.auth.user.id, expectedRoles) });
    });
  router.patch('/users/:id/roles', async (req, res) => {
    res.json({ user: await repository.setRoles(userId(req.params.id), roleList(req.body), req.auth.user.id) });
  });
  return router;
}
