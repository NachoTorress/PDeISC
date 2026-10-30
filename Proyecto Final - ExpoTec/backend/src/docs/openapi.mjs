/**
 * Especificación OpenAPI 3.0 de la API de ExpoTec.
 *
 * Es la fuente de la documentación interactiva (Swagger UI) que se sirve en
 * `GET /api/docs` y del archivo `docs/openapi.json` que genera
 * `npm run docs:openapi` (para importar en Postman u otros clientes).
 *
 * Se arma con funciones auxiliares para no repetir en cada operación las
 * respuestas de error, la seguridad ni los cuerpos de consulta. Al agregar o
 * cambiar una ruta en `src/routes/`, actualizar también este archivo: la
 * prueba `test/openapi.test.mjs` falla si alguna ruta queda sin documentar.
 */

/**
 * Versión del contrato. Se escribe aquí y no se lee de `package.json` porque
 * en Vercel la función no siempre incluye ese archivo y la API no arrancaría.
 * La prueba `test/openapi.test.mjs` verifica que coincida con `package.json`.
 */
export const API_VERSION = '0.5.1';

/** Referencia a un esquema de `components.schemas`. */
const ref = name => ({ $ref: `#/components/schemas/${name}` });

/** Contenido JSON de una solicitud o respuesta. */
const json = schema => ({ 'application/json': { schema } });

/** Objeto con propiedades y, opcionalmente, campos obligatorios. */
const object = (properties, required) => ({
  type: 'object',
  properties,
  ...(required?.length ? { required } : {}),
});

/** Atajos de tipos frecuentes. */
const uuid = { type: 'string', format: 'uuid', example: '3f6c1a2e-8b4d-4c1e-9a7f-2d5e6b8c9a01' };
const text = (minLength, maxLength, example) => ({ type: 'string', ...(minLength ? { minLength } : {}), maxLength, ...(example ? { example } : {}) });
const integer = (minimum, maximum, example) => ({ type: 'integer', minimum, maximum, ...(example !== undefined ? { example } : {}) });
const httpsUrl = { type: 'string', format: 'uri', maxLength: 2048, pattern: '^https://', example: 'https://expotec-web-gn19.vercel.app/api/uploads/3f6c1a2e-8b4d-4c1e-9a7f-2d5e6b8c9a01/image' };
const dateTime = { type: 'string', format: 'date-time' };
const version = { ...integer(1, 2147483646, 1), description: 'Versión leída del registro (control de cambios simultáneos).' };
const list = (items, maxItems, minItems) => ({ type: 'array', items, ...(minItems ? { minItems } : {}), ...(maxItems ? { maxItems } : {}) });

/** Cuerpos de consulta reutilizables. */
const pageFields = {
  limit: { ...integer(1, 100, 25), default: 25, description: 'Cantidad de resultados (1-100).' },
  offset: { ...integer(0, 100000, 0), default: 0, description: 'Resultados a saltear (paginación).' },
};
const emptyBody = { type: 'object', additionalProperties: false, description: 'Sin datos: enviar `{}` o no enviar cuerpo.' };
const versionBody = { ...object({ version }, ['version']), additionalProperties: false };

/** Parámetro `:id` de la ruta (UUID v4). */
const idParam = description => ({ name: 'id', in: 'path', required: true, description, schema: uuid });

/** Respuestas de error compartidas, por código HTTP. */
const errorResponses = {
  400: 'BadRequest', 401: 'Unauthorized', 403: 'Forbidden', 404: 'NotFound',
  409: 'Conflict', 413: 'TooLarge', 422: 'Unprocessable', 429: 'RateLimited', 503: 'Unavailable',
};

/**
 * Arma una operación OpenAPI.
 *
 * @param {object} options
 * @param {string} options.tag Grupo en Swagger UI.
 * @param {string} options.summary Resumen de una línea.
 * @param {string} [options.description] Detalle (Markdown).
 * @param {string} options.access Quién puede usarla (se muestra al inicio de la descripción).
 * @param {'none'|'bearer'|'refresh'|'cookie'} [options.auth] Tipo de credencial.
 * @param {object} [options.body] Esquema del cuerpo JSON.
 * @param {boolean} [options.bodyRequired] Si el cuerpo es obligatorio.
 * @param {Array} [options.params] Parámetros de ruta.
 * @param {number} [options.status] Código de éxito (200 por defecto).
 * @param {object|string} [options.ok] Esquema de la respuesta o descripción si no tiene cuerpo.
 * @param {number[]} [options.errors] Códigos de error posibles.
 * @param {string} [options.errorCodes] Códigos `error.code` propios de la operación.
 * @param {boolean} [options.limited] Si tiene límite de intentos (agrega 429).
 * @returns {object} Objeto Operation de OpenAPI.
 */
function op({ tag, summary, description = '', access, auth = 'none', body, bodyRequired = true, params, status = 200, ok, errors = [], errorCodes, limited = false }) {
  const codes = new Set([400, ...errors, ...(auth === 'bearer' ? [401] : []), ...(limited ? [429] : [])]);
  const responses = {
    [status]: typeof ok === 'string' || ok === undefined
      ? { description: ok ?? 'Operación realizada.' }
      : { description: 'Operación realizada.', content: json(ok) },
  };
  for (const code of [...codes].sort()) responses[code] = { $ref: `#/components/responses/${errorResponses[code]}` };
  return {
    tags: [tag],
    summary,
    description: [`**Acceso:** ${access}.`, description, errorCodes ? `**Códigos de error propios:** ${errorCodes}.` : ''].filter(Boolean).join('\n\n'),
    ...(params ? { parameters: params } : {}),
    ...(body ? { requestBody: { required: bodyRequired, content: json(body) } } : {}),
    security: auth === 'bearer' ? [{ bearerAuth: [] }] : auth === 'cookie' ? [{ refreshCookie: [] }] : [],
    responses,
  };
}

/** Respuesta con una propiedad que contiene una lista (`{ projects: [...] }`). */
const listOf = (key, schema) => object({ [key]: list(schema) }, [key]);
/** Respuesta con una propiedad que contiene un objeto (`{ project: {...} }`). */
const one = (key, schema) => object({ [key]: schema }, [key]);

// ---------------------------------------------------------------------------
// Esquemas de datos
// ---------------------------------------------------------------------------

const schemas = {
  Error: object({
    error: object({
      code: { type: 'string', example: 'VALIDATION_ERROR' },
      message: { type: 'string', example: 'Revisá los campos indicados.' },
      fields: { type: 'object', additionalProperties: { type: 'string' }, example: { password: 'Usá entre 12 y 128 caracteres.' } },
    }, ['code', 'message']),
    requestId: { ...uuid, description: 'Identificador de la solicitud (también en el encabezado `X-Request-Id`).' },
  }, ['error', 'requestId']),
  Role: { type: 'string', enum: ['student', 'teacher', 'loans', 'admin', 'guest'] },
  User: object({
    id: uuid,
    email: { type: 'string', format: 'email', example: 'alumno@escuela.edu.ar' },
    firstName: { type: 'string', example: 'Lucía' },
    lastName: { type: 'string', example: 'Fernández' },
    roles: list(ref('Role')),
    createdAt: dateTime,
  }, ['id', 'email', 'firstName', 'lastName', 'roles', 'createdAt']),
  Session: object({
    user: ref('User'),
    accessToken: { type: 'string', description: 'JWT de acceso (15 minutos).' },
    refreshToken: { type: 'string', description: 'JWT de renovación. No se incluye en las rutas `/browser/` (va en una cookie HttpOnly).' },
    tokenType: { type: 'string', example: 'Bearer' },
    expiresIn: { type: 'integer', example: 900 },
  }, ['user', 'accessToken', 'tokenType', 'expiresIn']),
  Login: { ...object({
    email: { type: 'string', format: 'email', maxLength: 254, example: 'alumno@escuela.edu.ar' },
    password: text(1, 128, 'Contraseña de ejemplo'),
  }, ['email', 'password']), additionalProperties: false },
  Register: { ...object({
    firstName: text(1, 80, 'Lucía'),
    lastName: text(1, 80, 'Fernández'),
    email: { type: 'string', format: 'email', maxLength: 254, example: 'alumno@escuela.edu.ar' },
    password: text(12, 128, 'Una contraseña larga'),
    accountType: { type: 'string', enum: ['student', 'guest'], default: 'student' },
  }, ['firstName', 'lastName', 'email', 'password']), additionalProperties: false },
  RefreshToken: { ...object({ refreshToken: { type: 'string', maxLength: 1024 } }, ['refreshToken']), additionalProperties: false },
  Person: object({ id: uuid, firstName: { type: 'string' }, lastName: { type: 'string' } }, ['firstName', 'lastName']),
  Furniture: object({
    id: { type: 'string', pattern: '^[A-Za-z0-9_-]{1,64}$', example: 'M1' },
    type: { type: 'string', enum: ['table', 'bench', 'power', 'label'] },
    x: { type: 'number', minimum: 0, maximum: 100, description: 'Posición horizontal en porcentaje.' },
    y: { type: 'number', minimum: 0, maximum: 100, description: 'Posición vertical en porcentaje.' },
    rotation: integer(0, 359, 0),
    width: { type: 'number', minimum: 6, maximum: 30, description: 'Solo mesas.' },
    height: { type: 'number', minimum: 4, maximum: 25, description: 'Solo mesas.' },
    text: { ...text(2, 60), description: 'Solo rótulos.' },
  }, ['id', 'type', 'x', 'y', 'rotation']),
  SpaceSummary: object({
    id: uuid, name: { type: 'string' }, description: { type: 'string' }, version: { type: 'integer' }, updatedAt: dateTime,
    furnitureCount: { type: 'integer' }, boothCount: { type: 'integer' },
  }),
  Space: object({
    id: uuid, name: { type: 'string' }, description: { type: 'string' }, version: { type: 'integer' }, updatedAt: dateTime,
    furniture: list(ref('Furniture')),
    booths: list(object({ id: uuid, furnitureId: { type: 'string' }, projectId: { ...uuid, nullable: true }, projectName: { type: 'string', nullable: true } })),
  }),
  SpaceCreate: { ...object({ name: text(2, 80, 'Laboratorio 1'), description: text(0, 150, 'Planta baja, al lado del patio') }, ['name', 'description']), additionalProperties: false },
  SpaceSave: { ...object({
    version, name: text(2, 80), description: text(0, 150),
    furniture: list(ref('Furniture'), 150),
    boothFurnitureIds: { ...list({ type: 'string' }, 150), description: 'Ids de mesas del plano que son puestos inscribibles.' },
  }, ['version', 'name', 'description', 'furniture', 'boothFurnitureIds']), additionalProperties: false },
  ProjectSummary: object({
    id: uuid, name: { type: 'string' }, course: { type: 'string' },
    status: { type: 'string', enum: ['pending', 'changes', 'approved', 'cancelled'] },
    imageUrl: { type: 'string' }, createdAt: dateTime, spaceName: { type: 'string' }, furnitureId: { type: 'string' },
  }),
  ProjectResource: object({
    resourceId: uuid, name: { type: 'string' }, quantity: { type: 'integer' }, reservedQuantity: { type: 'integer' },
    total: { type: 'integer' }, available: { type: 'integer' }, unavailable: { type: 'integer' }, outstanding: { type: 'integer' },
    archivedAt: { ...dateTime, nullable: true },
  }),
  Project: object({
    id: uuid, name: { type: 'string' }, description: { type: 'string' }, course: { type: 'string' },
    status: { type: 'string', enum: ['pending', 'changes', 'approved', 'cancelled'] },
    imageUrl: { type: 'string' }, videoUrl: { type: 'string' }, isSoftwareProject: { type: 'boolean' },
    githubUrl: { type: 'string' }, websiteUrl: { type: 'string' },
    members: list(ref('Person')), teachers: list(ref('Person')), subjects: list({ type: 'string' }),
    booth: object({ id: uuid, spaceId: uuid, spaceName: { type: 'string' }, furnitureId: { type: 'string' } }),
    createdAt: dateTime,
    creatorId: { ...uuid, description: 'Solo en la vista privada.' },
    version: { type: 'integer', description: 'Solo en la vista privada.' },
    feedback: { type: 'string' },
    resources: { ...list(ref('ProjectResource')), description: 'Solo en la vista privada.' },
    openLoanQuantity: { type: 'integer', description: 'Unidades prestadas sin devolver.' },
    reviews: list(object({ id: uuid, action: { type: 'string' }, note: { type: 'string' }, createdAt: dateTime, firstName: { type: 'string' }, lastName: { type: 'string' } })),
  }),
  PresentationProject: object({
    id: uuid, name: { type: 'string' }, description: { type: 'string' }, course: { type: 'string' },
    imageUrl: { type: 'string' }, videoUrl: { type: 'string' }, spaceName: { type: 'string' }, furnitureId: { type: 'string' },
    members: list(ref('Person')), teachers: list(ref('Person')), subjects: list({ type: 'string' }),
  }),
  Proposal: { ...object({
    name: text(2, 120, 'Estación meteorológica'),
    description: text(20, 5000, 'Medimos temperatura, humedad y presión durante el día.'),
    course: text(2, 100, '6° 1° · Informática'),
    imageUrl: httpsUrl,
    videoUrl: { type: 'string', maxLength: 2048, description: 'Vacío o enlace HTTPS directo a MP4 o WebM.', example: '' },
    isSoftwareProject: { type: 'boolean', example: true },
    githubUrl: { type: 'string', maxLength: 2048, description: 'Vacío o repositorio de github.com (solo proyectos informáticos).', example: 'https://github.com/equipo/estacion' },
    websiteUrl: { type: 'string', maxLength: 2048, description: 'Vacío o enlace HTTPS (solo proyectos informáticos).', example: '' },
    memberIds: { ...list(uuid, 12, 1), description: 'Alumnos integrantes (incluye a quien presenta).' },
    teacherIds: list(uuid, 5, 1),
    subjects: { ...list(text(2, 80), 10, 1), example: ['Programación', 'Electrónica'] },
    boothId: { ...uuid, description: 'Puesto (mesa inscribible) elegido.' },
    resources: list({ ...object({ resourceId: uuid, quantity: integer(1, 10000, 2) }, ['resourceId', 'quantity']), additionalProperties: false }, 50),
  }, ['name', 'description', 'course', 'imageUrl', 'videoUrl', 'isSoftwareProject', 'githubUrl', 'websiteUrl', 'memberIds', 'teacherIds', 'subjects', 'boothId']), additionalProperties: false },
  Review: { ...object({
    version,
    action: { type: 'string', enum: ['approve', 'changes', 'reopen'], description: '`approve` y `changes`: profesor asignado. `reopen`: administrador.' },
    note: { ...text(0, 2000), description: 'Obligatoria (10 a 2000 caracteres) salvo para aprobar.' },
  }, ['version', 'action']), additionalProperties: false },
  Resource: object({
    id: uuid, name: { type: 'string' }, description: { type: 'string' },
    total: { type: 'integer' }, reserved: { type: 'integer' }, available: { type: 'integer' },
    unavailable: { type: 'integer', description: 'Fuera de servicio.' }, outstanding: { type: 'integer', description: 'Prestadas sin devolver.' },
    availableToLend: { type: 'integer' }, shortage: { type: 'integer' }, version: { type: 'integer' },
    createdAt: dateTime, updatedAt: dateTime, archivedAt: { ...dateTime, nullable: true },
    events: { ...list(object({
      id: uuid, action: { type: 'string' }, previousTotal: { type: 'integer', nullable: true }, total: { type: 'integer' },
      previousUnavailable: { type: 'integer', nullable: true }, unavailable: { type: 'integer' }, note: { type: 'string' },
      createdAt: dateTime, firstName: { type: 'string' }, lastName: { type: 'string' },
    })), description: 'Solo en el detalle.' },
  }),
  ResourceBody: { ...object({
    name: text(2, 100, 'Proyector'),
    description: text(0, 250, 'Proyector HDMI con control remoto'),
    total: integer(0, 100000, 4),
    unavailable: { ...integer(0, 100000, 0), description: 'Unidades fuera de servicio (no más que el total).' },
    note: text(0, 1000),
  }, ['name', 'description', 'total']), additionalProperties: false },
  Loan: object({
    id: uuid, projectId: uuid, resourceId: uuid, projectName: { type: 'string' }, resourceName: { type: 'string' },
    day: integer(1, 3), quantity: { type: 'integer' }, returned: { type: 'integer' }, version: { type: 'integer' },
    recipientId: uuid, recipientFirstName: { type: 'string' }, recipientLastName: { type: 'string' },
    deliveredFirstName: { type: 'string' }, deliveredLastName: { type: 'string' }, note: { type: 'string' }, createdAt: dateTime,
    returns: { ...list(object({
      id: uuid, quantity: { type: 'integer' }, damagedQuantity: { type: 'integer' }, note: { type: 'string' },
      createdAt: dateTime, firstName: { type: 'string' }, lastName: { type: 'string' },
    })), description: 'Solo en el detalle.' },
  }),
  LendingProject: object({
    id: uuid, name: { type: 'string' }, course: { type: 'string' }, version: { type: 'integer' },
    spaceName: { type: 'string' }, furnitureId: { type: 'string' }, members: list(ref('Person')),
    resources: list(object({
      resourceId: uuid, name: { type: 'string' }, reservedQuantity: { type: 'integer' }, total: { type: 'integer' },
      unavailable: { type: 'integer' }, outstanding: { type: 'integer' }, availableToLend: { type: 'integer' },
      deliverable: { type: 'integer' }, loanId: { ...uuid, nullable: true }, archivedAt: { ...dateTime, nullable: true },
    })),
  }),
  Delivery: { ...object({
    projectId: uuid, projectVersion: version, resourceId: uuid,
    day: integer(1, 3, 1), quantity: integer(1, 10000, 2),
    recipientId: { ...uuid, description: 'Integrante del proyecto que retira.' },
    note: text(0, 1000),
  }, ['projectId', 'projectVersion', 'resourceId', 'day', 'quantity', 'recipientId']), additionalProperties: false },
  Return: { ...object({
    version,
    quantity: { ...integer(0, 10000, 2), description: '0 registra solo una novedad (exige nota).' },
    damagedQuantity: { ...integer(0, 10000, 0), default: 0, description: 'No puede superar `quantity`; si es mayor que 0, exige nota.' },
    note: text(0, 1000),
  }, ['version', 'quantity']), additionalProperties: false },
  Photo: object({
    id: uuid, imageUrl: { type: 'string' }, caption: { type: 'string' }, authorName: { type: 'string' }, createdAt: dateTime,
    status: { type: 'string', enum: ['pending', 'approved', 'rejected'] }, version: { type: 'integer' },
    updatedAt: dateTime, reviewNote: { type: 'string' },
  }),
  PhotoBody: { ...object({ imageUrl: httpsUrl, caption: text(5, 400, 'Nuestro stand en la jornada 1') }, ['imageUrl', 'caption']), additionalProperties: false },
  PhotoReview: { ...object({
    version,
    decision: { type: 'string', enum: ['approved', 'rejected'] },
    note: { ...text(0, 1000), description: 'Obligatoria (10 a 1000 caracteres) al rechazar.' },
  }, ['version', 'decision']), additionalProperties: false },
};

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

const paths = {
  // ----- Salud -----
  '/api/health': { post: op({ tag: 'Salud', summary: 'Estado del servicio', access: 'Público', description: 'No consulta la base.', ok: object({ status: { type: 'string', example: 'ok' }, service: { type: 'string', example: 'expotec-api' } }) }) },
  '/api/health/ready': { post: op({ tag: 'Salud', summary: 'Estado de la base de datos', access: 'Público', ok: object({ status: { type: 'string', example: 'ok' }, database: { type: 'string', example: 'connected' } }), errors: [503], errorCodes: '503 `DATABASE_UNAVAILABLE`' }) },

  // ----- Autenticación (app Android) -----
  '/api/auth/register': { post: op({ tag: 'Autenticación', summary: 'Registrar una cuenta de alumno o invitado', access: 'Público', body: ref('Register'), status: 201, ok: ref('Session'), errors: [409], errorCodes: '409 `EMAIL_REGISTERED`', limited: true }) },
  '/api/auth/login': { post: op({ tag: 'Autenticación', summary: 'Iniciar sesión', access: 'Público', description: 'Copiá `accessToken` de la respuesta y usalo en **Authorize** para probar las rutas protegidas.', body: ref('Login'), ok: ref('Session'), errors: [401], errorCodes: '401 `INVALID_CREDENTIALS`', limited: true }) },
  '/api/auth/refresh': { post: op({ tag: 'Autenticación', summary: 'Renovar el token de acceso', access: 'Token de renovación', description: 'Rota el token de renovación: el anterior deja de servir.', auth: 'refresh', body: ref('RefreshToken'), ok: ref('Session'), errors: [401], errorCodes: '401 `SESSION_INVALID`', limited: true }) },
  '/api/auth/logout': { post: op({ tag: 'Autenticación', summary: 'Cerrar sesión', access: 'Token de renovación', auth: 'refresh', body: ref('RefreshToken'), status: 204, ok: 'Sesión cerrada.', errors: [401], limited: true }) },
  '/api/auth/session': { post: op({ tag: 'Autenticación', summary: 'Cuenta de la sesión actual', access: 'Sesión', auth: 'bearer', body: emptyBody, bodyRequired: false, ok: one('user', ref('User')) }) },

  // ----- Autenticación (web, cookie HttpOnly) -----
  '/api/auth/browser/register': { post: op({ tag: 'Autenticación web', summary: 'Registrar (web)', access: 'Público, solo desde un origen web autorizado', description: 'El token de renovación se envía en una cookie HttpOnly; no se puede probar desde esta página porque exige el `Origin` de la web.', body: ref('Register'), status: 201, ok: ref('Session'), errors: [403, 409], errorCodes: '403 `ORIGIN_FORBIDDEN`, 409 `EMAIL_REGISTERED`', limited: true }) },
  '/api/auth/browser/login': { post: op({ tag: 'Autenticación web', summary: 'Iniciar sesión (web)', access: 'Público, solo desde un origen web autorizado', body: ref('Login'), ok: ref('Session'), errors: [401, 403], errorCodes: '401 `INVALID_CREDENTIALS`, 403 `ORIGIN_FORBIDDEN`', limited: true }) },
  '/api/auth/browser/refresh': { post: op({ tag: 'Autenticación web', summary: 'Renovar la sesión (web)', access: 'Cookie de renovación', auth: 'cookie', body: emptyBody, ok: ref('Session'), errors: [401, 403], limited: true }) },
  '/api/auth/browser/logout': { post: op({ tag: 'Autenticación web', summary: 'Cerrar sesión (web)', access: 'Cookie de renovación', auth: 'cookie', body: emptyBody, status: 204, ok: 'Sesión cerrada y cookie borrada.', errors: [403], limited: true }) },

  // ----- Accesos sociales -----
  '/api/auth/social/providers/query': { post: op({ tag: 'Accesos sociales', summary: 'Proveedores configurados', access: 'Público', body: emptyBody, bodyRequired: false, ok: object({ providers: list(object({ id: { type: 'string', enum: ['google', 'discord', 'github'] }, name: { type: 'string' } })) }), errors: [404], errorCodes: '404 `SOCIAL_DISABLED`' }) },
  '/api/auth/browser/social/start': { post: op({ tag: 'Accesos sociales', summary: 'Iniciar acceso social (web)', access: 'Público, solo desde un origen web autorizado', body: object({ provider: { type: 'string', enum: ['google', 'discord', 'github'] }, challenge: { type: 'string', pattern: '^[0-9a-f]{64}$', description: 'SHA-256 en hexadecimal de la prueba secreta.' } }, ['provider', 'challenge']), ok: object({ id: uuid, url: { type: 'string', format: 'uri' } }), errors: [403, 404], limited: true }) },
  '/api/auth/browser/social/status': { post: op({ tag: 'Accesos sociales', summary: 'Estado del acceso social (web)', access: 'Público, solo desde un origen web autorizado', body: ref('SocialProof'), ok: ref('SocialStatus'), errors: [403, 404], limited: true }) },
  '/api/auth/browser/social/complete': { post: op({ tag: 'Accesos sociales', summary: 'Completar acceso social (web)', access: 'Público, solo desde un origen web autorizado', body: ref('SocialComplete'), ok: ref('Session'), errors: [401, 403, 409], errorCodes: '409 `SOCIAL_CHANGED`, `SOCIAL_CONFLICT`', limited: true }) },
  '/api/auth/social/{provider}/callback': { get: { ...op({ tag: 'Accesos sociales', summary: 'Retorno del proveedor OAuth (excepción GET)', access: 'Proveedor OAuth', description: 'Única ruta de la API, junto con la imagen publicada, que responde a GET: el proveedor redirige el navegador aquí según el estándar OAuth 2.0. No la llama la app.', params: [{ name: 'provider', in: 'path', required: true, schema: { type: 'string', enum: ['google', 'discord', 'github'] } }, { name: 'state', in: 'query', required: true, schema: { type: 'string' } }, { name: 'code', in: 'query', required: true, schema: { type: 'string' } }], status: 303, ok: 'Redirige a la web (`#social=<id>`) o a la app (`expotec://auth`).', limited: true }) } },
  '/api/auth/social/status': { post: op({ tag: 'Accesos sociales', summary: 'Estado del acceso social (Android)', access: 'Público', description: 'Usa POST porque envía la prueba secreta del flujo.', body: ref('SocialProof'), ok: ref('SocialStatus'), errors: [404], limited: true }) },
  '/api/auth/social/complete': { post: op({ tag: 'Accesos sociales', summary: 'Completar acceso social (Android)', access: 'Público', body: ref('SocialComplete'), ok: ref('Session'), errors: [401, 409], errorCodes: '409 `SOCIAL_CHANGED`, `SOCIAL_CONFLICT`', limited: true }) },
  '/api/auth/social/google/native/start': { post: op({ tag: 'Accesos sociales', summary: 'Iniciar Google nativo (Android)', access: 'Público', body: object({ challenge: { type: 'string', pattern: '^[0-9a-f]{64}$' } }, ['challenge']), ok: object({ id: uuid, nonce: { type: 'string' }, webClientId: { type: 'string' } }), errors: [404], limited: true }) },
  '/api/auth/social/google/native/verify': { post: op({ tag: 'Accesos sociales', summary: 'Verificar Google nativo (Android)', access: 'Público', body: object({ id: uuid, proof: { type: 'string' }, idToken: { type: 'string' } }, ['id', 'proof', 'idToken']), ok: object({ id: uuid }), errors: [404], limited: true }) },

  // ----- Recuperación de contraseña -----
  '/api/auth/recovery/query': { post: op({ tag: 'Recuperación de contraseña', summary: 'Saber si la recuperación está habilitada', access: 'Público', body: emptyBody, bodyRequired: false, ok: object({ enabled: { type: 'boolean' } }) }) },
  '/api/auth/recovery/request': { post: op({ tag: 'Recuperación de contraseña', summary: 'Pedir el enlace por correo', access: 'Público', description: 'Responde lo mismo exista o no la cuenta. Límites: 3 pedidos por correo y 15 por IP cada hora.', body: object({ email: { type: 'string', format: 'email', maxLength: 254 } }, ['email']), status: 202, ok: object({ message: { type: 'string' } }), errors: [503], errorCodes: '503 `RECOVERY_UNAVAILABLE`', limited: true }) },
  '/api/auth/recovery/complete': { post: op({ tag: 'Recuperación de contraseña', summary: 'Elegir la contraseña nueva', access: 'Público (token del enlace)', description: 'El enlace vence a los 20 minutos y sirve una sola vez. Cierra todas las sesiones de la cuenta.', body: object({ token: { type: 'string', pattern: '^[A-Za-z0-9_-]{43}$' }, password: text(12, 128), confirmation: text(12, 128) }, ['token', 'password', 'confirmation']), ok: object({ message: { type: 'string' } }), errorCodes: '400 `RESET_INVALID`', limited: true }) },

  // ----- Usuarios y roles -----
  '/api/admin/users/query': { post: op({ tag: 'Usuarios', summary: 'Buscar cuentas', access: 'Administrador', auth: 'bearer', body: object({ ...pageFields, search: { ...text(0, 100), description: 'Nombre o correo.' } }), bodyRequired: false, ok: listOf('users', ref('User')), errors: [403] }) },
  '/api/admin/users/{id}/query': { post: op({ tag: 'Usuarios', summary: 'Ver una cuenta', access: 'Administrador', auth: 'bearer', params: [idParam('Id de la cuenta.')], body: emptyBody, bodyRequired: false, ok: one('user', ref('User')), errors: [403, 404], errorCodes: '404 `USER_NOT_FOUND`' }) },
  '/api/admin/users/{id}/roles': { put: op({ tag: 'Usuarios', summary: 'Reemplazar los roles de una cuenta', access: 'Administrador', auth: 'bearer', params: [idParam('Id de la cuenta.')], body: object({ roles: { ...list(ref('Role'), 5, 1), uniqueItems: true }, expectedRoles: { ...list(ref('Role'), 5), uniqueItems: true, description: 'Roles leídos antes de editar.' } }, ['roles', 'expectedRoles']), ok: one('user', ref('User')), errors: [403, 404, 409], errorCodes: '409 `ROLES_CHANGED`, `LAST_ADMIN`' }) },

  // ----- Espacios -----
  '/api/spaces/query': { post: op({ tag: 'Espacios', summary: 'Listar espacios', access: 'Público', body: emptyBody, bodyRequired: false, ok: listOf('spaces', ref('SpaceSummary')) }) },
  '/api/spaces/{id}/query': { post: op({ tag: 'Espacios', summary: 'Ver un espacio con su plano', access: 'Público', params: [idParam('Id del espacio.')], body: emptyBody, bodyRequired: false, ok: one('space', ref('Space')), errors: [404], errorCodes: '404 `SPACE_NOT_FOUND`' }) },
  '/api/spaces': { post: op({ tag: 'Espacios', summary: 'Crear un espacio', access: 'Administrador', auth: 'bearer', body: ref('SpaceCreate'), status: 201, ok: one('space', ref('Space')), errors: [403, 409], errorCodes: '409 `SPACE_LIMIT` (100 activos)' }) },
  '/api/spaces/{id}': {
    put: op({ tag: 'Espacios', summary: 'Guardar el espacio y su plano', access: 'Administrador', auth: 'bearer', params: [idParam('Id del espacio.')], body: ref('SpaceSave'), ok: one('space', ref('Space')), errors: [403, 404, 409, 413], errorCodes: '409 `SPACE_CHANGED`, `SPACE_IN_USE`, `FURNITURE_ID_RESERVED`' }),
    delete: op({ tag: 'Espacios', summary: 'Dar de baja un espacio', access: 'Administrador', auth: 'bearer', params: [idParam('Id del espacio.')], body: versionBody, status: 204, ok: 'Espacio dado de baja.', errors: [403, 404, 409], errorCodes: '409 `SPACE_CHANGED`, `SPACE_IN_USE`' }),
  },

  // ----- Proyectos -----
  '/api/projects/public/query': { post: op({ tag: 'Proyectos', summary: 'Proyectos confirmados', access: 'Público', body: object(pageFields), bodyRequired: false, ok: listOf('projects', ref('ProjectSummary')) }) },
  '/api/projects/public/{id}/query': { post: op({ tag: 'Proyectos', summary: 'Ficha pública de un proyecto confirmado', access: 'Público', params: [idParam('Id del proyecto.')], body: emptyBody, bodyRequired: false, ok: one('project', ref('Project')), errors: [404], errorCodes: '404 `PROJECT_NOT_FOUND`' }) },
  '/api/projects/presentation/query': { post: op({ tag: 'Proyectos', summary: 'Página de la presentación TV', access: 'Público', body: object({ limit: { ...integer(1, 100, 100), default: 100 }, after: { ...uuid, description: 'Cursor: id del último proyecto recibido.' } }), bodyRequired: false, ok: object({ projects: list(ref('PresentationProject')), nextCursor: { ...uuid, nullable: true } }) }) },
  '/api/projects/query': { post: op({ tag: 'Proyectos', summary: 'Mis proyectos', access: 'Sesión', description: 'Propios (alumno), asignados (profesor) o todos (administrador).', auth: 'bearer', body: object(pageFields), bodyRequired: false, ok: listOf('projects', ref('ProjectSummary')) }) },
  '/api/projects/people/find': { post: op({ tag: 'Proyectos', summary: 'Buscar un compañero o profesor por correo', access: 'Alumno o administrador', auth: 'bearer', body: object({ email: { type: 'string', format: 'email', maxLength: 254 }, role: { type: 'string', enum: ['student', 'teacher'] } }, ['email', 'role']), ok: one('person', ref('Person')), errors: [403, 404], errorCodes: '404 `PERSON_NOT_FOUND`' }) },
  '/api/projects/{id}/query': { post: op({ tag: 'Proyectos', summary: 'Ficha privada de un proyecto', access: 'Integrante, profesor asignado o administrador', auth: 'bearer', params: [idParam('Id del proyecto.')], body: emptyBody, bodyRequired: false, ok: one('project', ref('Project')), errors: [403, 404], errorCodes: '404 `PROJECT_NOT_FOUND`' }) },
  '/api/projects': { post: op({ tag: 'Proyectos', summary: 'Presentar una propuesta', access: 'Alumno', auth: 'bearer', body: ref('Proposal'), status: 201, ok: one('project', ref('Project')), errors: [403, 409, 413], errorCodes: '400 `PARTICIPANTS_INVALID`; 409 `BOOTH_UNAVAILABLE`, `RESOURCE_UNAVAILABLE`' }) },
  '/api/projects/{id}': {
    put: op({ tag: 'Proyectos', summary: 'Editar y reenviar una propuesta', access: 'Integrante (alumno)', auth: 'bearer', params: [idParam('Id del proyecto.')], body: { allOf: [ref('Proposal'), object({ version }, ['version'])] }, ok: one('project', ref('Project')), errors: [403, 404, 409, 413], errorCodes: '409 `PROJECT_CHANGED`, `PROJECT_LOCKED`' }),
    delete: op({ tag: 'Proyectos', summary: 'Cancelar un proyecto', access: 'Integrante o administrador', description: 'Baja lógica: conserva el historial y libera el puesto y las reservas.', auth: 'bearer', params: [idParam('Id del proyecto.')], body: versionBody, ok: one('project', ref('Project')), errors: [403, 404, 409], errorCodes: '409 `PROJECT_CHANGED`, `PROJECT_HAS_LOANS`' }),
  },
  '/api/projects/{id}/reviews': { post: op({ tag: 'Proyectos', summary: 'Revisar un proyecto', access: 'Profesor asignado (`approve`, `changes`) o administrador (`reopen`)', description: 'Confirmar asigna el puesto y reserva los elementos en una sola transacción.', auth: 'bearer', params: [idParam('Id del proyecto.')], body: ref('Review'), ok: one('project', ref('Project')), errors: [403, 404, 409], errorCodes: '409 `PROJECT_CHANGED`, `BOOTH_OCCUPIED`, `RESOURCE_STOCK`, `PROJECT_HAS_LOANS`' }) },

  // ----- Inventario -----
  '/api/inventory/catalog/query': { post: op({ tag: 'Inventario', summary: 'Catálogo para pedir en propuestas', access: 'Alumno, profesor, préstamos o administrador', auth: 'bearer', body: emptyBody, bodyRequired: false, ok: listOf('resources', ref('Resource')), errors: [403] }) },
  '/api/inventory/query': { post: op({ tag: 'Inventario', summary: 'Listar el inventario', access: 'Préstamos o administrador', auth: 'bearer', body: object({ ...pageFields, archived: { type: 'boolean', default: false, description: 'true muestra los dados de baja.' } }), bodyRequired: false, ok: listOf('resources', ref('Resource')), errors: [403] }) },
  '/api/inventory/{id}/query': { post: op({ tag: 'Inventario', summary: 'Ver un elemento con su historial', access: 'Préstamos o administrador', auth: 'bearer', params: [idParam('Id del elemento.')], body: emptyBody, bodyRequired: false, ok: one('resource', ref('Resource')), errors: [403, 404], errorCodes: '404 `RESOURCE_NOT_FOUND`' }) },
  '/api/inventory': { post: op({ tag: 'Inventario', summary: 'Agregar un elemento', access: 'Administrador', auth: 'bearer', body: ref('ResourceBody'), status: 201, ok: one('resource', ref('Resource')), errors: [403, 409], errorCodes: '409 `RESOURCE_NAME_EXISTS`, `RESOURCE_LIMIT`' }) },
  '/api/inventory/{id}': {
    put: op({ tag: 'Inventario', summary: 'Editar un elemento', access: 'Administrador', auth: 'bearer', params: [idParam('Id del elemento.')], body: { allOf: [ref('ResourceBody'), object({ version }, ['version'])] }, ok: one('resource', ref('Resource')), errors: [403, 404, 409], errorCodes: '409 `RESOURCE_CHANGED`, `RESOURCE_IN_USE`, `RESOURCE_NAME_EXISTS`' }),
    delete: op({ tag: 'Inventario', summary: 'Dar de baja un elemento', access: 'Administrador', auth: 'bearer', params: [idParam('Id del elemento.')], body: versionBody, status: 204, ok: 'Elemento dado de baja.', errors: [403, 404, 409], errorCodes: '409 `RESOURCE_CHANGED`, `RESOURCE_RESERVED`, `RESOURCE_HAS_LOANS`' }),
  },

  // ----- Préstamos -----
  '/api/loans/query': { post: op({ tag: 'Préstamos', summary: 'Listar préstamos', access: 'Préstamos o administrador', auth: 'bearer', body: object({ ...pageFields, day: { ...integer(1, 3), description: 'Jornada.' }, openOnly: { type: 'boolean', default: false, description: 'Solo con unidades sin devolver.' } }), bodyRequired: false, ok: object({ loans: list(ref('Loan')), summary: object({ pendingCount: { type: 'integer' }, pendingQuantity: { type: 'integer' } }) }), errors: [403] }) },
  '/api/loans/projects/query': { post: op({ tag: 'Préstamos', summary: 'Proyectos confirmados y lo que pueden retirar', access: 'Préstamos o administrador', auth: 'bearer', body: object({ ...pageFields, day: integer(1, 3, 1) }, ['day']), ok: listOf('projects', ref('LendingProject')), errors: [403] }) },
  '/api/loans/{id}/query': { post: op({ tag: 'Préstamos', summary: 'Ver un préstamo con sus devoluciones', access: 'Préstamos o administrador', auth: 'bearer', params: [idParam('Id del préstamo.')], body: emptyBody, bodyRequired: false, ok: one('loan', ref('Loan')), errors: [403, 404], errorCodes: '404 `LOAN_NOT_FOUND`' }) },
  '/api/loans': { post: op({ tag: 'Préstamos', summary: 'Registrar una entrega', access: 'Préstamos o administrador', description: 'Una sola entrega por proyecto, elemento y jornada.', auth: 'bearer', body: ref('Delivery'), status: 201, ok: one('loan', ref('Loan')), errors: [403, 404, 409], errorCodes: '400 `RECIPIENT_INVALID`; 409 `ALREADY_DELIVERED`, `LOAN_STOCK`, `PROJECT_LOAN_LIMIT`, `PROJECT_CHANGED`, `PROJECT_NOT_APPROVED`' }) },
  '/api/loans/{id}/returns': { post: op({ tag: 'Préstamos', summary: 'Registrar una devolución o novedad', access: 'Préstamos o administrador', description: 'Las unidades dañadas quedan fuera de servicio en el inventario.', auth: 'bearer', params: [idParam('Id del préstamo.')], body: ref('Return'), ok: one('loan', ref('Loan')), errors: [403, 404, 409], errorCodes: '409 `LOAN_CHANGED`, `RETURN_EXCEEDS_LOAN`' }) },

  // ----- Galería -----
  '/api/gallery/public/query': { post: op({ tag: 'Galería', summary: 'Fotos aprobadas', access: 'Público', body: object(pageFields), bodyRequired: false, ok: listOf('photos', ref('Photo')) }) },
  '/api/gallery/mine/query': { post: op({ tag: 'Galería', summary: 'Mis fotos con su estado', access: 'Sesión', auth: 'bearer', body: object(pageFields), bodyRequired: false, ok: listOf('photos', ref('Photo')) }) },
  '/api/gallery': { post: op({ tag: 'Galería', summary: 'Enviar una foto a moderación', access: 'Sesión', auth: 'bearer', body: ref('PhotoBody'), status: 201, ok: one('photo', ref('Photo')), errors: [409], errorCodes: '400 `IMAGE_NOT_AVAILABLE`; 409 `GALLERY_PENDING_LIMIT` (20 pendientes)' }) },
  '/api/gallery/moderation/query': { post: op({ tag: 'Galería', summary: 'Fotos para moderar', access: 'Administrador', auth: 'bearer', body: object({ ...pageFields, status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'all'], default: 'pending' } }), bodyRequired: false, ok: listOf('photos', ref('Photo')), errors: [403] }) },
  '/api/gallery/{id}': { patch: op({ tag: 'Galería', summary: 'Aprobar o rechazar una foto', access: 'Administrador', auth: 'bearer', params: [idParam('Id de la foto.')], body: ref('PhotoReview'), ok: one('photo', ref('Photo')), errors: [403, 404, 409], errorCodes: '409 `PHOTO_CHANGED`, `PHOTO_ALREADY_REVIEWED`' }) },

  // ----- Fotos -----
  '/api/uploads': { post: op({ tag: 'Fotos', summary: 'Preparar la carga de una foto', access: 'Sesión (alumno para `project`)', description: 'Devuelve un token para subir el archivo directamente al almacenamiento privado (válido 10 minutos). Límite: 20 por hora.', auth: 'bearer', body: object({ purpose: { type: 'string', enum: ['gallery', 'project'] }, contentType: { type: 'string', enum: ['image/jpeg', 'image/png', 'image/webp'] }, size: { ...integer(1, 10485760), description: 'Bytes (hasta 10 MB).' } }, ['purpose', 'contentType', 'size']), status: 201, ok: object({ id: uuid, pathname: { type: 'string' }, clientToken: { type: 'string' } }), errors: [403, 503], errorCodes: '503 `UPLOADS_UNAVAILABLE`', limited: true }) },
  '/api/uploads/{id}/complete': { post: op({ tag: 'Fotos', summary: 'Confirmar la carga', access: 'Dueño de la carga', description: 'Valida el contenido real y lo optimiza a JPEG de hasta 1600 px.', auth: 'bearer', params: [idParam('Id de la carga.')], body: emptyBody, bodyRequired: false, ok: object({ imageUrl: httpsUrl }), errors: [404, 409, 422, 503], errorCodes: '409 `UPLOAD_CHANGED`; 422 `IMAGE_INVALID`; 503 `UPLOAD_FAILED`', limited: true }) },
  '/api/uploads/preview': { post: op({ tag: 'Fotos', summary: 'Vista previa de una imagen privada', access: 'Dueño o administrador', auth: 'bearer', body: object({ imageUrl: httpsUrl }, ['imageUrl']), ok: object({ image: { type: 'string', description: 'Imagen en base64 (data URL).' } }), errors: [403, 404], errorCodes: '404 `IMAGE_NOT_FOUND`', limited: true }) },
  '/api/uploads/{id}/image': { get: op({ tag: 'Fotos', summary: 'Imagen publicada (excepción GET)', access: 'Público', description: 'La muestran las etiquetas de imagen del navegador y del teléfono, que solo pueden pedir con GET. Solo entrega imágenes de proyectos confirmados o fotos aprobadas.', params: [idParam('Id de la imagen.')], ok: 'Imagen JPEG (`image/jpeg`).', errors: [404], errorCodes: '404 `IMAGE_NOT_FOUND`' }) },
};

// Cuerpos compartidos por las variantes web y Android de los accesos sociales.
Object.assign(schemas, {
  SocialProof: object({ id: uuid, proof: { type: 'string', description: 'Prueba secreta cuyo hash se envió al iniciar.' } }, ['id', 'proof']),
  SocialStatus: object({ provider: { type: 'string' }, email: { type: 'string', format: 'email' }, mode: { type: 'string', enum: ['login', 'link', 'signup'] } }),
  SocialComplete: object({
    id: uuid, proof: { type: 'string' }, mode: { type: 'string', enum: ['login', 'link', 'signup'] },
    password: { ...text(1, 128), description: '`link`: contraseña de ExpoTec. `signup`: contraseña nueva (12-128).' },
    firstName: { ...text(1, 80), description: 'Solo `signup`.' },
    lastName: { ...text(1, 80), description: 'Solo `signup`.' },
    accountType: { type: 'string', enum: ['student', 'guest'], description: 'Solo `signup`.' },
  }, ['id', 'proof', 'mode']),
});

/** Respuesta de error con ejemplo propio. */
const errorResponse = (description, code, message) => ({
  description,
  content: json({ ...ref('Error'), example: { error: { code, message }, requestId: '4d0f2c6e-0b1e-4d2a-9b7f-6c1f0c2a9e51' } }),
});

/**
 * Especificación completa.
 *
 * @param {string} [version] Versión de la API.
 * @returns {object} Documento OpenAPI 3.0.3.
 */
export function openApiSpec(version = API_VERSION) {
  return {
    openapi: '3.0.3',
    info: {
      title: 'API de ExpoTec',
      version,
      description: [
        'Backend de la aplicación ExpoTec (E.E.S.T. N° 5 Amancio Williams).',
        '**Sin GET:** las consultas usan `POST` con sus filtros en el cuerpo JSON (rutas terminadas en `/query`). Para crear se usa POST, para reemplazar PUT, para cambios parciales PATCH y para bajas DELETE con `{ "version": n }` en el cuerpo. Solo la imagen publicada, el retorno OAuth y esta página responden a GET.',
        '**Probar rutas protegidas:** ejecutá `POST /api/auth/login`, copiá `accessToken` y pegalo en **Authorize**. El token dura 15 minutos.',
        '**Errores:** siempre `{ error: { code, message, fields? }, requestId }`. `message` está en español y se puede mostrar al usuario.',
      ].join('\n\n'),
    },
    servers: [
      { url: '/', description: 'Este servidor' },
      { url: 'https://expotec-api-gn19.vercel.app', description: 'Producción' },
      { url: 'http://localhost:3001', description: 'Desarrollo local' },
    ],
    tags: ['Salud', 'Autenticación', 'Autenticación web', 'Accesos sociales', 'Recuperación de contraseña', 'Usuarios', 'Espacios', 'Proyectos', 'Inventario', 'Préstamos', 'Galería', 'Fotos'].map(name => ({ name })),
    paths,
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: '`accessToken` devuelto por el ingreso, el registro o la renovación.' },
        refreshCookie: { type: 'apiKey', in: 'cookie', name: '__Secure-expotec-refresh', description: 'Cookie HttpOnly de la variante web (`expotec-refresh` en desarrollo).' },
      },
      responses: {
        BadRequest: errorResponse('Datos inválidos, incompletos o campos no admitidos.', 'VALIDATION_ERROR', 'Revisá los campos indicados.'),
        Unauthorized: errorResponse('Sin sesión, token vencido o credenciales incorrectas.', 'SESSION_INVALID', 'Tu sesión venció. Volvé a ingresar.'),
        Forbidden: errorResponse('El rol no alcanza o el origen web no está autorizado.', 'FORBIDDEN', 'Tu cuenta no tiene permiso para esta acción.'),
        NotFound: errorResponse('Registro inexistente o sin acceso.', 'NOT_FOUND', 'No encontramos esa operación.'),
        Conflict: errorResponse('Conflicto con el estado actual (cambio simultáneo, stock, puesto ocupado o límite).', 'PROJECT_CHANGED', 'Otra persona modificó el proyecto. Recargá antes de guardar.'),
        TooLarge: errorResponse('El cuerpo supera el límite de la ruta.', 'BODY_TOO_LARGE', 'La solicitud supera los 64 KB permitidos.'),
        Unprocessable: errorResponse('El archivo no es una imagen válida.', 'IMAGE_INVALID', 'El archivo no es una imagen válida.'),
        RateLimited: {
          ...errorResponse('Demasiados intentos. Esperar los segundos indicados en `Retry-After`.', 'RATE_LIMITED', 'Hiciste demasiados intentos. Esperá unos minutos.'),
          headers: { 'Retry-After': { description: 'Segundos a esperar.', schema: { type: 'integer' } } },
        },
        Unavailable: errorResponse('Base de datos o servicio externo no disponible.', 'DATABASE_UNAVAILABLE', 'La base no está disponible. Probá de nuevo más tarde.'),
      },
      schemas,
    },
  };
}
