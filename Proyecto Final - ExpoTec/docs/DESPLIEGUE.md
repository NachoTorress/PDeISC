# ExpoTec — TiDB y Vercel

Decisión del usuario del 14/10/2026: base de datos en TiDB y frontend/backend como dos proyectos separados en Vercel. Los tres servicios están configurados y comprobados. TiDB tiene `expotec`, sus migraciones y un usuario limitado para la aplicación. La prueba SQL completa pasó en una base independiente `expotec_test_01`.

## Direcciones y prueba rápida

- Web pública: [ExpoTec](https://expotec-web-gn19.vercel.app).
- Base de la API: `https://expotec-api-gn19.vercel.app`.
- Panel del backend: [expotec-api en Vercel](https://vercel.com/gn19/expotec-api).
- Panel de la web: [expotec-web en Vercel](https://vercel.com/gn19/expotec-web).

Abrir la web permite probar la demostración. Para comprobar la API desde PowerShell:

```powershell
Invoke-RestMethod -Uri "https://expotec-api-gn19.vercel.app/api/health/ready" -Method Post -ContentType "application/json" -Body '{}'
```

La respuesta esperada es `status: ok` y `database: connected`. La API usa POST para sus consultas: abrir esa ruta o la raíz de la API directamente en el navegador hace una petición GET y devuelve 404.

En esta computadora, los archivos privados ya están preparados. Para trabajar localmente, abrir dos terminales desde la carpeta de ExpoTec: en `backend`, ejecutar `npm run dev`; en `frontend/native`, ejecutar `npm run web`. Para comprobar el código, ejecutar `npm test` en backend y `npm run typecheck` en frontend/native. Las pantallas conservan datos locales hasta completar la integración.

Los proyectos están conectados a `NachoTorress/PDeISC`, con **Production Branch: `main`**. Por indicación del usuario del 15/10/2026, trabajar, hacer commits y pushear directamente en `main`, sin crear ramas. Publicar cambios en `main` dispara los despliegues. El repositorio está en la carpeta superior `PDelSC`; incluir únicamente los cambios de ExpoTec y conservar los cambios locales de los otros proyectos.

```mermaid
flowchart LR
    Web[Web Expo en Vercel] --> API[API Express en Vercel]
    Android[App Expo Android] --> API
    API -->|MySQL con TLS| DB[(TiDB)]
```

El código activo de la web sigue siendo `frontend/native`, exportado mediante React Native Web. `frontend/web` conserva el prototipo anterior como referencia. La API atenderá ambos clientes cuando se conecten sus pantallas; actualmente conservan la demostración local.

## 1. Base en TiDB

La base `expotec` y las migraciones ya existen. Para preparar otra instalación, copiar `.env.example` a `.env` y `.env.setup.example` a `.env.setup`, completar las credenciales privadas y ejecutar `npm run db:setup`, `npm run db:migrate` y `npm run db:check` dentro de `backend`. No reemplazar los archivos privados de esta computadora por los ejemplos. Mantener TLS y verificación de certificado activados; usar `DB_SSL_CA` si hace falta indicar un PEM.

La API usa un usuario con SELECT, INSERT, UPDATE y DELETE exclusivamente en `expotec`. Las migraciones y la preparación cargan las credenciales de administración de `.env.setup`; ese archivo no se publica. No compartir credenciales con el frontend. El clúster está en São Paulo (`sa-east-1`); configurar el backend de Vercel en `gru1` cuando esté disponible.

## 2. Proyecto backend en Vercel

El proyecto `expotec-api` usa **Root Directory: `Proyecto Final - ExpoTec/backend`**, framework **Express**, Node **24.x**. Vercel reconoce `src/app.mjs`, que importa Express directamente, exporta la app y reutiliza un pool de conexiones por instancia. No ejecutar migraciones como Build Command.

Configurar variables exclusivamente en este proyecto:

| Variable | Valor |
| --- | --- |
| `NODE_ENV` | `production` |
| `JWT_SECRET` | secreto aleatorio, mínimo 32 bytes; mantenerlo entre despliegues |
| `CORS_ORIGINS` | origen HTTPS exacto del frontend; varios separados por coma |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | datos del clúster y base `expotec` |
| `DB_SSL` | `true` |
| `DB_SSL_CA` | opcional, certificado PEM; admite `\n` escapados |
| `DB_POOL_LIMIT` | `5`, valor inicial por instancia; ajustar según conexiones observadas |

Las diez variables necesarias ya están guardadas como secretos de Production en Vercel, incluyendo la contraseña del usuario limitado y el JWT generado. No cargar `TEST_DB_NAME` ni credenciales de administración en producción. No copiar `.env` al repositorio. El puerto lo administra Vercel; `PORT=3001` corresponde al desarrollo local. La API limita los cuerpos de estas rutas a 16 KB y no implementa carga de archivos.

Tras publicar, comprobar POST `/api/health` y POST `/api/health/ready` con cuerpo `{}`. El primer endpoint solo indica que el servicio responde; el segundo comprueba una consulta a la base. Registrar la cuenta propia y promoverla con el script local `admin:grant`, sin crear credenciales de demostración en producción.

## 3. Proyecto frontend en Vercel

El proyecto `expotec-web` importa el mismo repositorio con **Root Directory: `Proyecto Final - ExpoTec/frontend/native`**, Node **24.x** y framework **Other**. `vercel.json` establece build `npm run export:web`, salida `dist` y reescritura de las rutas a la entrada de la aplicación.

El frontend todavía no consume la API; no necesita variables para TiDB ni secretos. En el hito de integración se agregará la URL pública de la API y el manejo de sesión. Publicar ahora muestra el prototipo con datos locales de ejemplo.

## Entornos de prueba y archivos

Mantener base y secretos de prueba separados de producción. Los previews de Vercel requieren sus orígenes exactos en `CORS_ORIGINS` y deben apuntar a una base de prueba; no habilitar comodines para todos los dominios `vercel.app`.

Una API desplegada en funciones no debe conservar fotos, videos, copias de descargas ni sesiones en archivos locales. Las sesiones y límites de acceso de esta etapa se guardan en TiDB. La elección del servicio para imágenes/videos/descargas permanece pendiente.

## Fuentes verificadas

- [Express en Vercel](https://vercel.com/docs/frameworks/backend/express): detección de la aplicación y exportación de Express.
- [Pools de conexiones en Vercel](https://vercel.com/kb/guide/connection-pooling-with-functions): reutilización y cierre de conexiones ociosas.
- [Publicación web de Expo](https://docs.expo.dev/guides/publishing-websites/): exportación y configuración para Vercel.
- [TLS de TiDB Cloud](https://docs.pingcap.com/tidbcloud/secure-connections-to-serverless-clusters/): conexión segura y certificados.

## Estado del hito 7A

| Entregable | Estado |
| --- | --- |
| API de cuentas, sesiones, permisos y protección del último administrador | Implementada; 18 pruebas locales aprobadas |
| SQL de autenticación y migraciones repetibles | Aplicado a expotec y comprobado contra TiDB |
| Exportación web y dos proyectos Vercel | Publicados; typecheck y exportación web aprobados |
| Prueba completa MySQL/TiDB de concurrencia y restricciones | Aprobada en expotec_test_01 el 14/10/2026 |
| API pública conectada a TiDB | POST health y ready devuelven 200; ready confirma database: connected |
| Acceso público y CORS | Sesión sin token devuelve 401; preflight de la web devuelve 204; origen ajeno devuelve 403 |
| Pantallas conectadas, dominio ExpoTec y acceso social/recuperación | Próximos bloques de la etapa 7 |

El hito 7A de infraestructura queda comprobado el 14/10/2026. La autenticación del frontend y los datos compartidos de ExpoTec siguen pendientes. El APK continúa postergado por indicación del usuario.
