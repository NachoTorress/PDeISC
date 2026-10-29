/**
 * Documentación interactiva de la API (Swagger UI).
 *
 * | Método | Ruta               | Descripción                                        |
 * |--------|--------------------|----------------------------------------------------|
 * | GET    | /api/docs          | Página de Swagger UI para leer y probar la API.    |
 * | POST   | /api/docs/openapi  | Especificación OpenAPI 3.0 en JSON.                |
 *
 * `GET /api/docs` es una página para abrir en el navegador, no una consulta
 * de datos: por eso es la tercera excepción a la regla "sin GET", junto con
 * la imagen publicada y el retorno OAuth. No recibe ni devuelve datos de
 * cuentas. La especificación va incluida en la página, así que Swagger UI no
 * necesita pedirla con GET.
 *
 * Swagger UI se carga desde jsDelivr con versión fija y hash de integridad
 * (SRI): si el archivo del CDN cambiara, el navegador se niega a ejecutarlo.
 */
import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
import { openApiSpec } from '../docs/openapi.mjs';
import { noInput } from '../validators/query.mjs';

const { version } = createRequire(import.meta.url)('../../package.json');

/** Archivos de Swagger UI (versión fija) y sus hashes SHA-384. */
const swaggerUi = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14';
const integrity = {
  css: 'sha384-wxLW6kwyHktdDGr6Pv1zgm/VGJh99lfUbzSn6HNHBENZlCN7W602k9VkGdxuFvPn',
  js: 'sha384-wmyclcVGX/WhUkdkATwhaK1X1JtiNrr2EoYJ+diV3vj4v6OC5yCeSu+yW13SYJep',
};

/**
 * Arma el HTML de la página. El JSON de la especificación se escapa para que
 * ningún texto pueda cerrar la etiqueta `<script>`.
 *
 * @param {object} spec Especificación OpenAPI.
 * @param {string} nonce Valor de un solo uso que autoriza el script en línea.
 * @returns {string} Página HTML completa.
 */
function page(spec, nonce) {
  const data = JSON.stringify(spec).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>API de ExpoTec · Swagger</title>
  <link rel="stylesheet" href="${swaggerUi}/swagger-ui.css" integrity="${integrity.css}" crossorigin="anonymous">
  <style>
    body { margin: 0; background: #fff; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .wrapper { padding: 0 16px; box-sizing: border-box; }
    .swagger-ui .opblock .opblock-summary { flex-wrap: wrap; }
    .swagger-ui .opblock .opblock-summary-path { word-break: break-all; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script id="openapi" type="application/json">${data}</script>
  <script src="${swaggerUi}/swagger-ui-bundle.js" integrity="${integrity.js}" crossorigin="anonymous"></script>
  <script nonce="${nonce}">
    // Se usa la especificación incluida en la página: no hace falta pedirla con GET.
    window.ui = SwaggerUIBundle({
      spec: JSON.parse(document.getElementById('openapi').textContent),
      dom_id: '#swagger-ui',
      deepLinking: true,
      persistAuthorization: false,
      displayRequestDuration: true,
      tryItOutEnabled: false,
      docExpansion: 'none',
      defaultModelsExpandDepth: 0,
    });
  </script>
</body>
</html>`;
}

/**
 * Crea las rutas de documentación.
 *
 * @returns {import('express').Router}
 */
export function docsRoutes() {
  const router = Router();
  const spec = openApiSpec(version);

  router.get('/', (req, res) => {
    const nonce = randomBytes(16).toString('base64');
    // Política de contenido propia de esta página: solo permite Swagger UI del CDN fijado
    // y el script en línea con este nonce. Las pruebas ("Try it out") van a este mismo origen.
    res.set('Content-Security-Policy', [
      "default-src 'none'",
      `script-src ${swaggerUi}/ 'nonce-${nonce}'`,
      // Swagger UI aplica estilos en línea; sin nonce para que 'unsafe-inline' tenga efecto.
      `style-src ${swaggerUi}/ 'unsafe-inline'`,
      "img-src 'self' data:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join('; '));
    res.type('html').send(page(spec, nonce));
  });

  router.post('/openapi', (req, res) => {
    noInput(req.body);
    res.json(spec);
  });
  return router;
}
