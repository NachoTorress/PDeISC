/**
 * Rutas de autenticación (registro, ingreso, renovación y cierre de sesión),
 * accesos sociales (Google, Discord, GitHub) y administración de permisos.
 *
 * Se ofrecen dos variantes del mismo contrato:
 * - Nativa (`/api/auth/...`): la app Android recibe el token de renovación en
 *   JSON y lo guarda en SecureStore.
 * - Navegador (`/api/auth/browser/...`): el token de renovación viaja en una
 *   cookie HttpOnly, inaccesible para JavaScript.
 *
 * | Método | Ruta                                   | Descripción                                       |
 * | ------ | -------------------------------------- | ------------------------------------------------- |
 * | POST   | /api/auth/register                     | Crea una cuenta de alumno o invitado.             |
 * | POST   | /api/auth/login                        | Ingresa con correo y contraseña.                  |
 * | POST   | /api/auth/refresh                      | Renueva el token de acceso (rota la renovación).  |
 * | POST   | /api/auth/logout                       | Revoca la sesión.                                 |
 * | POST   | /api/auth/session                      | Devuelve la cuenta del token de acceso.           |
 * | POST   | /api/auth/social/providers/query       | Proveedores sociales configurados.                |
 * | POST   | /api/auth/social/google/native/start   | Inicia Google nativo de Android.                  |
 * | POST   | /api/auth/social/google/native/verify  | Verifica el token de Google nativo.               |
 * | POST   | /api/auth/social/status                | Estado de un flujo social (envía la prueba privada). |
 * | POST   | /api/auth/social/complete              | Completa alta o vinculación social.               |
 * | GET    | /api/auth/social/:provider/callback    | Retorno OAuth del proveedor (única excepción*).   |
 * | POST   | /api/admin/users/query                 | Lista cuentas ({ search?, limit?, offset? }). Admin. |
 * | POST   | /api/admin/users/:id/query             | Detalle de una cuenta. Admin.                     |
 * | PUT    | /api/admin/users/:id/roles             | Reemplaza los permisos de una cuenta. Admin.      |
 *
 * La API no usa GET: las consultas van por POST con sus datos en el cuerpo.
 * (*) El retorno OAuth es la única ruta GET porque no la llama la app: es
 * Google, Discord o GitHub quien redirige el navegador a esa dirección, y el
 * estándar OAuth 2.0 define esa redirección como GET.
 */
import { Router } from 'express';
import { credentials, refreshToken, objectBody, usersQuery, userId, rolesChange } from '../validators/auth.mjs';
import { requireSession, requireAdmin, rateLimit } from '../middleware/auth.mjs';
import { HttpError } from '../lib/errors.mjs';
import { queryInput, noInput } from '../validators/query.mjs';
import { randomBytes } from 'node:crypto';

/**
 * Lee una cookie por nombre desde el encabezado `Cookie`.
 *
 * @param {import('express').Request} req Solicitud entrante.
 * @param {string} name Nombre de la cookie.
 * @returns {string | undefined} Valor de la cookie, si existe.
 */
function readCookie(req, name) {
  return (req.get('cookie') ?? '').split(';').map(value => value.trim())
    .find(value => value.startsWith(`${name}=`))?.slice(name.length + 1);
}

/**
 * Crea el enrutador `/api/auth`.
 *
 * @param {object} repository Repositorio de cuentas y sesiones.
 * @param {object} service Servicio de autenticación (hash, JWT, sesiones).
 * @param {object} config Configuración del servidor.
 * @param {object} [social] Servicio de accesos sociales; ausente si no hay proveedores.
 * @returns {import('express').Router}
 */
export function authRoutes(repository, service, config, social) {
  const router = Router();
  // Límites contra fuerza bruta: por IP para todo el bloque y por correo para el ingreso.
  const ipLimit = rateLimit(repository, config, { scope: 'auth-ip', limit: 40, seconds: 900 });
  const loginLimit = rateLimit(repository, config, { scope: 'login-email', limit: 10, seconds: 900, byEmail: true });
  // En producción el prefijo __Secure- obliga al navegador a aceptar la cookie solo por HTTPS.
  const cookieName = config.production ? '__Secure-expotec-refresh' : 'expotec-refresh';
  const cookieOptions = { httpOnly: true, secure: config.production, sameSite: 'strict', path: '/api/auth/browser' };

  // ----- Variante para navegador (cookie HttpOnly) -----
  const browser = Router();
  // Protección CSRF: solo se aceptan orígenes autorizados y cuerpos JSON.
  browser.use((req, res, next) => {
    if (!config.origins.includes(req.get('origin')) || !req.is('application/json'))
      throw new HttpError(403, 'ORIGIN_FORBIDDEN', 'Ese origen no está autorizado.');
    next();
  });
  /** Guarda el token de renovación en la cookie y responde el resto de la sesión. */
  function browserResponse(res, session, status = 200) {
    const { refreshToken, ...body } = session;
    res.cookie(cookieName, refreshToken, { ...cookieOptions, maxAge: config.sessionSeconds * 1000 });
    res.status(status).json(body);
  }
  /** Obtiene y valida el token de renovación guardado en la cookie. */
  function browserToken(req) {
    objectBody(req.body, []);
    return refreshToken({ refreshToken: readCookie(req, cookieName) });
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
      // Una sesión ya vencida igualmente se considera cerrada.
      if (error.status !== 401) throw error;
    }
    res.clearCookie(cookieName, cookieOptions);
    res.sendStatus(204);
  });

  // ----- Accesos sociales -----
  if (social) {
    // Cookie temporal que ata el flujo OAuth al navegador que lo inició.
    const bindingCookie = config.production ? '__Host-expotec-social' : 'expotec-social';
    const bindingOptions = { httpOnly: true, secure: config.production, sameSite: 'lax', path: '/', maxAge: 10 * 60 * 1000 };
    const binding = req => {
      const value = readCookie(req, bindingCookie);
      return /^[A-Za-z0-9_-]{43}$/.test(value ?? '') ? value : undefined;
    };
    router.post('/social/providers/query', (req, res) => {
    noInput(req.body);
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

  // ----- Variante nativa (tokens en JSON) -----
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
    noInput(req.body);
    res.json({ user: req.auth.user });
  });
  return router;
}

/**
 * Crea el enrutador `/api/admin`: gestión de cuentas y permisos.
 * Todas las rutas exigen sesión y permiso de administrador.
 *
 * @param {object} repository Repositorio de cuentas.
 * @param {object} service Servicio de autenticación.
 * @param {object} config Configuración del servidor.
 * @returns {import('express').Router}
 */
export function adminRoutes(repository, service, config) {
  const router = Router();
  router.use(requireSession(service), requireAdmin);
  router.post('/users/query', async (req, res) => {
    res.json({ users: await repository.listUsers(usersQuery(queryInput(req.body))) });
  });
  router.post('/users/:id/query', async (req, res) => {
    noInput(req.body);
    res.json({ user: await repository.getUser(userId(req.params.id)) });
  });
  // expectedRoles evita pisar un cambio simultáneo de otro administrador (409 si difiere).
  router.put('/users/:id/roles',
    rateLimit(repository, config, { scope: 'admin-roles', limit: 60, seconds: 900, byUser: true }),
    async (req, res) => {
      const { roles, expectedRoles } = rolesChange(req.body);
      res.json({ user: await repository.setRoles(userId(req.params.id), roles, req.auth.user.id, expectedRoles) });
    });
  return router;
}
