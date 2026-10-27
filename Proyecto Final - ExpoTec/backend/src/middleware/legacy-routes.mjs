/**
 * Compatibilidad temporal con el contrato anterior (APK 0.4.0).
 *
 * Hasta la versión 0.4.0 la API usaba POST para todas las operaciones
 * (por ejemplo `POST /api/projects/:id/query`). La API actual es REST:
 * GET para leer, POST para crear, PUT para reemplazar, PATCH para cambios
 * parciales y DELETE para bajas.
 *
 * Las APK ya instaladas siguen llamando a las rutas anteriores. Este
 * middleware traduce cada ruta vieja a su equivalente REST (método, ruta y
 * parámetros) antes de que lleguen a los enrutadores, sin duplicar lógica.
 * Se puede retirar cuando todos los teléfonos usen la APK 0.5.0 o posterior.
 */

const ID = '([0-9a-fA-F-]{36})';

/**
 * Tabla de traducción. Cada entrada indica:
 * - `from`: expresión regular de la ruta anterior (siempre POST).
 * - `method`: método REST de destino.
 * - `to`: función que arma la ruta nueva a partir de los grupos capturados.
 * - `body`: qué hacer con el cuerpo JSON:
 *   'query'   -> pasa todos los campos a la query string (lecturas).
 *   'version' -> pasa solo `version` a la query string (bajas).
 *   'id'      -> usa `body.id` como parte de la ruta.
 *   'keep'    -> conserva el cuerpo tal cual (escrituras).
 */
export const legacyRoutes = [
  { from: /^\/api\/health$/, method: 'GET', to: () => '/api/health', body: 'query' },
  { from: /^\/api\/health\/ready$/, method: 'GET', to: () => '/api/health/ready', body: 'query' },
  { from: /^\/api\/auth\/session$/, method: 'GET', to: () => '/api/auth/session', body: 'query' },
  { from: /^\/api\/auth\/social\/providers\/query$/, method: 'GET', to: () => '/api/auth/social/providers', body: 'query' },
  { from: /^\/api\/auth\/recovery\/query$/, method: 'GET', to: () => '/api/auth/recovery', body: 'query' },

  { from: /^\/api\/admin\/users\/query$/, method: 'GET', to: () => '/api/admin/users', body: 'query' },
  { from: new RegExp(`^/api/admin/users/${ID}/query$`), method: 'GET', to: id => `/api/admin/users/${id}`, body: 'query' },
  { from: new RegExp(`^/api/admin/users/${ID}/roles/save$`), method: 'PUT', to: id => `/api/admin/users/${id}/roles`, body: 'keep' },

  { from: /^\/api\/spaces\/query$/, method: 'GET', to: () => '/api/spaces', body: 'query' },
  { from: /^\/api\/spaces\/create$/, method: 'POST', to: () => '/api/spaces', body: 'keep' },
  { from: new RegExp(`^/api/spaces/${ID}/query$`), method: 'GET', to: id => `/api/spaces/${id}`, body: 'query' },
  { from: new RegExp(`^/api/spaces/${ID}/save$`), method: 'PUT', to: id => `/api/spaces/${id}`, body: 'keep' },
  { from: new RegExp(`^/api/spaces/${ID}/archive$`), method: 'DELETE', to: id => `/api/spaces/${id}`, body: 'version' },

  { from: /^\/api\/projects\/presentation\/query$/, method: 'GET', to: () => '/api/projects/presentation', body: 'query' },
  { from: /^\/api\/projects\/public\/query$/, method: 'GET', to: () => '/api/projects/public', body: 'query' },
  { from: new RegExp(`^/api/projects/public/${ID}/query$`), method: 'GET', to: id => `/api/projects/public/${id}`, body: 'query' },
  { from: /^\/api\/projects\/query$/, method: 'GET', to: () => '/api/projects', body: 'query' },
  { from: /^\/api\/projects\/people\/find$/, method: 'GET', to: () => '/api/projects/people', body: 'query' },
  { from: /^\/api\/projects\/create$/, method: 'POST', to: () => '/api/projects', body: 'keep' },
  { from: new RegExp(`^/api/projects/${ID}/query$`), method: 'GET', to: id => `/api/projects/${id}`, body: 'query' },
  { from: new RegExp(`^/api/projects/${ID}/save$`), method: 'PUT', to: id => `/api/projects/${id}`, body: 'keep' },
  { from: new RegExp(`^/api/projects/${ID}/review$`), method: 'POST', to: id => `/api/projects/${id}/reviews`, body: 'keep' },
  { from: new RegExp(`^/api/projects/${ID}/cancel$`), method: 'DELETE', to: id => `/api/projects/${id}`, body: 'version' },

  { from: /^\/api\/inventory\/catalog\/query$/, method: 'GET', to: () => '/api/inventory/catalog', body: 'query' },
  { from: /^\/api\/inventory\/query$/, method: 'GET', to: () => '/api/inventory', body: 'query' },
  { from: /^\/api\/inventory\/create$/, method: 'POST', to: () => '/api/inventory', body: 'keep' },
  { from: new RegExp(`^/api/inventory/${ID}/query$`), method: 'GET', to: id => `/api/inventory/${id}`, body: 'query' },
  { from: new RegExp(`^/api/inventory/${ID}/save$`), method: 'PUT', to: id => `/api/inventory/${id}`, body: 'keep' },
  { from: new RegExp(`^/api/inventory/${ID}/archive$`), method: 'DELETE', to: id => `/api/inventory/${id}`, body: 'version' },

  { from: /^\/api\/loans\/query$/, method: 'GET', to: () => '/api/loans', body: 'query' },
  { from: /^\/api\/loans\/projects\/query$/, method: 'GET', to: () => '/api/loans/projects', body: 'query' },
  { from: /^\/api\/loans\/deliver$/, method: 'POST', to: () => '/api/loans', body: 'keep' },
  { from: new RegExp(`^/api/loans/${ID}/query$`), method: 'GET', to: id => `/api/loans/${id}`, body: 'query' },
  { from: new RegExp(`^/api/loans/${ID}/return$`), method: 'POST', to: id => `/api/loans/${id}/returns`, body: 'keep' },

  { from: /^\/api\/gallery\/public\/query$/, method: 'GET', to: () => '/api/gallery', body: 'query' },
  { from: /^\/api\/gallery\/mine\/query$/, method: 'GET', to: () => '/api/gallery/mine', body: 'query' },
  { from: /^\/api\/gallery\/submit$/, method: 'POST', to: () => '/api/gallery', body: 'keep' },
  { from: /^\/api\/gallery\/moderation\/query$/, method: 'GET', to: () => '/api/gallery/moderation', body: 'query' },
  { from: new RegExp(`^/api/gallery/${ID}/review$`), method: 'PATCH', to: id => `/api/gallery/${id}`, body: 'keep' },

  { from: /^\/api\/uploads\/prepare$/, method: 'POST', to: () => '/api/uploads', body: 'keep' },
  { from: /^\/api\/uploads\/complete$/, method: 'POST', to: () => '/api/uploads/{id}/complete', body: 'id' },
  { from: /^\/api\/uploads\/preview$/, method: 'GET', to: () => '/api/uploads/preview', body: 'query' },
];

/**
 * Convierte un objeto plano en query string (`?a=1&b=true`).
 * Los valores no primitivos se omiten: las lecturas anteriores no los usaban.
 *
 * @param {unknown} body Cuerpo JSON recibido.
 * @returns {string} Query string con el signo `?`, o texto vacío.
 */
function toQuery(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(body))
    if (['string', 'number', 'boolean'].includes(typeof value)) params.set(key, String(value));
  const text = params.toString();
  return text ? `?${text}` : '';
}

/**
 * Middleware de Express que reescribe las rutas anteriores.
 * Debe montarse después de `express.json()` y antes de los enrutadores.
 *
 * @type {import('express').RequestHandler}
 */
export function legacyRoutesMiddleware(req, res, next) {
  if (req.method !== 'POST') return next();
  const path = req.path;
  for (const route of legacyRoutes) {
    const match = route.from.exec(path);
    if (!match) continue;
    let target = route.to(...match.slice(1));
    let query = '';
    if (route.body === 'query') query = toQuery(req.body);
    else if (route.body === 'version') query = toQuery({ version: req.body?.version });
    else if (route.body === 'id') target = target.replace('{id}', encodeURIComponent(String(req.body?.id ?? '')));
    req.method = route.method;
    req.url = target + query;
    if (route.body !== 'keep') req.body = undefined;
    res.set('Deprecation', 'true'); // Avisa a los clientes que la ruta anterior quedará fuera de uso.
    break;
  }
  next();
}
