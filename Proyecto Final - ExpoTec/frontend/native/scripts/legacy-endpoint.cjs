/**
 * Ayuda para los ensayos visuales locales (check-*.cjs).
 *
 * Los ensayos interceptan las llamadas a la API con datos de prueba y
 * reconocen cada operación por un nombre interno estable (por ejemplo
 * `/api/spaces/create`). Las consultas ya usan ese nombre (`POST .../query`);
 * esta función traduce las escrituras (método + ruta) a su nombre interno y
 * devuelve también sus datos, tomados siempre del cuerpo JSON.
 */

const ID = "([^/]+)";

/** Traducciones de escrituras -> nombre interno. `id` indica si el id viaja en el cuerpo. */
const rules = [
  ["PUT", new RegExp(`^/api/admin/users/${ID}/roles$`), (id) => `/api/admin/users/${id}/roles/save`],
  ["POST", /^\/api\/spaces$/, () => "/api/spaces/create"],
  ["PUT", new RegExp(`^/api/spaces/${ID}$`), (id) => `/api/spaces/${id}/save`],
  ["DELETE", new RegExp(`^/api/spaces/${ID}$`), (id) => `/api/spaces/${id}/archive`],
  ["POST", /^\/api\/projects$/, () => "/api/projects/create"],
  ["PUT", new RegExp(`^/api/projects/${ID}$`), (id) => `/api/projects/${id}/save`],
  ["POST", new RegExp(`^/api/projects/${ID}/reviews$`), (id) => `/api/projects/${id}/review`],
  ["DELETE", new RegExp(`^/api/projects/${ID}$`), (id) => `/api/projects/${id}/cancel`],
  ["POST", /^\/api\/inventory$/, () => "/api/inventory/create"],
  ["PUT", new RegExp(`^/api/inventory/${ID}$`), (id) => `/api/inventory/${id}/save`],
  ["DELETE", new RegExp(`^/api/inventory/${ID}$`), (id) => `/api/inventory/${id}/archive`],
  ["POST", /^\/api\/loans$/, () => "/api/loans/deliver"],
  ["POST", new RegExp(`^/api/loans/${ID}/returns$`), (id) => `/api/loans/${id}/return`],
  ["POST", /^\/api\/gallery$/, () => "/api/gallery/submit"],
  ["PATCH", new RegExp(`^/api/gallery/${ID}$`), (id) => `/api/gallery/${id}/review`],
  ["POST", /^\/api\/uploads$/, () => "/api/uploads/prepare"],
  ["POST", new RegExp(`^/api/uploads/${ID}/complete$`), () => "/api/uploads/complete", "id"],
];

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
