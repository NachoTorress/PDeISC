# ExpoTec API — cuentas y sesiones

Backend Node.js 24 + Express 5 con módulos import/export. Implementa cuentas, sesiones, permisos, espacios, proyectos, inventario y reservas compartidas; usa mysql2 y SQL relacional compatible con MySQL/TiDB. Las pantallas compartidas utilizan esta API. Los préstamos y la presentación TV todavía pertenecen a la demostración local.

## Inventario y reservas — hito 7E

Aplicar la migración aditiva `004_inventory.sql` antes de desplegar. Crea `resources`, `project_resource_requests`, `resource_allocations` e `inventory_events`, con claves foráneas. Los elementos son cantidades de unidades equivalentes; no representan unidades con número de serie ni las mesas del plano. No se importan existencias de la demostración. Para revertir la aplicación, conservar las tablas y sus registros; no borrar reservas ni migraciones.

Todas las rutas usan POST, JSON y Bearer. Los invitados no acceden al inventario.

| Ruta | Permiso y cuerpo | Respuesta |
| --- | --- | --- |
| `/api/inventory/catalog/query` | Alumno, profesor, préstamos o administrador; `{}` | 200 `{ resources }`, catálogo completo de hasta 500 elementos activos |
| `/api/inventory/query` | Préstamos o administrador; `limit` 1–100, `offset` 0–100000, `archived` booleano; opcionales, predeterminados 25, 0 y false | 200 `{ resources }`, activos o bajas según la vista |
| `/api/inventory/:id/query` | Préstamos o administrador; `{}` | 200 `{ resource }`, incluso si fue dado de baja, con las últimas 100 modificaciones de inventario |
| `/api/inventory/create` | Administrador; `{ name, description, total }` | 201 `{ resource }`, versión 1 |
| `/api/inventory/:id/save` | Administrador; `{ version, name, description, total }` | 200 `{ resource }`, aumenta versión y registra modificación |
| `/api/inventory/:id/archive` | Administrador; `{ version }` | 204; baja lógica con historial |

`resource` incluye `id`, `name`, `description`, `total`, `reserved`, `available`, `version`, `createdAt`, `updatedAt` y `archivedAt` (null si está activo). La ficha agrega `events`: id, acción (`create`, `update`, `archive`), total anterior y actual, fecha y nombre del administrador. El catálogo y el listado omiten autores e historial. Nombre único de 2–100 caracteres, incluso entre las bajas, descripción de hasta 250 y total entero de 0–100000. No se aceptan cantidades como strings, fracciones ni campos calculados enviados por el cliente. Las escrituras admiten 120 operaciones por cuenta cada 15 minutos.

Errores: 400 validación; 401 sin sesión; 403 permiso insuficiente; 404 `RESOURCE_NOT_FOUND`; 409 `RESOURCE_CHANGED`, `RESOURCE_ARCHIVED`, `RESOURCE_NAME_EXISTS`, `RESOURCE_LIMIT`, `RESOURCE_RESERVED` o `RESOURCE_IN_USE`; 413 sobre 16 KB; 429 con `Retry-After`. Un total menor que las reservas se rechaza, incluso si esas reservas se confirmaron mientras el administrador editaba. Una baja se rechaza si un proyecto vigente lo solicita o tiene reservas. Un pedido cancelado conserva su relación histórica y permite dar de baja el elemento.

La propuesta de proyecto admite `resources: [{ resourceId, quantity }]`, de 0 a 50 UUID distintos y cantidades enteras de 1–10000. El pedido puede superar la disponibilidad actual: mientras permanezca pendiente no reserva stock, y la interfaz lo advierte. Se comprueba que los elementos existan y estén activos al presentar o reenviar. Para compatibilidad, omitir `resources` al crear significa pedido vacío; omitirlo al guardar conserva el pedido existente. Enviar `[]` lo quita explícitamente.

La ficha privada agrega `resources` con nombre, cantidad solicitada, cantidad reservada para ese proyecto, total, disponibilidad actual y baja. La ficha pública omite esta información. Confirmar comprueba todos los elementos, roles y puesto con lecturas del estado actual bajo el mismo bloqueo de dominio; inserta reservas y asignación de puesto, estado e historial en una transacción. Un faltante devuelve 409 `RESOURCE_STOCK` y no conserva ninguna reserva parcial ni ocupa la mesa. Un elemento retirado devuelve `RESOURCE_UNAVAILABLE`. Dos confirmaciones simultáneas o una confirmación frente a una reducción de total no pueden reservar más unidades de las existentes. Reabrir y cancelar liberan ambas asignaciones; los pedidos e historial se conservan.

`available = total - reserved` expresa disponibilidad para asignar proyectos durante la exposición. No expresa entregas físicas ni devoluciones por jornada. Antes de conectar préstamos se deben proteger reaperturas, cancelaciones, bajas y cambios de stock frente a saldos pendientes; ese siguiente bloque mantendrá separada la asignación del préstamo físico. No se afirman capacidades eléctricas de los elementos.

`npm run test:inventory` usa exclusivamente `expotec_test_*`, diferente de producción. Comprueba permisos, versiones, cambios concurrentes, bajas con historial, pedidos sin reserva, compatibilidad de clientes anteriores, faltante de un elemento sin reserva parcial, dos confirmaciones en mesas distintas con stock para una sola, reducción de total simultánea, reapertura, cancelación y conservación de pedidos. Limpia únicamente sus propios registros. Las integraciones `test:projects` y `test:spaces` continúan como regresión de los bloques anteriores.

## Proyectos compartidos — hito 7D

Aplicar `003_projects.sql` con `npm run db:migrate` antes de publicar. Es aditiva: crea proyectos, integrantes, profesores, materias, relaciones, asignaciones de puestos e historial de revisiones. No importa ejemplos ni modifica cuentas. Los participantes se relacionan por UUID con cuentas activas y permisos reales; se permiten varios proyectos por alumno.

Todas las rutas usan POST y JSON. Las privadas requieren Bearer. Las escrituras vuelven a comprobar permisos, pertenencia y versión dentro de la transacción.

| Ruta | Acceso y cuerpo | Respuesta |
| --- | --- | --- |
| `/api/projects/public/query` | Público; `limit` 1–100 y `offset` 0–100000, opcionales; predeterminados 25 y 0 | 200 `{ projects }`, solo confirmados |
| `/api/projects/public/:id/query` | Público; `{}` | 200 `{ project }` confirmado; 404 para otros estados |
| `/api/projects/query` | Administrador: todos; alumno integrante o profesor asignado: propios; misma paginación | 200 `{ projects }` |
| `/api/projects/:id/query` | Administrador, alumno integrante o profesor asignado; `{}` | 200 `{ project }` privado |
| `/api/projects/people/find` | Alumno o administrador; `{ email, role }`, correo exacto, rol `student` o `teacher` | 200 `{ person: { id, firstName, lastName } }`; 404 si no existe una cuenta activa con ese permiso |
| `/api/projects/create` | Alumno incluido en `memberIds`; propuesta completa | 201 `{ project }`, estado `pending`, versión 1 |
| `/api/projects/:id/save` | Alumno que ya integra el equipo; propuesta completa y `version` | 200 `{ project }`, vuelve a `pending`, aumenta versión y registra reenvío |
| `/api/projects/:id/review` | Profesor asignado para `approve` o `changes`; administrador para `reopen`; `{ version, action, note }` | 200 `{ project }`, con revisión registrada |
| `/api/projects/:id/cancel` | Integrante antes de confirmar o administrador; `{ version }` | 200 `{ project }`, estado `cancelled`; conserva historial y libera el puesto |

Propuesta completa: `name` 2–120 caracteres, `description` 20–5000, `course` 2–100, `imageUrl`, `videoUrl`, `isSoftwareProject` booleano, `githubUrl`, `websiteUrl`, `memberIds` (1–12 UUID distintos), `teacherIds` (1–5 UUID distintos), `subjects` (1–10 nombres distintos de 2–80 caracteres) y `boothId` UUID. Enviar los enlaces opcionales vacíos como `""`. `imageUrl` es obligatorio. Todos los enlaces deben ser HTTPS sin credenciales ni espacios; video directo MP4/WebM; GitHub exige su host y una ruta de repositorio. GitHub y web solo se admiten en proyectos informáticos. La API guarda enlaces, no recibe archivos ni comprueba que el contenido remoto exista o sea reproducible.

El creador y quien edita deben permanecer en el equipo. Profesores e integrantes son cuentas distintas. Solo se editan estados `pending` y `changes`; cancelar conserva las relaciones. Un pedido de cambios exige motivo de 10–2000 caracteres y deja `changes`; reenviar limpia el motivo vigente y conserva las revisiones. Confirmar solo admite `pending`; la nota es opcional, hasta 2000 caracteres. Reabrir exige estado `approved` y motivo de 10–2000 caracteres; deja `pending` y libera el puesto. Cada cambio requiere la versión actual.

Los resúmenes devuelven id, nombre, curso, estado, imagen, fecha de creación, espacio y código de mesa. La ficha agrega descripción, enlaces, materias, integrantes, profesores y ubicación. La ficha privada incluye `creatorId`, `version`, `feedback`, `updatedAt`, UUID de participantes y las últimas 100 revisiones con nombre del autor. La ficha pública omite esos datos privados: solo publica los nombres de integrantes y profesores, nunca sus correos ni UUID. Una ficha privada ajena devuelve 404. La búsqueda de participantes requiere correo exacto y admite 30 consultas por cuenta cada 15 minutos; no existe un directorio público. Las escrituras admiten 120 operaciones por cuenta cada 15 minutos. Un 429 incluye `Retry-After`.

Solicitar un puesto no lo reserva: varias propuestas pueden pedirlo. La confirmación verifica cuentas, mesa habilitada y asignación vigente, inserta una asignación única y registra estado y revisión en una sola transacción. Dos confirmaciones simultáneas para una mesa producen un éxito y un conflicto. Las mutaciones comparten un bloqueo con los cambios de roles y planos. Los permisos y referencias dentro de esas transacciones se leen con `FOR UPDATE`, pues TiDB distingue la lectura de la instantánea de la [lectura del estado actual en transacciones pesimistas](https://docs.pingcap.com/tidbcloud/pessimistic-transaction/). Esto evita confirmar con permisos o disponibilidad anteriores al bloqueo.

Errores: 400 `VALIDATION_ERROR`/`PARTICIPANTS_INVALID`; 401 sesión inválida; 403 permiso insuficiente; 404 `PROJECT_NOT_FOUND` o `PERSON_NOT_FOUND`; 409 `PROJECT_CHANGED`, `PROJECT_LOCKED`, `BOOTH_UNAVAILABLE` o `BOOTH_OCCUPIED`; 413 sobre 64 KB; 429 exceso de operaciones. Un conflicto no se reintenta automáticamente. El formulario conserva su borrador en memoria y permite actualizar los puestos; salir sin enviarlo pide confirmación. El borrador no persiste al cerrar la aplicación.

Desde el hito 7E los pedidos y reservas de recursos se confirman con el puesto, según el contrato de inventario anterior. Antes de conectar préstamos, extender reapertura y cancelación para proteger sus saldos e historial. La presentación TV compartida y el almacenamiento de archivos siguen pendientes.

`npm run test:projects` exige una base `expotec_test_*` distinta de producción. Comprueba equipos, permisos, privacidad, pedido de cambios, reenvío, versiones, dos confirmaciones concurrentes, reapertura, cancelación y protección del plano; elimina solo sus cuentas, proyectos y espacio temporales. `npm run test:spaces` continúa comprobando la distribución real en esa base.

## Espacios compartidos — hito 7C

Las consultas son públicas y no devuelven datos de cuentas. Las escrituras requieren Bearer de una sesión válida y permiso `admin`, comprobado nuevamente dentro de la transacción junto con el estado activo del usuario. El selector de perfiles ficticios no concede permisos.

| Método y ruta | Permiso y cuerpo | Respuesta |
| --- | --- | --- |
| POST `/api/spaces/query` | Público; `{}` | 200 `{ spaces }`: id, nombre, descripción, versión, fechas y cantidades de muebles y puestos de cada espacio activo |
| POST `/api/spaces/:id/query` | Público; UUID y `{}` | 200 `{ space }`, con `furniture` y `booths` |
| POST `/api/spaces/create` | Administrador; `{ name, description }` | 201 `{ space }`, sin mobiliario, versión 1 |
| POST `/api/spaces/:id/save` | Administrador; `{ version, name, description, furniture, boothFurnitureIds }` | 200 `{ space }`, versión incrementada y plano guardado atómicamente |
| POST `/api/spaces/:id/archive` | Administrador; `{ version }` | 204; baja lógica del espacio, sus muebles y puestos |

`space` contiene `id`, `name`, `description`, `version`, `createdAt`, `updatedAt`, `furniture` y `booths`. Las fechas se serializan como ISO UTC. Cada mueble tiene `id` como código único dentro de su espacio, `type` (`table`, `bench`, `power` o `label`), `x`, `y` y `rotation`. Las mesas tienen `width` y `height`; las etiquetas, `text`. Los puestos tienen UUID estable `id` y `furnitureId`, separado de la identidad del mueble.

Ejemplo de guardado de una mesa habilitada como puesto:

```json
{
  "version": 1,
  "name": "Aula 1",
  "description": "Planta baja",
  "furniture": [
    { "id": "M01", "type": "table", "x": 50, "y": 50, "rotation": 0, "width": 14, "height": 9 }
  ],
  "boothFurnitureIds": ["M01"]
}
```

Límites: 100 espacios activos, 150 muebles por plano, nombre de 2–80 caracteres y descripción de hasta 150. Los códigos admiten 1–64 letras ASCII, números, guiones y guion bajo. Coordenadas finitas de 0–100; giros de 0, 90, 180 o 270 grados; ancho relativo de mesa 6–30 y alto 4–25. Las etiquetas requieren 2–60 caracteres. Solo las mesas pueden habilitarse como puestos. Los valores del plano no representan metros ni validan la instalación eléctrica.

Errores: 400 por campos desconocidos o datos inválidos; 401 sin sesión o con sesión vencida; 403 por permisos; 404 por espacio inexistente o dado de baja; 409 `SPACE_CHANGED` si la versión ya cambió, `FURNITURE_ID_RESERVED` si se intenta reutilizar un código retirado/cambiar su tipo, o `SPACE_LIMIT` al superar 100 espacios; 413 por cuerpo mayor a 128 KB; 429 por exceso de escrituras. El formato común es `{ error: { code, message, fields? }, requestId }`. Los endpoints de autenticación conservan su límite de 16 KB.

El guardado bloquea el espacio y verifica la versión, conserva las identidades de los puestos, actualiza el mobiliario y las habilitaciones y aumenta la versión en una sola transacción. No reintentar automáticamente un conflicto: el usuario debe revisar los cambios y decidir si descarta su borrador. Las bajas conservan filas inactivas. Las claves foráneas vinculan puestos con muebles y muebles con espacios; las relaciones no se guardan como JSON.

La migración `002_spaces.sql` es aditiva y no importa la demostración ni crea datos de la escuela. Aplicar `npm run db:migrate` antes de desplegar esta API. Volver a una versión anterior de la aplicación no requiere quitar las tablas nuevas; conservarlas evita perder datos. Desde el hito 7D, cada puesto devuelve también `projectId` y `projectName` del proyecto confirmado, o null. No se puede retirar un puesto ni dar de baja un espacio referido por un proyecto vigente (`pending`, `changes` o `approved`): responde 409 `SPACE_IN_USE`. Se permiten movimientos y cambios de tamaño conservando su identidad. Las cancelaciones conservan el historial.

`npm run test:spaces` usa exclusivamente una base `expotec_test_*`, distinta de `DB_NAME`. Aplica migraciones repetibles y comprueba HTTP, SQL, claves foráneas, permisos retirados, guardados concurrentes, versiones y conservación de filas. Limpia únicamente sus espacios y cuentas temporales; permite conservar otras pruebas existentes. `npm run test:database` sigue requiriendo una base vacía para la prueba histórica completa de autenticación.

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

Las rutas nativas devuelven tokens en JSON; el cliente conserva la renovación en SecureStore y el acceso en memoria. Las rutas web usan la cookie HttpOnly descrita arriba. No guardar tokens en el almacenamiento de la demostración.

Errores uniformes:

```json
{
  "error": { "code": "VALIDATION_ERROR", "message": "Revisá los campos indicados.", "fields": { "password": "Usá entre 12 y 128 caracteres." } },
  "requestId": "<UUID de la solicitud>"
}
```

`fields` aparece solo cuando corresponde. Códigos HTTP generales: 400 validación/JSON, 401 sesión o credenciales, 403 permisos/origen, 404 ruta/entidad, 409 conflicto, 413 cuerpo mayor al límite de la ruta (16 KB en autenticación, 64 KB en proyectos, 128 KB en espacios), 429 límite de intentos, 500 error inesperado y 503 conexión no disponible. Las respuestas y logs no incluyen contraseñas, tokens ni mensajes internos del driver.

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

Pendiente: préstamos y devoluciones, presentación compartida, proveedores sociales, recuperación y verificación del correo. Registro e ingreso con correo no implican verificación de su titularidad. La API no guarda imágenes, videos ni archivos en el disco del hosting; la solución de archivos aún debe definirse.

La configuración de despliegue está en [docs/DESPLIEGUE.md](../docs/DESPLIEGUE.md). Este hito no completa toda la etapa 7 ni habilita el uso con datos reales de la escuela.
