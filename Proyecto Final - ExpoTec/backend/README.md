# ExpoTec API — cuentas y organización de la exposición

Backend Node.js 24 + Express 5 con módulos import/export. Implementa cuentas, sesiones, permisos, espacios, proyectos, inventario, reservas, préstamos y devoluciones compartidas; usa mysql2 y SQL relacional compatible con MySQL/TiDB. Las pantallas compartidas utilizan esta API. La presentación TV compartida usa una secuencia pública de proyectos confirmados; su demostración conserva datos locales.

Actualización documental del 25/10/2026: [instalación completa](../docs/GUIA_INSTALACION.md), [manual de usuario](../docs/MANUAL_USUARIO.md) y [guion de demostración](../docs/GUIA_DEMOSTRACION.md), con [PDF](../docs/README.md). El contrato HTTP existente usa principalmente POST para operaciones JSON; las secciones por dominio indican los métodos reales. Las menciones de pendientes en hitos históricos se interpretan según su fecha. Recuperación, carga privada de fotos y acceso social nativo se documentan a continuación.

## Recuperación de contraseña

Las tres rutas reciben JSON y no requieren sesión. La configuración SMTP y `PASSWORD_RESET_WEB_ORIGIN` se describen en [recuperación](../docs/RECUPERACION_CONTRASENA.md). Se requiere la migración `010_password_recovery.sql`.

| Método y ruta | Cuerpo | Respuesta correcta |
| --- | --- | --- |
| POST `/api/auth/recovery/query` | `{}` | 200 `{ enabled: boolean }` |
| POST `/api/auth/recovery/request` | `{ email }` | 202 `{ message }`, mensaje común exista o no una cuenta activa |
| POST `/api/auth/recovery/complete` | `{ token, password, confirmation }` | 200 `{ message }`, solicita ingresar de nuevo |

`email` debe tener formato válido y hasta 254 caracteres. `token` contiene 43 caracteres base64url, vence a los 20 minutos y es de un uso. La contraseña admite 12–128 caracteres; `confirmation` debe coincidir. Completar actualiza la contraseña y revoca las sesiones en una transacción; no inicia sesión automáticamente. La respuesta elimina la cookie de renovación web. Pedir otro enlace invalida los anteriores.

Errores: 400 `VALIDATION_ERROR` o `RESET_INVALID` (también enlace vencido o usado); 429 `RATE_LIMITED`; 503 `RECOVERY_UNAVAILABLE` si no hay servicio configurado. Límites: 15 solicitudes por IP/hora, 3 por correo/hora y 10 intentos de completar por IP/15 minutos. El enlace no se devuelve en la respuesta de solicitud. Disponibilidad configurada no acredita recepción del correo.

## Carga de fotos y acceso a imágenes

Las escrituras y vistas previas requieren Bearer y cuenta activa. `prepare` con propósito `project` requiere además permiso `student`; el propósito `gallery` admite cualquier cuenta activa. Se necesita la migración `009_uploads.sql` y `BLOB_READ_WRITE_TOKEN` privado del backend.

| Método y ruta | Cuerpo o parámetros | Respuesta correcta |
| --- | --- | --- |
| POST `/api/uploads/prepare` | `{ purpose, contentType, size }` | 201 `{ id, pathname, clientToken }` |
| POST `/api/uploads/complete` | `{ id }` | 200 `{ imageUrl }` |
| POST `/api/uploads/preview` | `{ imageUrl }` | 200 `{ image }`, data URL JPEG autorizada |
| GET `/api/uploads/:id/image` | UUID de imagen; sin cuerpo | 200, bytes `image/jpeg` si corresponde acceso público |

`purpose` es `project` o `gallery`; `contentType` es `image/jpeg`, `image/png` o `image/webp`; `size` es un entero entre 1 y 10 × 1024 × 1024 bytes. `prepare` entrega un permiso de carga limitado a ruta, tipo, tamaño y diez minutos. El cliente envía el archivo directamente a Blob privado y después llama a `complete`; no envía base64 al cuerpo JSON de ese endpoint. El SDK web y el transporte Android están explicados en [carga de fotos](../docs/CARGA_FOTOS.md).

`complete` comprueba titularidad y estado, valida el contenido real, optimiza la imagen a JPEG y retira el archivo de entrada. Repetir una carga ya lista devuelve su URL. Guardar el archivo no publica una galería ni confirma un proyecto: sus reglas de publicación determinan el acceso público. `preview` exige autorización; el GET público devuelve 404 si la imagen no está publicada. Las respuestas de imagen usan `Cache-Control: no-store`.

Errores: 400 por cuerpo o UUID inválido; 401 sin sesión; 403 por permiso de proyecto; 404 `IMAGE_NOT_FOUND`; 409 `UPLOAD_CHANGED`; 422 `IMAGE_INVALID`; 429 por límite; 503 `UPLOADS_UNAVAILABLE` o `UPLOAD_FAILED`. Límites por cuenta: 20 preparaciones/hora, 40 finalizaciones/hora y 200 vistas previas/15 minutos.

## Google nativo y finalización social móvil

Estas rutas complementan las de navegador documentadas al final. Reciben JSON y utilizan una prueba de posesión del flujo; todavía no hay sesión al llamarlas. La prueba es un valor aleatorio de 32 bytes codificado en base64url de 43 caracteres, guardado por el cliente; `challenge` es su hash SHA-256 hexadecimal de 64 caracteres.

| Método y ruta | Cuerpo | Respuesta correcta |
| --- | --- | --- |
| POST `/api/auth/social/google/native/start` | `{ challenge }` | 200 `{ id, nonce, webClientId }` |
| POST `/api/auth/social/google/native/verify` | `{ id, proof, idToken }` | 200 `{ id }` después de verificar Google |
| POST `/api/auth/social/status` | `{ id, proof }` | 200 `{ provider, email, mode }` |
| POST `/api/auth/social/complete` | `{ id, proof, mode, ...datos }` | 200 `{ user, accessToken, refreshToken, tokenType, expiresIn }` |

`id` es UUID v4. El cliente nativo obtiene el ID token usando el `webClientId` y el nonce emitidos. `idToken` admite hasta 8192 caracteres; el servidor comprueba firma RS256, emisor, audiencia, vigencia, correo verificado y nonce. Cada verificación reclama el flujo una sola vez; los flujos vencen a los diez minutos. No alcanza con decodificar un token ni con enviar un correo.

`mode` es el resultado actual de `status`: `signup`, `link` o `login`. Para `signup`, agregar `firstName`, `lastName`, `password` y opcional `accountType` (`student` o `guest`). Para `link`, agregar `password` de ExpoTec; para `login` no se necesita otra contraseña. La repetición de contraseña del registro social es una validación del frontend, no un campo adicional de este contrato. La cuenta y los permisos se conservan al vincular identidades.

Discord y GitHub inician el acceso en el navegador mediante la página puente `mobile-auth.html`, que usa `/api/auth/browser/social/start` y su cookie temporal. El regreso `expotec://auth` lleva identificadores de flujo; la app conserva la prueba privada y finaliza con las rutas móviles. No hay un endpoint `/api/auth/social/start` genérico. El retorno no contiene tokens de sesión ni contraseñas.

Errores: 400 `SOCIAL_FAILED` o validación; 401 `INVALID_CREDENTIALS` en una vinculación; 404 `SOCIAL_DISABLED` al iniciar un proveedor no habilitado; 409 `SOCIAL_CHANGED` o `SOCIAL_CONFLICT`; 429 por límites. Las rutas usan el límite de autenticación por IP de 40 solicitudes/15 minutos; la vinculación con contraseña agrega 10 intentos por correo/15 minutos. Ver [Google Android](../docs/ANDROID_GOOGLE.md) para paquete y firma.

## Presentación TV compartida — hito 7G

**POST `/api/projects/presentation/query`**, público, JSON y sin Bearer. Cuerpo: `limit` opcional, entero de 1–100 (100 por defecto), y `after` opcional, UUID del último proyecto de la página anterior. Rechaza campos adicionales, null, strings como cantidad y cursores inválidos. Devuelve 200 `{ projects, nextCursor }`; cursor null indica el final. Sin confirmados devuelve `{ projects: [], nextCursor: null }`. Errores: 400 `VALIDATION_ERROR`, 413 sobre el límite de proyectos (64 KB), 503 por base no disponible, además del formato común `{ error: { code, message, fields? }, requestId }`. No modifica datos y no agrega migraciones.

Cada proyecto contiene exclusivamente `id`, `name`, `description`, `course`, `imageUrl`, `videoUrl`, `spaceName`, `furnitureId`, `members`, `teachers` y `subjects`. Integrantes y profesores contienen solo `firstName` y `lastName`; no correos ni identificadores de cuentas. No devuelve creador, versiones, revisiones, observaciones privadas, pedidos, reservas ni préstamos. Incluye solo confirmados con asignación de puesto y espacio activo. Las referencias se consultan por lotes y cada página se obtiene dentro de una transacción. Orden ascendente estable por UUID del proyecto; el cursor evita los desplazamientos propios de una paginación por offset. Las páginas sucesivas son consultas nuevas, no una instantánea global persistente.

El frontend reúne todas las páginas antes de reemplazar la secuencia; una página fallida no publica una carga parcial. Actualiza al abrir, recuperar visibilidad y cada 60 segundos mientras la pantalla está enfocada y visible. Mantiene la selección por identidad si el proyecto continúa confirmado. La retirada se refleja en la siguiente actualización correcta; no es una transmisión en tiempo real. Ante fallo de consulta oculta la secuencia, pausa y permite actualizar. El retorno de datos no inicia automáticamente la reproducción.

Pruebas del hito: 32 de backend y 69 de frontend; `npm run test:presentation` en una base `expotec_test_*` distinta de producción verifica paginación real, privacidad, estados, reapertura y cancelación. `test:projects` comprueba la regresión de propuestas y revisiones. Ambas integraciones limpian únicamente sus propios registros. La web utiliza el mismo proxy de API existente y no requiere nuevas variables privadas.

## Préstamos y devoluciones — hito 7F

Aplicar `005_loans.sql` antes de desplegar. Es aditiva y repetible: crea `loans`, `loan_returns`, `resource_conditions` y `inventory_condition_events`; conserva datos y tablas previas. Cada préstamo referencia proyecto, recurso, receptor y operador; las devoluciones referencian préstamo y persona que recibe. La extensión del historial de inventario vincula daños con la devolución correspondiente. No importa datos ficticios ni requiere nuevas variables. No volver a una API anterior a 7F con préstamos abiertos: sus protecciones no estarían disponibles. Conservar siempre tablas e historial.

Todas las rutas usan **POST**, JSON y **Bearer**, y requieren permiso real `loans` o `admin`. No hay consultas públicas de préstamos. Las escrituras vuelven a comprobar permisos, referencias y versiones con lecturas actuales bajo el bloqueo de dominio que comparten inventario, proyectos, planos y roles. Admiten 120 operaciones por cuenta cada 15 minutos; cuerpo máximo 16 KB. Campos no listados, UUID y cantidades inválidas se rechazan.

| Ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| `/api/loans/query` | Opcionales: `limit` 1–100 (25), `offset` 0–100000 (0), `day` 1–3, `openOnly` booleano (false) | 200 `{ loans, summary: { pendingCount, pendingQuantity } }`; el resumen siempre incluye pendientes de todas las jornadas |
| `/api/loans/projects/query` | `day` 1–3 obligatorio; `limit` y `offset` opcionales con iguales límites | 200 `{ projects }`: proyectos confirmados con reservas, versión, ubicación, integrantes activos y disponibilidad por recurso |
| `/api/loans/:id/query` | `{}` | 200 `{ loan }`, con las últimas 100 devoluciones y novedades |
| `/api/loans/deliver` | `projectId`, `projectVersion`, `resourceId`, `day`, `quantity`, `recipientId`, `note` opcional | 201 `{ loan }`, versión 1 |
| `/api/loans/:id/return` | `version`, `quantity`, `damagedQuantity` opcional (0), `note` opcional | 200 `{ loan }`, versión incrementada y movimiento agregado |

Las jornadas son los números ordinales **1, 2 y 3**, sin fechas de exposición supuestas. La entrega exige proyecto confirmado con versión vigente, reserva del elemento activo e integrante activo del equipo con permiso de alumno. Cantidad entera de 1–10000, limitada por ambas disponibilidades: reserva del proyecto menos sus pendientes de todas las jornadas, y total menos unidades fuera de servicio y todos los préstamos abiertos del elemento. Existe una restricción única por proyecto, elemento y jornada, incluso después de devolver todo; no se permite repetir esa entrega. Cambiar de jornada no devuelve ni libera elementos.

Una devolución positiva puede ser parcial o completa y no puede superar el saldo del préstamo. `damagedQuantity` es un entero entre cero y la cantidad recibida; cuenta como devuelto, aumenta las unidades fuera de servicio y la versión del recurso y agrega un evento de inventario `damage`, todo en la misma transacción. `quantity: 0` permite exclusivamente una novedad con explicación, sin cambiar stock ni cantidad devuelta. Las notas admiten hasta 1000 caracteres y requieren al menos 10 para daños o novedades. Cada movimiento registra instante UTC real y persona responsable; no se ofrece edición ni borrado de entregas o devoluciones.

El préstamo devuelve `id`, `projectId`, `resourceId`, `day`, `quantity`, `returned`, `version`, `recipientId`, `note`, `createdAt`, `projectName`, `resourceName` y nombres y apellidos de quien entrega y quien retira. La ficha agrega `returns` con `id`, `quantity`, `damagedQuantity`, `note`, `createdAt`, `firstName`, `lastName` de quien recibe. No expone correos. La cola de entrega incluye `members` con id y nombre; por recurso devuelve `reservedQuantity`, `outstanding` propio en todas las jornadas, `availableToLend` físico global, `deliverable` (mínimo de ambos límites, cero si ya hubo entrega ese día) y `loanId`, además de total, estado y nombre. La búsqueda en pantalla se aplica a los registros cargados; ambos listados permiten cargar más páginas.

Inventario agrega `unavailable`, `outstanding`, `availableToLend` y `shortage`. Unidades utilizables = `total - unavailable`; disponibilidad para reservar = `max(utilizables - reserved, 0)`; faltante de cobertura = `max(reserved - utilizables, 0)`; disponibilidad física para entregar = `max(utilizables - outstanding, 0)`. Los daños pueden producir faltante de cobertura sin borrar reservas. Al devolver todo se conserva la reserva para el día siguiente. La ficha privada del proyecto agrega `openLoanQuantity` y, por recurso, `unavailable` y `outstanding`; la pública los omite.

Crear o guardar un recurso admite `unavailable` entero entre 0 y total y `note` de hasta 1000 caracteres. Al guardar, cambiar unidades fuera de servicio exige motivo de al menos 10 caracteres. Omitir `unavailable` en un cliente anterior conserva su valor. Los ajustes manuales no pueden dejar menos unidades utilizables que las prestadas ni reducir la cobertura existente de reservas: el mínimo utilizable exigido es `max(outstanding, min(reserved, utilizables previas))`. Esto permite reparaciones parciales frente a daños sin exigir corregir todo el faltante de una vez. El historial de inventario agrega `previousUnavailable`, `unavailable` y `note`; registra también el ajuste de reparación y su autor. Una alta sin `unavailable` comienza con cero unidades fuera de servicio.

Mientras existan unidades sin devolver, no se puede editar, reabrir ni cancelar el proyecto, ni dar de baja el elemento. Después de las devoluciones completas, reapertura y cancelación liberan reservas, conservando préstamos y revisiones. Las bajas siguen protegiendo proyectos vigentes. Un conflicto de versión conserva el borrador y ofrece actualizarlo mediante descarte confirmado; no se reintenta automáticamente.

Errores: 400 `VALIDATION_ERROR` o `RECIPIENT_INVALID`; 401 sesión inválida; 403 `FORBIDDEN`; 404 `LOAN_NOT_FOUND`; 409 `PROJECT_NOT_APPROVED`, `PROJECT_CHANGED`, `RESOURCE_NOT_RESERVED`, `ALREADY_DELIVERED`, `PROJECT_LOAN_LIMIT`, `LOAN_STOCK`, `LOAN_CHANGED`, `RETURN_EXCEEDS_LOAN` o `RESOURCE_STATE_CHANGED`. Los cambios de proyecto agregan 409 `PROJECT_HAS_LOANS`; inventario agrega `RESOURCE_HAS_LOANS` y mantiene `RESOURCE_RESERVED` para ajustes incompatibles. 413 sobre 16 KB; 429 con `Retry-After`. El formato uniforme es `{ error: { code, message, fields? }, requestId }`.

`npm run test:loans` exige `expotec_test_*` diferente de producción. Cubre tres jornadas, permisos retirados, receptor válido, proyectos pendientes, entregas simultáneas y duplicadas, límites globales y propios, devoluciones parciales y concurrentes, versiones, novedades, daños, reparaciones parciales y protecciones de edición, reapertura, cancelación y baja. Elimina solo sus propios datos. Al 19/10/2026 pasaron 30 pruebas de backend, 66 de frontend y cuatro integraciones TiDB de dominio. La prueba histórica de cuentas `test:database` ya se verificó por separado y requiere una base vacía nueva.

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

Errores: 400 validación; 401 sin sesión; 403 permiso insuficiente; 404 `RESOURCE_NOT_FOUND`; 409 `RESOURCE_CHANGED`, `RESOURCE_ARCHIVED`, `RESOURCE_NAME_EXISTS`, `RESOURCE_LIMIT`, `RESOURCE_RESERVED` o `RESOURCE_IN_USE`; 413 sobre 16 KB; 429 con `Retry-After`. Los ajustes de total y estado protegen las unidades prestadas y la cobertura de reservas, según el contrato de 7F anterior. Una baja se rechaza si un proyecto vigente lo solicita o tiene reservas. Un pedido cancelado conserva su relación histórica y permite dar de baja el elemento.

La propuesta de proyecto admite `resources: [{ resourceId, quantity }]`, de 0 a 50 UUID distintos y cantidades enteras de 1–10000. El pedido puede superar la disponibilidad actual: mientras permanezca pendiente no reserva stock, y la interfaz lo advierte. Se comprueba que los elementos existan y estén activos al presentar o reenviar. Para compatibilidad, omitir `resources` al crear significa pedido vacío; omitirlo al guardar conserva el pedido existente. Enviar `[]` lo quita explícitamente.

La ficha privada agrega `resources` con nombre, cantidad solicitada, cantidad reservada para ese proyecto, total, disponibilidad actual y baja. La ficha pública omite esta información. Confirmar comprueba todos los elementos, roles y puesto con lecturas del estado actual bajo el mismo bloqueo de dominio; inserta reservas y asignación de puesto, estado e historial en una transacción. Un faltante devuelve 409 `RESOURCE_STOCK` y no conserva ninguna reserva parcial ni ocupa la mesa. Un elemento retirado devuelve `RESOURCE_UNAVAILABLE`. Dos confirmaciones simultáneas o una confirmación frente a una reducción de total no pueden reservar más unidades de las existentes. Reabrir y cancelar liberan ambas asignaciones; los pedidos e historial se conservan.

Desde 7F, `available = max(total - unavailable - reserved, 0)` expresa disponibilidad para asignar proyectos durante la exposición. La disponibilidad física y los saldos pendientes se describen en el contrato de préstamos anterior. No se afirman capacidades eléctricas de los elementos.

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

Desde el hito 7E los pedidos y reservas de recursos se confirman con el puesto, según el contrato de inventario anterior. Desde 7F, los préstamos pendientes bloquean edición, reapertura y cancelación y se conservan al cerrar cada jornada. La presentación TV compartida se conecta en 7G. El almacenamiento de archivos sigue pendiente.

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

Límites: 100 espacios activos, 150 muebles por plano, nombre de 2–80 caracteres y descripción de hasta 150. Los códigos admiten 1–64 letras ASCII, números, guiones y guion bajo. Coordenadas finitas de 0–100; giros enteros de 0 a 359 grados; ancho relativo de mesa 6–30 y alto 4–25. Las etiquetas requieren 2–60 caracteres. Solo las mesas pueden habilitarse como puestos. Los valores del plano no representan metros ni validan la instalación eléctrica.

Errores: 400 por campos desconocidos o datos inválidos; 401 sin sesión o con sesión vencida; 403 por permisos; 404 por espacio inexistente o dado de baja; 409 `SPACE_CHANGED` si la versión ya cambió, `FURNITURE_ID_RESERVED` si se intenta reutilizar un código retirado/cambiar su tipo, o `SPACE_LIMIT` al superar 100 espacios; 413 por cuerpo mayor a 128 KB; 429 por exceso de escrituras. El formato común es `{ error: { code, message, fields? }, requestId }`. Los endpoints de autenticación conservan su límite de 16 KB.

El guardado bloquea el espacio y verifica la versión, conserva las identidades de los puestos, actualiza el mobiliario y las habilitaciones y aumenta la versión en una sola transacción. No reintentar automáticamente un conflicto: el usuario debe revisar los cambios y decidir si descarta su borrador. Las bajas conservan filas inactivas. Las claves foráneas vinculan puestos con muebles y muebles con espacios; las relaciones no se guardan como JSON.

La migración `002_spaces.sql` es aditiva y no importa la demostración ni crea datos de la escuela. Aplicar `npm run db:migrate` antes de desplegar esta API. Volver a una versión anterior de la aplicación no requiere quitar las tablas nuevas; conservarlas evita perder datos. Desde el hito 7D, cada puesto devuelve también `projectId` y `projectName` del proyecto confirmado, o null. No se puede retirar un puesto ni dar de baja un espacio referido por un proyecto vigente (`pending`, `changes` o `approved`): responde 409 `SPACE_IN_USE`. Se permiten movimientos y cambios de tamaño conservando su identidad. Las cancelaciones conservan el historial.

`npm run test:spaces` usa exclusivamente una base `expotec_test_*`, distinta de `DB_NAME`. Aplica migraciones repetibles y comprueba HTTP, SQL, claves foráneas, permisos retirados, guardados concurrentes, versiones y conservación de filas. Limpia únicamente sus espacios y cuentas temporales; permite conservar otras pruebas existentes. `npm run test:database` sigue requiriendo una base vacía para la prueba histórica completa de autenticación.

## Sesión web — hito 7B

Las rutas nativas existentes mantienen su contrato JSON con `refreshToken`. La web utiliza estas rutas adicionales, con `Content-Type: application/json`, `credentials: include` y un encabezado `Origin` exacto autorizado en `CORS_ORIGINS`:

| Método y ruta | Cuerpo | Respuesta |
| --- | --- | --- |
| POST `/api/auth/browser/register` | `firstName`, `lastName`, `email`, `password`, opcional `accountType` (`student` o `guest`) | 201: usuario, `accessToken`, `tokenType`, `expiresIn`; cookie de renovación |
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
| POST `/api/auth/register` | Público, limitado | `firstName`, `lastName`, `email`, `password`, opcional `accountType` (`student` o `guest`) | 201: usuario y tokens; 409: correo existente |
| POST `/api/auth/login` | Público, limitado | `email`, `password` | 200: usuario y tokens; 401: credenciales incorrectas |
| POST `/api/auth/refresh` | JWT de renovación, limitado | `refreshToken` | 200: usuario y nuevo par de tokens; 401: token vencido, usado o revocado |
| POST `/api/auth/logout` | Token de renovación, limitado | `refreshToken` | 204: cierre idempotente de esa sesión |
| POST `/api/auth/session` | Bearer JWT válido | `{}` | 200: `{ "user": ... }`; 401: sesión inválida |
| POST `/api/admin/users/query` | Administrador | `limit` opcional (1–100, default 25), `offset` opcional (0–100000, default 0), `search` opcional (hasta 100 caracteres, nombre o correo) | 200: `{ "users": [...] }` |
| POST `/api/admin/users/:id/query` | Administrador | `{}` | 200: `{ user }` activo; 404: inexistente o inactivo |
| POST `/api/admin/users/:id/roles/save` | Administrador activo, 60 intentos cada 15 minutos por actor | `{ roles, expectedRoles }` | 200: `{ user }`; 409: `ROLES_CHANGED` o `LAST_ADMIN`; 404: inexistente o inactivo |
| PATCH `/api/admin/users/:id/roles` | Administrador | `roles`: lista sin duplicados de `student`, `teacher`, `loans`, `admin`, `guest` | 200: usuario actualizado; 404: cuenta inexistente; 409: último administrador |

Los campos no listados se rechazan. El identificador del usuario es UUID v4. La cuenta nueva recibe `student` por defecto o `guest` si el registro incluye `accountType: "guest"`; no acepta `role`, `roles` ni `active` desde el registro. Una cuenta puede acumular permisos, por ejemplo profesor y encargado de préstamos, sin concedérselos por sí misma.

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

Pendiente: proveedores sociales, recuperación y verificación del correo. Registro e ingreso con correo no implican verificación de su titularidad. La API no guarda imágenes, videos ni archivos en el disco del hosting; la solución de archivos aún debe definirse.

La configuración de despliegue está en [docs/DESPLIEGUE.md](../docs/DESPLIEGUE.md). Este hito no completa toda la etapa 7 ni habilita el uso con datos reales de la escuela.

## Usuarios y permisos — hito 7H

La aplicación utiliza POST `roles/save`. `roles` exige al menos un permiso válido y sin duplicados. `expectedRoles` es obligatorio, admite vacío para cuentas históricas sin permisos y contiene el conjunto leído al abrir el editor. La comparación se realiza dentro de la misma transacción que reemplaza las asignaciones, bajo el bloqueo compartido del rol administrador. Un conflicto no escribe asignaciones parciales. La ruta PATCH histórica se conserva sin comparación de borrador; los clientes nuevos deben usar POST.

La búsqueda usa parámetros y coincidencia literal sobre nombre, apellido y correo; `%` y `_` no son comodines. Orden estable por fecha de alta e identificador; la paginación por offset consulta el estado de cada petición, no una instantánea entre páginas. El listado incluye actividad y permisos, nunca hashes ni tokens. El detalle solo admite cuentas activas. Solo administradores autenticados pueden consultar estos datos.

`npm run test:users` usa exclusivamente `TEST_DB_NAME=expotec_test_*`, diferente de producción. Cubre búsqueda, páginas, privacidad, rechazo a alumnos, cambios visibles en sesiones existentes, concurrencia, conflicto y consulta por cuenta; limpia solo sus cuentas temporales. No necesita nuevas tablas, variables ni dependencias.

## Galería e invitados — hito 7I

La migración `006_gallery.sql` agrega el permiso `guest`, `gallery_photos` y `gallery_reviews`. Se aplica explícitamente antes de publicar la API y la web nuevas; no cambia roles de cuentas existentes. La nueva migración fija finales de línea LF para mantener su checksum. `accountType` es opcional al registrar: `guest` concede solo invitado, `student` o ausencia conservan el registro de alumno. Ningún otro tipo se admite. Ingreso, renovación y sesiones mantienen el contrato anterior.

| POST | Acceso | Cuerpo | Respuesta |
| --- | --- | --- | --- |
| `/api/gallery/public/query` | Público | `limit` 1–100 (25), `offset` 0–100000 (0), opcionales | 200 `{ photos }`, solo aprobadas |
| `/api/gallery/mine/query` | Cuenta activa | Misma paginación | 200 `{ photos }`, solo del actor autenticado |
| `/api/gallery/submit` | Cuenta activa, 10 intentos/hora por actor | `{ imageUrl, caption }` | 201 `{ photo: { id, status: pending, version: 1 } }` |
| `/api/gallery/moderation/query` | Administración | Paginación y `status`: pending (default), approved, rejected o all | 200 `{ photos }` |
| `/api/gallery/:id/review` | Administración, 120 intentos/15 min por actor | `{ version, decision, note? }` | 200 `{ photo: { id, status, version } }` |

`imageUrl`: HTTPS completo de hasta 2048 caracteres, sin credenciales ni espacios; `caption`: 5–400 caracteres normalizados, sin controles ni saltos de línea. No se aceptan autor, estado ni permisos desde el envío. `decision`: approved o rejected. Rechazar o retirar exige `note` de 10–1000 caracteres; aprobar admite motivo vacío. No se repite el mismo estado y toda decisión compara versión. UUID v4 para identificar fotos.

La consulta pública proyecta exclusivamente `id`, `imageUrl`, `caption`, `authorName`, `createdAt`. Las consultas propias y administrativas agregan `status`, `version`, `updatedAt` y `reviewNote` de la revisión actual. No se publican correos, identificadores de autor, responsables internos ni motivos. Orden descendente por creación e identificador; las páginas por offset reflejan cada consulta, no una instantánea común.

Envío y revisión son transaccionales. Se vuelve a comprobar la cuenta activa y, al moderar, su permiso administrador. El conteo de pendientes se lee con bloqueo después de bloquear al autor: dos envíos simultáneos no superan 20 pendientes. Cada revisión actualiza estado y versión y registra responsable, motivo y fecha en una única transacción. 409: PHOTO_CHANGED, PHOTO_ALREADY_REVIEWED o GALLERY_PENDING_LIMIT; 403: sin permisos; 404: foto inexistente; 400: datos inválidos; 429: límite con Retry-After.

La API almacena enlaces y no descarga ni verifica el contenido remoto. Las imágenes se cargan en el cliente, que muestra un estado recuperable si fallan. No hay edición o borrado de aportes en este hito; retirar una publicación conserva el historial. `npm run test:gallery` usa `TEST_DB_NAME=expotec_test_*` diferente de producción, y limpia únicamente sus cuentas, fotos y revisiones temporales.
## Accesos sociales web — preparación 7J

Las migraciones `sql/007_social.sql` y `sql/008_social_browser.sql` agregan identidades, flujos de autorización temporales y su vínculo al navegador. Ejecutar `npm run db:migrate` antes de publicar. Configuración opcional en `.env.example` y guía de creación de aplicaciones, retornos y activación en [ACCESOS_SOCIALES.md](../docs/ACCESOS_SOCIALES.md). Sin credenciales, el listado de proveedores está vacío.

Rutas nuevas: POST `/api/auth/social/providers/query` con `{}`; POST `/api/auth/browser/social/start` con `{provider, challenge}` (SHA-256 hexadecimal de una prueba aleatoria de 32 bytes codificada en base64url); POST `/api/auth/browser/social/status` con `{id, proof}`; POST `/api/auth/browser/social/complete` con `{id, proof, mode}` y los campos de contraseña/registro que correspondan. Las tres operaciones browser exigen Origin autorizado y JSON. Complete devuelve la sesión web sin refreshToken en el cuerpo y establece la cookie HttpOnly habitual. El servidor limita solicitudes por IP y las contraseñas de vinculación por correo.

GET `/api/auth/social/:provider/callback` es una excepción protocolar al uso habitual de POST: recibe el código de OAuth, exige la cookie temporal HttpOnly del navegador que inició el flujo, reclama su estado una vez y redirige al origen web fijo con un identificador de flujo sin tokens. Registrar el callback del dominio web, que llega a la API mediante su proxy; el callback directo del dominio API no recibe esa cookie. Solo la pestaña que conserva la prueba puede completar el acceso. Cada flujo vence a los diez minutos; `npm run db:prune` limpia los vencidos. No se almacenan tokens del proveedor ni se permite redirección arbitraria.

`npm run test:social` verifica transacciones y concurrencia en TiDB de pruebas. Las comprobaciones con Google/Discord/GitHub reales siguen pendientes de la creación de sus aplicaciones; Android se configura al final.
