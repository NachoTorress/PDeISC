# Carga de fotos

Desde el 22/10/2026, proyectos compartidos y galería permiten elegir una foto del dispositivo. El enlace HTTPS sigue disponible como alternativa. Videos y otros documentos conservan enlaces; no se habilita carga arbitraria de archivos.

## Almacenamiento y configuración

El depósito **expotec-fotos** de Vercel Blob es **privado**, en `gru1`, conectado únicamente al backend `expotec-api`. La conexión administra `BLOB_READ_WRITE_TOKEN`; nunca debe llevar prefijo `EXPO_PUBLIC_`, copiarse al frontend ni versionarse. Aplicar `backend/sql/009_uploads.sql` con `npm run db:migrate` antes del despliegue.

La API sigue iniciando sin el token; solo la carga devuelve 503 y permite usar un enlace. Las URLs estables usan `SOCIAL_WEB_ORIGIN` o, sin proveedores sociales, el primer origen autorizado de `CORS_ORIGINS`. `metro.config.js` resuelve los adaptadores oficiales de navegador del SDK de Blob para Metro; no incluye credenciales.

## Flujo

1. `POST /api/uploads/prepare`, autenticado y limitado a 20 cargas por hora y usuario, recibe propósito (`gallery` o `project`), tipo y tamaño. Proyectos requiere permiso de alumno. Devuelve un token de diez minutos limitado al nombre aleatorio asignado por el servidor, formato y 10 MB; no permite sobrescritura.
2. El cliente sube directamente a Blob **privado**. Web y Android optimizan a JPEG de hasta 1600 píxeles antes de transmitir y muestran progreso. Android usa el decodificador nativo y transmite el archivo de caché por URI, sin convertirlo a un Blob en memoria ni depender del MIME que informe la galería.
3. `POST /api/uploads/complete`, autenticado por el propietario, reclama el registro una vez. El backend lee únicamente el archivo asignado, verifica y decodifica sus bytes, limita a 40 megapíxeles, descarta animaciones, orienta, redimensiona y convierte a JPEG sin metadatos. El resultado no supera 2 MB. Retira el original y devuelve la URL estable.
4. Guardar un proyecto o enviar una foto comprueba en la transacción la propiedad, propósito y estado de la carga. Un integrante puede conservar la imagen que ya tenía el proyecto al editarlo.
5. `POST /api/uploads/preview` devuelve la imagen a su propietario, administración o integrantes/profesores del proyecto correspondiente. La respuesta queda temporalmente en memoria, sin persistir la foto en el navegador.
6. `GET /api/uploads/:id/image` entrega únicamente imágenes vinculadas a una foto o proyecto aprobado. Devuelve 404 para las demás y `Cache-Control: no-store`. Retirar una aprobación corta el acceso en nuevas solicitudes. El depósito permanece privado incluso para las imágenes publicadas.

Los enlaces externos siguen dependiendo de su alojamiento original: ExpoTec controla su publicación dentro de la aplicación, no la privacidad del servicio externo.

## Limpieza

`npm run db:prune` también retira cargas sin referencias que lleven más de siete días sin actualizarse. Comprueba las referencias bajo bloqueo antes de borrar objetos y registro. Conserva fotos de proyectos y galería, incluso rechazadas, para que sus autores puedan consultarlas. Esta limpieza es manual; no se creó una automatización periódica.

## Verificación

`npm test` cubre formatos falsos, límites, optimización, permisos, concurrencia, idempotencia y bloqueo de visitantes. `npm run test:uploads` usa exclusivamente `TEST_DB_NAME=expotec_test_*`, con Blob privado real y una imagen sintética; comprueba carga, acceso directo privado, propiedad, aprobación, retiro y limpieza. Retira únicamente sus propios objetos y registros. El token local puede configurarse en `.env.uploads`, siempre excluido de Git.

La revisión en navegador cubre elegir/cancelar, vista previa, progreso, errores y reintento, envío a moderación y edición de proyectos. La verificación de Android físico y APK continúa al final del proyecto.

## Corrección de Android 0.3.1

La APK anterior llamaba a `AbortSignal.throwIfAborted()`, ausente en el paquete `abort-controller` que instala React Native. El mensaje «función undefined» se producía antes de preparar la carga en el servidor. La comprobación ahora usa `signal.aborted` y la regresión ejecuta el mismo AbortController de React Native, en lugar del que ofrece Node.

La interfaz distingue optimización, subida y guardado; permite cancelar o reintentar la misma foto. El archivo temporal se retira al finalizar, cancelar o fallar. Sólo `/api/uploads/complete` dispone de 60 segundos para procesar la imagen; las demás consultas conservan su límite anterior.

La integración real `npm run test:uploads` también usa el destino y los encabezados del cliente Android con bytes JPEG. Requiere instalar las dependencias de `frontend/native` además de las del backend. Comprueba TiDB de pruebas, Blob privado, procesamiento, vista previa, aprobación, retiro y limpieza de sus registros sintéticos. Esta prueba y el empaquetado no sustituyen la selección y carga de una foto desde una APK instalada.
