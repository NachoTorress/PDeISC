/**
 * Compatibilidad temporal con el contrato anterior (APK 0.4.0).
 *
 * Hasta la versión 0.4.0 la API usaba POST para todas las operaciones.
 * La API actual sigue sin usar GET: las consultas mantienen exactamente las
 * mismas rutas POST de entonces (`POST /api/spaces/query`, etc.), así que no
 * necesitan traducción. Lo que cambió son las escrituras: ahora usan
 * POST para crear, PUT para reemplazar, PATCH para cambios parciales y
 * DELETE para bajas.
 *
 * Las APK ya instaladas siguen llamando a las rutas de escritura anteriores.
 * Este middleware traduce cada una a su equivalente actual (método y ruta)
 * antes de que lleguen a los enrutadores, sin duplicar lógica. Se puede
 * retirar cuando todos los teléfonos usen una APK 0.5.1 o posterior.
 */

const ID = '([0-9a-fA-F-]{36})';

/**
 * Tabla de traducción. Cada entrada indica:
 * - `from`: expresión regular de la ruta anterior (siempre POST).
 * - `method`: método de destino.
 * - `to`: función que arma la ruta nueva a partir de los grupos capturados.
 * - `body`: qué hacer con el cuerpo JSON:
 *   'keep' -> conserva el cuerpo tal cual.
 *   'id'   -> usa `body.id` como parte de la ruta y descarta el cuerpo.
 */
export const legacyRoutes = [
  { from: new RegExp(`^/api/admin/users/${ID}/roles/save$`), method: 'PUT', to: id => `/api/admin/users/${id}/roles`, body: 'keep' },

  { from: /^\/api\/spaces\/create$/, method: 'POST', to: () => '/api/spaces', body: 'keep' },
  { from: new RegExp(`^/api/spaces/${ID}/save$`), method: 'PUT', to: id => `/api/spaces/${id}`, body: 'keep' },
  { from: new RegExp(`^/api/spaces/${ID}/archive$`), method: 'DELETE', to: id => `/api/spaces/${id}`, body: 'keep' },

  { from: /^\/api\/projects\/create$/, method: 'POST', to: () => '/api/projects', body: 'keep' },
  { from: new RegExp(`^/api/projects/${ID}/save$`), method: 'PUT', to: id => `/api/projects/${id}`, body: 'keep' },
  { from: new RegExp(`^/api/projects/${ID}/review$`), method: 'POST', to: id => `/api/projects/${id}/reviews`, body: 'keep' },
  { from: new RegExp(`^/api/projects/${ID}/cancel$`), method: 'DELETE', to: id => `/api/projects/${id}`, body: 'keep' },

  { from: /^\/api\/inventory\/create$/, method: 'POST', to: () => '/api/inventory', body: 'keep' },
  { from: new RegExp(`^/api/inventory/${ID}/save$`), method: 'PUT', to: id => `/api/inventory/${id}`, body: 'keep' },
  { from: new RegExp(`^/api/inventory/${ID}/archive$`), method: 'DELETE', to: id => `/api/inventory/${id}`, body: 'keep' },

  { from: /^\/api\/loans\/deliver$/, method: 'POST', to: () => '/api/loans', body: 'keep' },
  { from: new RegExp(`^/api/loans/${ID}/return$`), method: 'POST', to: id => `/api/loans/${id}/returns`, body: 'keep' },

  { from: /^\/api\/gallery\/submit$/, method: 'POST', to: () => '/api/gallery', body: 'keep' },
  { from: new RegExp(`^/api/gallery/${ID}/review$`), method: 'PATCH', to: id => `/api/gallery/${id}`, body: 'keep' },

  { from: /^\/api\/uploads\/prepare$/, method: 'POST', to: () => '/api/uploads', body: 'keep' },
  { from: /^\/api\/uploads\/complete$/, method: 'POST', to: () => '/api/uploads/{id}/complete', body: 'id' },
];

/**
 * Middleware de Express que reescribe las rutas anteriores.
 * Debe montarse después de `express.json()` y antes de los enrutadores.
 *
 * @type {import('express').RequestHandler}
 */
export function legacyRoutesMiddleware(req, res, next) {
  if (req.method !== 'POST') return next();
  for (const route of legacyRoutes) {
    const match = route.from.exec(req.path);
    if (!match) continue;
    let target = route.to(...match.slice(1));
    if (route.body === 'id') {
      target = target.replace('{id}', encodeURIComponent(String(req.body?.id ?? '')));
      req.body = undefined;
    }
    req.method = route.method;
    req.url = target;
    res.set('Deprecation', 'true'); // Avisa a los clientes que la ruta anterior quedará fuera de uso.
    break;
  }
  next();
}
