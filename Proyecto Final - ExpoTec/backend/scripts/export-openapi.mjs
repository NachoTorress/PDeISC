/**
 * Genera `docs/openapi.json` (en la carpeta del proyecto) a partir de
 * `src/docs/openapi.mjs`, para importar la API en Postman, Insomnia u otro
 * cliente. Uso: `npm run docs:openapi` desde `backend/`.
 */
import { writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { openApiSpec } from '../src/docs/openapi.mjs';

const { version } = createRequire(import.meta.url)('../package.json');
const target = new URL('../../docs/openapi.json', import.meta.url);
await writeFile(target, `${JSON.stringify(openApiSpec(version), null, 2)}\n`);
console.log(`Especificación OpenAPI ${version} guardada en docs/openapi.json`);
