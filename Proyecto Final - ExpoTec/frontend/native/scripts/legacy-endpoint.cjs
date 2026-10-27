/**
 * Ayuda para los ensayos visuales locales (check-*.cjs).
 *
 * Los ensayos interceptan las llamadas a la API con datos de prueba y
 * reconocen cada operación por un nombre interno estable (por ejemplo
 * `/api/spaces/query`). Esta función traduce la solicitud REST real
 * (método + ruta + parámetros) a ese nombre y devuelve también sus datos,
 * tomados del cuerpo JSON o de la query string.
 */

const ID = "([^/]+)";

/** Traducciones REST -> nombre interno. `id` indica si el id viaja en el cuerpo. */
const rules = [
  ["GET", /^\/api\/auth\/session$/, () => "/api/auth/session"],
  ["GET", /^\/api\/auth\/recovery$/, () => "/api/auth/recovery/query"],
  ["GET", /^\/api\/auth\/social\/providers$/, () => "/api/auth/social/providers/query"],
  ["GET", /^\/api\/admin\/users$/, () => "/api/admin/users/query"],
  ["GET", new RegExp(`^/api/admin/users/${ID}$`), (id) => `/api/admin/users/${id}/query`],
  ["PUT", new RegExp(`^/api/admin/users/${ID}/roles$`), (id) => `/api/admin/users/${id}/roles/save`],
  ["GET", /^\/api\/spaces$/, () => "/api/spaces/query"],
  ["POST", /^\/api\/spaces$/, () => "/api/spaces/create"],
  ["GET", new RegExp(`^/api/spaces/${ID}$`), (id) => `/api/spaces/${id}/query`],
  ["PUT", new RegExp(`^/api/spaces/${ID}$`), (id) => `/api/spaces/${id}/save`],
  ["DELETE", new RegExp(`^/api/spaces/${ID}$`), (id) => `/api/spaces/${id}/archive`],
  ["GET", /^\/api\/projects\/presentation$/, () => "/api/projects/presentation/query"],
  ["GET", /^\/api\/projects\/public$/, () => "/api/projects/public/query"],
  ["GET", new RegExp(`^/api/projects/public/${ID}$`), (id) => `/api/projects/public/${id}/query`],
  ["GET", /^\/api\/projects$/, () => "/api/projects/query"],
  ["GET", /^\/api\/projects\/people$/, () => "/api/projects/people/find"],
  ["POST", /^\/api\/projects$/, () => "/api/projects/create"],
  ["GET", new RegExp(`^/api/projects/${ID}$`), (id) => `/api/projects/${id}/query`],
  ["PUT", new RegExp(`^/api/projects/${ID}$`), (id) => `/api/projects/${id}/save`],
  ["POST", new RegExp(`^/api/projects/${ID}/reviews$`), (id) => `/api/projects/${id}/review`],
  ["DELETE", new RegExp(`^/api/projects/${ID}$`), (id) => `/api/projects/${id}/cancel`],
  ["GET", /^\/api\/inventory\/catalog$/, () => "/api/inventory/catalog/query"],
  ["GET", /^\/api\/inventory$/, () => "/api/inventory/query"],
  ["POST", /^\/api\/inventory$/, () => "/api/inventory/create"],
  ["GET", new RegExp(`^/api/inventory/${ID}$`), (id) => `/api/inventory/${id}/query`],
  ["PUT", new RegExp(`^/api/inventory/${ID}$`), (id) => `/api/inventory/${id}/save`],
  ["DELETE", new RegExp(`^/api/inventory/${ID}$`), (id) => `/api/inventory/${id}/archive`],
  ["GET", /^\/api\/loans$/, () => "/api/loans/query"],
  ["GET", /^\/api\/loans\/projects$/, () => "/api/loans/projects/query"],
  ["POST", /^\/api\/loans$/, () => "/api/loans/deliver"],
  ["GET", new RegExp(`^/api/loans/${ID}$`), (id) => `/api/loans/${id}/query`],
  ["POST", new RegExp(`^/api/loans/${ID}/returns$`), (id) => `/api/loans/${id}/return`],
  ["GET", /^\/api\/gallery$/, () => "/api/gallery/public/query"],
  ["GET", /^\/api\/gallery\/mine$/, () => "/api/gallery/mine/query"],
  ["POST", /^\/api\/gallery$/, () => "/api/gallery/submit"],
  ["GET", /^\/api\/gallery\/moderation$/, () => "/api/gallery/moderation/query"],
  ["PATCH", new RegExp(`^/api/gallery/${ID}$`), (id) => `/api/gallery/${id}/review`],
  ["POST", /^\/api\/uploads$/, () => "/api/uploads/prepare"],
  ["POST", new RegExp(`^/api/uploads/${ID}/complete$`), () => "/api/uploads/complete", "id"],
  ["GET", /^\/api\/uploads\/preview$/, () => "/api/uploads/preview"],
];

/** Convierte los parámetros de la URL en un objeto con números y booleanos. */
function queryBody(searchParams) {
  const body = {};
  for (const [key, value] of searchParams) {
    if (/^-?\d+$/.test(value)) body[key] = Number(value);
    else if (value === "true" || value === "false") body[key] = value === "true";
    else body[key] = value;
  }
  return body;
}

/**
 * Traduce una solicitud de Playwright a `{ endpoint, body, method }`.
 * Las rutas sin traducción (por ejemplo `/api/auth/browser/login`) se devuelven tal cual.
 *
 * @param {import('playwright').Request} request
 */
function legacyRequest(request) {
  const url = new URL(request.url());
  const method = request.method();
  let body = {};
  try {
    body = request.postDataJSON() || {};
  } catch {
    body = {};
  }
  if (method === "GET" || method === "DELETE") body = queryBody(url.searchParams);
  for (const [ruleMethod, pattern, name, idInBody] of rules) {
    if (ruleMethod !== method) continue;
    const match = pattern.exec(url.pathname);
    if (!match) continue;
    if (idInBody) body = { ...body, id: match[1] };
    return { endpoint: name(...match.slice(1)), body, method };
  }
  return { endpoint: url.pathname, body, method };
}

module.exports = { legacyRequest };
