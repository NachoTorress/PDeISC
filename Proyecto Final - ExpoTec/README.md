# ExpoTec

Aplicación para organizar la exposición de proyectos de la E.E.S.T. N° 5 Amancio Williams: los alumnos presentan sus proyectos y piden un puesto y elementos, los profesores los revisan, el encargado de préstamos registra las entregas y devoluciones de cada jornada, y la organización administra espacios, inventario y usuarios. También ofrece una muestra pública, una galería de fotos y una presentación para televisores.

| | |
| --- | --- |
| Web | [expotec-web-gn19.vercel.app](https://expotec-web-gn19.vercel.app) |
| API | `https://expotec-api-gn19.vercel.app` |
| APK Android | Compilar la 0.5.1 con el código actual (la 0.5.0 usa GET y no funciona con esta API). Historial y enlaces en [APK de prueba](docs/APK_PRUEBA.md) |
| Versión del código | 0.5.1 |

## Documentación

| Documento | Markdown | PDF |
| --- | --- | --- |
| Manual de usuario | [docs/MANUAL_USUARIO.md](docs/MANUAL_USUARIO.md) | [PDF](output/pdf/ExpoTec_MANUAL_USUARIO.pdf) |
| Guía de instalación y configuración | [docs/GUIA_INSTALACION.md](docs/GUIA_INSTALACION.md) | [PDF](output/pdf/ExpoTec_GUIA_INSTALACION.pdf) |
| Guía de demostración | [docs/GUIA_DEMOSTRACION.md](docs/GUIA_DEMOSTRACION.md) | [PDF](output/pdf/ExpoTec_GUIA_DEMOSTRACION.pdf) |
| Documentación de la API (endpoints, métodos, parámetros, respuestas y errores) | [docs/DOCUMENTACION_API.md](docs/DOCUMENTACION_API.md), [backend/README.md](backend/README.md) y Swagger en [`/api/docs`](https://expotec-api-gn19.vercel.app/api/docs) ([openapi.json](docs/openapi.json)) | [PDF](output/pdf/ExpoTec_DOCUMENTACION_API.pdf) |

Documentación técnica complementaria: [despliegue](docs/DESPLIEGUE.md), [accesos sociales](docs/ACCESOS_SOCIALES.md), [Google en Android](docs/ANDROID_GOOGLE.md), [carga de fotos](docs/CARGA_FOTOS.md), [recuperación de contraseña](docs/RECUPERACION_CONTRASENA.md), [diagramas](docs/diagramas/README.md) y [requisitos](docs/REQUISITOS.md).

## Cumplimiento de la consigna

| Requisito | Cómo se resuelve | Dónde |
| --- | --- | --- |
| Registro e inicio de sesión | Registro como alumno o invitado, ingreso con correo y contraseña, recuperación por correo. | `backend/src/routes/auth.mjs`, `frontend/native/src/pages/AccountPage.tsx` |
| Autenticación con 3 redes sociales | Google (selector nativo en Android), Discord y GitHub con OAuth 2.0. | `backend/src/services/social*.mjs`, `frontend/native/src/components/SocialAccess.tsx` |
| Mínimo 3 roles con permisos distintos | Alumno, profesor, encargado de préstamos, administrador e invitado; menús y endpoints según el rol. | `backend/src/middleware/auth.mjs`, repositorios |
| Interfaz amigable y adaptable | Componentes responsivos para teléfono, tablet y escritorio, tema claro y oscuro, modo horizontal y vertical. | `frontend/native/src/components/base/` |
| Navegación entre pantallas | React Navigation: pila de pantallas y pestañas. | `frontend/native/src/components/navigation/` |
| API con CRUD | POST (consultar y crear), PUT, PATCH y DELETE sobre espacios, proyectos, inventario, préstamos, galería y usuarios. Sin GET: los datos viajan siempre en el cuerpo JSON. | `backend/src/routes/` |
| Manejo de errores | Errores JSON con código y mensaje en español; validación por campo en los formularios. | `backend/src/create-app.mjs`, `frontend/native/src/lib/authRequest.ts` |
| Estado global | Context API para sesión, tema y demostración. | `frontend/native/src/contexts/` |
| Sesión persistente | Token de renovación en SecureStore (Android) o cookie HttpOnly (web). | `frontend/native/src/lib/sessionStorage.*.ts` |
| JWT de acceso y renovación | Acceso de 15 minutos y renovación rotativa de hasta 30 días. | `backend/src/services/crypto.mjs` |
| Base MySQL estructurada | 10 migraciones relacionales en TiDB (compatible con MySQL). | `backend/sql/` |
| Documentación de la API en README | Endpoints, métodos, parámetros, respuestas y códigos de error. | [backend/README.md](backend/README.md) |
| Manual de usuario, guía de instalación y documentación de la API | Markdown y PDF. | `docs/`, `output/pdf/` |
| APK | Compilación EAS con perfil `preview`. | `frontend/native/eas.json` |

## Tecnologías

- **Frontend:** React Native 0.86 con Expo SDK 57 y TypeScript; React Navigation; React Native Web para la versión de navegador.
- **Backend:** Node.js 24, Express 5, jose (JWT), mysql2, Helmet y CORS.
- **Base de datos:** TiDB Cloud (MySQL).
- **Servicios:** Vercel (web y API), Vercel Blob (fotos), Gmail SMTP (recuperación), EAS (APK).

## Estructura del repositorio

```text
Proyecto Final - ExpoTec/
├── backend/                API (Express + MySQL). Ver backend/README.md
│   ├── src/                config, middleware, routes, services, repositories, validators
│   ├── sql/                migraciones 001–010
│   ├── scripts/            migrar, comprobar, crear administrador, limpieza
│   └── test/               pruebas unitarias y de integración
├── frontend/
│   ├── native/             App React Native (Android y web)
│   │   ├── src/app.tsx     navegación y estructura general
│   │   ├── src/pages/      pantallas (Shared* = conectadas a la API; el resto, demostración)
│   │   ├── src/components/ componentes reutilizables; base/ (botones, campos, tarjetas),
│   │   │                   navigation/ (barra, menú, pila y pestañas) y una carpeta por
│   │   │                   sección (proposal/, spaces/, inventory/, loans/, project/…)
│   │   ├── src/hooks/      estado y llamadas a la API de las pantallas grandes
│   │   ├── src/contexts/   estado global (sesión, tema, demostración)
│   │   ├── src/lib/        cliente de API, validaciones y reglas
│   │   └── scripts/        vista previa, ensayos visuales y capturas del manual
│   └── web/                prototipo anterior (Vite), solo como referencia
├── docs/                   manuales, guías, capturas, diagramas y exportador de PDF
└── output/pdf/             manuales en PDF
```

## Instalación rápida

Requisitos: Node.js 24, npm, Git y una base MySQL/TiDB. Los pasos completos, con variables de entorno y migraciones, están en la [guía de instalación](docs/GUIA_INSTALACION.md).

```powershell
# Backend
cd backend
npm ci
Copy-Item .env.example .env      # completar JWT_SECRET, CORS_ORIGINS y DB_*
npm run db:migrate
npm run dev                      # http://localhost:3001

# Frontend (otra terminal)
cd frontend/native
npm ci
npm run web                      # versión navegador
npm run android                  # emulador o dispositivo
```

Comprobaciones:

```powershell
cd backend;          npm test
cd frontend/native;  npm run typecheck; npm run lint; npm test
```

### Generar la APK

```powershell
cd frontend/native
npx eas-cli build --platform android --profile preview
```

La APK 0.4.0 publicada sigue funcionando con la API 0.5.1 gracias a una capa de compatibilidad (ver [backend/README.md](backend/README.md#compatibilidad-con-la-apk-040)). La APK 0.5.0 usaba GET y **no funciona** con la API 0.5.1: hay que generar la 0.5.1 con el comando anterior y adjuntarla también como *Release* en GitHub, porque los enlaces de descarga de Expo pueden vencer.

## Roles

| Rol | Qué puede hacer |
| --- | --- |
| Visitante sin cuenta | Ver espacios, proyectos confirmados, galería y presentación TV. |
| Invitado | Enviar fotos a la galería y ver el estado de sus aportes. |
| Alumno | Presentar y corregir propuestas de proyecto, sumar equipo, pedir puesto y elementos. |
| Profesor | Confirmar o pedir cambios en los proyectos que tiene asignados. |
| Encargado de préstamos | Consultar inventario y registrar entregas y devoluciones. |
| Administrador | Usuarios y permisos, espacios y planos, inventario, moderación de fotos. |

La aplicación incluye además una **demostración** con datos ficticios locales, donde se puede cambiar de perfil sin crear cuentas. Sus cambios no se envían al servidor.

## Control de versiones

El repositorio Git es la carpeta superior `PDelSC` (rama `main`). Los archivos `.env`, contraseñas, tokens, APK y compilaciones están excluidos por `.gitignore`. Frontend y backend se despliegan por separado en Vercel desde `main`.

Mensajes de commit sugeridos para estos cambios:

```text
feat(api): consultas por POST sin GET, compatibles con la APK 0.4.0
refactor(front): dividir pantallas y componentes largos en módulos
docs(code): documentar backend y frontend
docs: limpiar README, documentación de la API y manuales con capturas
```
