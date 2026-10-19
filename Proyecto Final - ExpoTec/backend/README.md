# ExpoTec API — cuentas y sesiones

Backend Node.js 24 + Express 5 con módulos import/export. Implementa cuentas locales, sesiones y permisos; usa mysql2 y SQL relacional compatible con MySQL/TiDB. Desde el hito 7B, la pantalla **Mi cuenta** utiliza esta API. Los datos de proyectos, espacios y préstamos todavía pertenecen a la demostración local.

## Sesión web — hito 7B

Las rutas nativas existentes mantienen su contrato JSON con `refreshToken`. La web utiliza estas rutas adicionales, con `Content-Type: application/json`, `credentials: include` y un encabezado `Origin` exacto autorizado en `CORS_ORIGINS`:

| Método y ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| POST `/api/auth/browser/register` | `firstName`, `lastName`, `email`, `password` | 201: usuario, `accessToken`, `tokenType`, `expiresIn`; cookie de renovación |
| POST `/api/auth/browser/login` | `email`, `password` | 200: mismo formato y cookie |
| POST `/api/auth/browser/refresh` | `{}` y cookie vigente | 200: sesión renovada y cookie rotada |
| POST `/api/auth/browser/logout` | `{}` y cookie, si existe | 204: revoca la sesión y elimina la cookie; admite ausencia o expiración |

Estas respuestas nunca incluyen `refreshToken` en el JSON. La cookie es HttpOnly, SameSite=Strict, sin Domain y con ruta `/api/auth/browser`. En producción se llama `__Secure-expotec-refresh` y exige Secure; en desarrollo HTTP se llama `expotec-refresh`. Su duración máxima es de 30 días; la expiración absoluta registrada en TiDB sigue siendo la autoridad. Una renovación inválida elimina la cookie. Si la base falla durante el cierre, la operación informa el error para permitir reintentar la revocación.

Las rutas web rechazan Origin ausente, `null` o ajeno y tipos de contenido distintos de JSON. Se aplican los mismos límites de intentos y validaciones que a las rutas nativas. Consultar la cuenta y los permisos actuales sigue usando POST `/api/auth/session` con Bearer y `{}`. La configuración CORS permite credenciales exclusivamente para los orígenes explícitos.

El frontend Vercel reenvía `/api/:path*` a la API para que la cookie permanezca en el origen de la web. No usar la URL de otro dominio Vercel como base del cliente web: sería una cookie entre sitios. En desarrollo, usar el mismo hostname en ambos servicios o la vista previa con proxy. Las renovaciones del cliente se serializan; en navegadores con Web Locks también entre pestañas.

Comprobación del 19/10/2026: 20 pruebas locales de backend aprobadas, incluidas cookie de producción, rechazo de solicitudes entre sitios, rotación, eliminación y revocación. No hubo cambios de esquema SQL en este hito.

## Preparación local

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Completar `JWT_SECRET`, `CORS_ORIGINS` y `DB_` en `.env`. La clave se genera con el comando indicado en `.env.example`. No compartir `.env` ni cargar variables `DB_` o `JWT_SECRET` en Expo o en el proyecto frontend de Vercel.

Si se usa MySQL local, configurar `DB_PORT=3306` y, únicamente para desarrollo local, `DB_SSL=false`. Para TiDB Cloud usar los datos completos de **Connect**, normalmente puerto 4000, y `DB_SSL=true`. La verificación del certificado está habilitada. `DB_SSL_CA` permite indicar el PEM cuando la instalación lo requiere; nunca se deshabilita `rejectUnauthorized`.

La configuración local ya dispone de `expotec` en TiDB y de un usuario de aplicación con SELECT/INSERT/UPDATE/DELETE. Las credenciales administrativas se conservan aparte en `.env.setup`, ignorado por Git. Las tareas `db:migrate` y `test:database` cargan ese archivo cuando existe; el servidor y `db:check` usan exclusivamente `.env`. No se necesita `JWT_SECRET` para las tareas `db:*`, pero sí para iniciar la API.

Para otra instalación, crear la base con una cuenta autorizada o copiar `.env.setup.example` a `.env.setup`, completar sus credenciales y ejecutar `npm run db:setup`. `.env` debe indicar `DB_NAME=expotec`, una base de pruebas `expotec_test_...` y un usuario propio con contraseña generada. La preparación crea las bases y concede a ese usuario acceso de lectura/escritura únicamente a `expotec`; no cambia contraseñas de cuentas existentes.

```powershell
npm run db:check
npm run db:migrate
npm run dev
```

Las migraciones se ejecutan como una tarea explícita, nunca al recibir una solicitud web. Cada archivo queda registrado con su checksum. No editar una migración aplicada: agregar otra. El DDL de MySQL/TiDB no ofrece rollback del archivo completo; las sentencias de la primera migración son repetibles para poder retomar una aplicación interrumpida. Ejecutar una sola migración a la vez.

La API escucha por defecto en `http://localhost:3001`. Ejemplo sin credenciales:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/health -ContentType application/json -Body '{}'
```

## Contrato de la API

Las consultas de datos también utilizan POST, conservando la restricción registrada de no usar GET. OPTIONS atiende los preflight del navegador. La aceptación de este criterio para la consigna sigue pendiente; la carga de archivos de la web usa los métodos normales del hosting.

| Método y ruta | Acceso | Cuerpo JSON | Respuesta |
| --- | --- | --- | --- |
| POST `/api/health` | Público | `{}` | 200: servicio activo; no comprueba la base |
| POST `/api/health/ready` | Público | `{}` | 200: conexión comprobada; 503: base no disponible |
| POST `/api/auth/register` | Público, limitado | `firstName`, `lastName`, `email`, `password` | 201: usuario y tokens; 409: correo existente |
| POST `/api/auth/login` | Público, limitado | `email`, `password` | 200: usuario y tokens; 401: credenciales incorrectas |
| POST `/api/auth/refresh` | JWT de renovación, limitado | `refreshToken` | 200: usuario y nuevo par de tokens; 401: token vencido, usado o revocado |
| POST `/api/auth/logout` | Token de renovación, limitado | `refreshToken` | 204: cierre idempotente de esa sesión |
| POST `/api/auth/session` | Bearer JWT válido | `{}` | 200: `{ "user": ... }`; 401: sesión inválida |
| POST `/api/admin/users/query` | Administrador | `limit` opcional (1–100, default 25), `offset` opcional (0–100000, default 0) | 200: `{ "users": [...] }` |
| PATCH `/api/admin/users/:id/roles` | Administrador | `roles`: lista sin duplicados de `student`, `teacher`, `loans`, `admin` | 200: usuario actualizado; 404: cuenta inexistente; 409: último administrador |

Los campos no listados se rechazan. El identificador del usuario es UUID v4. La cuenta nueva siempre recibe `student`; no acepta `role`, `roles` ni `active` desde el registro. Una cuenta puede acumular permisos, por ejemplo profesor y encargado de préstamos, sin concedérselos por sí misma.

El registro valida nombres Unicode, espacios y apóstrofes, correo de hasta 254 caracteres y contraseña de 12–128 caracteres. No se recaban fecha de nacimiento ni otros datos personales cuya necesidad está pendiente de definición. Contraseñas guardadas con scrypt (N=131072, r=8, p=1), sal aleatoria y comparación constante; nunca en texto plano.

Una respuesta de registro, ingreso o renovación tiene esta forma; los textos entre `<...>` describen valores, no son credenciales utilizables:

```json
{
  "user": {
    "id": "<UUID>",
    "email": "<correo>",
    "firstName": "<nombre>",
    "lastName": "<apellido>",
    "createdAt": "<fecha ISO 8601>",
    "roles": ["student"]
  },
  "accessToken": "<JWT>",
  "refreshToken": "<JWT de renovación>",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```

Enviar el acceso como `Authorization: Bearer <JWT>`. El JWT de acceso vence a los 15 minutos; la sesión tiene duración máxima fija de 30 días desde el ingreso, sin extenderse indefinidamente al renovar. La renovación también utiliza JWT, con tipo y audiencia propios y un identificador criptográfico aleatorio; solo su hash SHA-256 queda en la base. La API verifica firma, algoritmo, emisor, audiencia, vencimiento y estado de la sesión; los permisos se consultan en la base en cada solicitud protegida. Un JWT de renovación no permite acceder a las rutas protegidas, y uno de acceso no permite renovar. Aunque un JWT nuevo tenga vencimiento propio, nunca puede superar la vigencia de su sesión en la base.

Al renovar, guardar el nuevo token de renovación y desechar el anterior. Reutilizar un token consumido revoca toda esa sesión, incluidos los accesos ya emitidos. El cliente deberá serializar las renovaciones: dos renovaciones simultáneas del mismo token provocan el cierre de sesión. El cierre afecta esa sesión, no las otras sesiones del usuario.

Los tokens se devuelven en JSON para la futura integración Android/web. Todavía no hay persistencia segura de sesión en el frontend: no se deben guardar tokens en el almacenamiento de la demostración. El almacenamiento seguro nativo y la estrategia de sesión web se implementarán al conectar las pantallas.

Errores uniformes:

```json
{
  "error": { "code": "VALIDATION_ERROR", "message": "Revisá los campos indicados.", "fields": { "password": "Usá entre 12 y 128 caracteres." } },
  "requestId": "<UUID de la solicitud>"
}
```

`fields` aparece solo cuando corresponde. Códigos HTTP generales: 400 validación/JSON, 401 sesión o credenciales, 403 permisos/origen, 404 ruta/usuario, 409 conflicto, 413 cuerpo mayor a 16 KB, 429 límite de intentos, 500 error inesperado y 503 conexión no disponible. Las respuestas y logs no incluyen contraseñas, tokens ni mensajes internos del driver.

El límite de cuentas/sesiones públicas permite 40 solicitudes por IP cada 15 minutos; login además admite 10 intentos por correo en ese lapso. Los contadores se guardan y bloquean en SQL, para compartirlos entre instancias de Vercel. Un 429 incluye `Retry-After` en segundos. Fuera de Vercel no se confía en cabeceras que reescriben la IP.

## Primer administrador

Registrar primero la cuenta mediante la API y luego, desde una máquina con acceso a la base:

```powershell
npm run admin:grant -- correo@escuela.edu.ar
```

El script concede `admin` sin quitar `student`. No existe un endpoint público para promoverse ni una contraseña inicial. A partir de esa cuenta se pueden conceder los otros permisos por la ruta protegida. La API impide quitar el último administrador activo; los cambios se serializan en una transacción.

## Verificación

```powershell
npm test
```

Las pruebas HTTP usan Express, hashes y JWT reales con un repositorio de memoria. Las pruebas de transacciones y decisiones del repositorio usan conexiones controladas: no sustituyen una ejecución sobre SQL real.

Para comprobar migraciones, claves foráneas, unicidad y concurrencia contra MySQL/TiDB, crear una base **vacía y exclusiva** cuyo nombre comience por `expotec_test_`, asignarla a `TEST_DB_NAME` y ejecutar:

```powershell
npm run test:database
```

La prueba rechaza la base de producción y cualquier base con tablas; deja sus datos de prueba para inspección y nunca elimina tablas. Para repetirla, usar otra base vacía. Sin `TEST_DB_NAME`, se informa como omitida. La ejecución del 14/10/2026 pasó contra TiDB en `expotec_test_01`; esa base ahora contiene las tablas y los datos de esa prueba.

## Mantenimiento y límites de esta etapa

`npm run db:prune` elimina sesiones vencidas con sus tokens y contadores vencidos. Conservar los hashes de tokens consumidos mientras la sesión esté vigente es necesario para detectar reutilización. Ejecutar periódicamente esta limpieza con las credenciales del backend; no hay una tarea programada configurada aún.

API publicada el 14/10/2026 en `https://expotec-api-gn19.vercel.app`, con base `expotec` en TiDB. POST `/api/health` y `/api/health/ready` responden 200; ready confirma `database: connected`. Se comprobaron la sesión sin token (401), el preflight del origen de la web (204) y el rechazo de otro origen (403). La entrada `src/app.mjs` importa Express directamente para que Vercel la reconozca. Las direcciones, raíces y pasos de prueba están en [../docs/DESPLIEGUE.md](../docs/DESPLIEGUE.md).

Pendiente: conectar el frontend, CRUD de entidades de ExpoTec y sus transacciones, proveedores sociales, recuperación por correo, verificación del correo y persistencia segura de sesión. Registro e ingreso con correo no implican verificación de su titularidad. La API no guarda imágenes, videos ni archivos en el disco del hosting; la solución de archivos aún debe definirse.

La configuración de despliegue está en [docs/DESPLIEGUE.md](../docs/DESPLIEGUE.md). Este hito no completa toda la etapa 7 ni habilita el uso con datos reales de la escuela.
