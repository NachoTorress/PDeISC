/**
 * Pruebas de la documentación OpenAPI y de la página de Swagger UI.
 *
 * Comprueban que cada ruta declarada en `src/routes/` (y las de salud de
 * `create-app.mjs`) figure en la especificación con el mismo método, que no
 * se documenten rutas inexistentes y que la página `/api/docs` se sirva con su
 * política de contenido propia.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { openApiSpec, API_VERSION } from '../src/docs/openapi.mjs';
import { createApp } from '../src/create-app.mjs';

const source = file => readFile(new URL(`../src/${file}`, import.meta.url), 'utf8');

/** Prefijo de montaje de cada enrutador según el archivo y la variable. */
async function declaredRoutes() {
  const routes = new Set();
  const add = (method, prefix, path) => {
    const full = (prefix + (path === '/' ? '' : path)).replace(/:(\w+)/g, '{$1}');
    routes.add(`${method.toUpperCase()} ${full}`);
  };
  const scan = (text, variable, prefix) => {
    for (const [, method, path] of text.matchAll(new RegExp(`\\b${variable}\\.(get|post|put|patch|delete)\\('([^']+)'`, 'g')))
      add(method, prefix, path);
  };
  const auth = await source('routes/auth.mjs');
  const [authPart, adminPart] = auth.split('export function adminRoutes');
  scan(authPart, 'router', '/api/auth');
  scan(authPart, 'browser', '/api/auth/browser');
  scan(adminPart, 'router', '/api/admin');
  for (const [file, prefix] of [['recovery', '/api/auth/recovery'], ['spaces', '/api/spaces'], ['projects', '/api/projects'], ['inventory', '/api/inventory'], ['loans', '/api/loans'], ['gallery', '/api/gallery'], ['uploads', '/api/uploads']])
    scan(await source(`routes/${file}.mjs`), 'router', prefix);
  scan(await source('create-app.mjs'), 'app', '');
  return routes;
}

/** Operaciones documentadas como "MÉTODO /ruta". */
function documentedRoutes(spec) {
  return new Set(Object.entries(spec.paths).flatMap(([path, item]) => Object.keys(item).map(method => `${method.toUpperCase()} ${path}`)));
}

test('cada ruta de la API está documentada y no sobra ninguna', async () => {
  const declared = await declaredRoutes();
  const documented = documentedRoutes(openApiSpec());
  assert.ok(declared.size > 50, 'se encontraron las rutas declaradas');
  assert.deepEqual([...declared].filter(route => !documented.has(route)), [], 'rutas sin documentar');
  assert.deepEqual([...documented].filter(route => !declared.has(route)), [], 'rutas documentadas que no existen');
});

test('solo la imagen publicada y el retorno OAuth usan GET', () => {
  const gets = [...documentedRoutes(openApiSpec())].filter(route => route.startsWith('GET '));
  assert.deepEqual(gets.sort(), ['GET /api/auth/social/{provider}/callback', 'GET /api/uploads/{id}/image']);
});

test('todas las referencias de la especificación existen', () => {
  const spec = openApiSpec();
  const refs = JSON.stringify(spec).match(/#\/components\/[a-zA-Z]+\/[A-Za-z]+/g);
  for (const ref of new Set(refs)) {
    const [, , group, name] = ref.split('/');
    assert.ok(spec.components[group]?.[name], `falta ${ref}`);
  }
});

test('GET /api/docs sirve Swagger UI con la especificación incluida', async () => {
  const app = createApp({ ready: async () => {} }, { origins: ['http://localhost:8081'], onVercel: false }, { error() {} });
  const server = app.listen(0);
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const page = await fetch(`${base}/api/docs`);
    assert.equal(page.status, 200);
    assert.match(page.headers.get('content-type'), /text\/html/);
    const csp = page.headers.get('content-security-policy');
    assert.match(csp, /script-src https:\/\/cdn\.jsdelivr\.net\/npm\/swagger-ui-dist@5\.17\.14\/ 'nonce-/);
    const html = await page.text();
    assert.match(html, /integrity="sha384-/);
    assert.match(html, /"openapi":"3\.0\.3"/);

    const spec = await fetch(`${base}/api/docs/openapi`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(spec.status, 200);
    assert.equal((await spec.json()).info.title, 'API de ExpoTec');

    // "Try it out" desde la propia página: el mismo origen de la API es aceptado.
    const sameOrigin = await fetch(`${base}/api/health`, { method: 'POST', headers: { Origin: base } });
    assert.equal(sameOrigin.status, 200);
    const foreign = await fetch(`${base}/api/health`, { method: 'POST', headers: { Origin: 'https://otro.example' } });
    assert.equal(foreign.status, 403);
  } finally {
    server.close();
  }
});

test('la versión de la especificación coincide con package.json', async () => {
  const { version } = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(API_VERSION, version);
});
