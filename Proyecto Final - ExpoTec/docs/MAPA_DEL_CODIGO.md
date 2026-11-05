# Dónde está cada parte de ExpoTec

Abrir [el mapa interactivo](diagramas/mapa-codigo.html) con doble clic. Incluye cinco diagramas, un explorador de carpetas, buscador y una ficha de función por ubicación. Funciona sin conexión y permite descargar cada vista en SVG. El [original draw.io](diagramas/Mapa-del-codigo-ExpoTec.drawio) tiene cinco páginas editables; el [inventario JSON](diagramas/mapa-codigo.json) conserva las rutas y descripciones.

Las rutas empiezan en `Proyecto Final - ExpoTec/`, dentro del repositorio superior `PDelSC`. El mapa excluye los otros proyectos. Se basa en las rutas versionadas y añade ubicaciones locales identificadas como tales; no lee valores de archivos privados. Las descripciones de archivos secundarios indican si se deducen de su carpeta o de su nombre. Una carpeta ignorada puede no existir en otra instalación.

## Las cinco vistas

| Vista | Qué permite ubicar |
| --- | --- |
| [Estructura general](diagramas/mapa-general.svg) | Código, prototipo anterior, documentación, entregables y evidencia. |
| [Web y Android](diagramas/mapa-frontend.svg) | Pantallas, componentes, contextos, lógica, recursos y entradas de la app actual. |
| [API y base de datos](diagramas/mapa-backend.svg) | Entradas del servidor, rutas, validación, servicios, SQL, migraciones y pruebas. |
| [Código → web, API y APK](diagramas/mapa-compilacion.svg) | Qué se compila, dónde se publica y qué servicios quedan fuera del repositorio. |
| [Documentos y soporte](diagramas/mapa-documentacion.svg) | Manuales fuente, PDF, diagramas, generadores y criterios del proyecto. |

En las vistas de carpetas las líneas significan **contiene**, incluso cuando se omiten niveles intermedios para simplificar la vista. En compilación las flechas están rotuladas con una **acción**. Los servicios remotos tienen otro color y no representan carpetas.

## Código que está en uso

**`frontend/native` contiene tanto la web actual como la aplicación Android.** `frontend/web` es el prototipo anterior con Vite. Para corregir un botón de la página publicada hay que empezar por `frontend/native`, no por el prototipo.

La entrada es `index.ts` → `src/main.tsx` → `src/app.tsx`. `main.tsx` registra la aplicación en Expo y restaura el acceso social; `app.tsx` monta los contextos y la estructura de navegación.

| Carpeta de `frontend/native` | Responsabilidad |
| --- | --- |
| `src/pages` | Pantallas completas. `Shared*` está conectado a la API; `AccountPage` y `AdminUsersPage` también. Las pantallas de demostración usan datos locales. |
| `src/components` | Formularios y piezas reutilizables. `base` define controles; `navigation` define rutas y menú; las demás subcarpetas agrupan funciones de la interfaz. |
| `src/contexts` | Sesión real (`AuthContext`), tema (`ThemeContext`) y demostración local (`DemoContext`). |
| `src/hooks` | Lógica React reutilizable para cargas, propuestas, espacios, préstamos y presentación. |
| `src/lib` | Clientes de API, tipos, reglas, persistencia local y adaptaciones por plataforma. Las pruebas `*.test.ts` se guardan junto a sus módulos. |
| `src/theme` | Colores y medidas comunes de los temas claro y oscuro. |
| `assets` | Icono e imágenes que se empaquetan con la aplicación. |
| `public` | Archivos estáticos de la exportación web y puente del acceso social móvil. |
| `scripts` | Vista previa, capturas del manual y comprobaciones auxiliares. |

Los sufijos `.web.ts(x)` y `.native.ts(x)` son versiones para navegador y plataforma nativa. Los `.d.ts` declaran tipos. No son copias que haya que combinar manualmente. Los módulos `shared*`, `gallery`, `adminUsers` y `auth*` se comunican con la API; `model`, `seed`, `persistence` y `DemoContext` sostienen la demostración local.

## Backend y base

`backend/src/app.mjs` lee configuración, construye el pool de TiDB y conecta los repositorios reales. Vercel utiliza esa aplicación Express. `server.mjs` la importa para escuchar localmente. **No existe una carpeta `backend/api` en este proyecto.**

`create-app.mjs` monta las rutas, seguridad común y manejo de errores. Las solicitudes pasan por los módulos del dominio según lo que necesiten:

| Carpeta de `backend` | Responsabilidad |
| --- | --- |
| `src/config` | Configuración y conexión MySQL/TiDB. |
| `src/middleware` | Sesión, permisos y compatibilidad con rutas anteriores. |
| `src/routes` | Endpoints HTTP. `auth.mjs` también incluye administración; `projects.mjs`, presentación. |
| `src/validators` | Tipos, formatos, límites y estructura de solicitudes. |
| `src/services` | Acceso, JWT, contraseñas, OAuth, recuperación, correo e imágenes. No hay un servicio separado para todos los dominios. |
| `src/repositories` | Consultas SQL, transacciones y reglas de disponibilidad, versiones y estados. |
| `src/docs` | Especificación OpenAPI. |
| `src/lib` | Errores comunes. |
| `sql` | Diez migraciones que definen el esquema; los registros reales están en TiDB. |
| `scripts` | Preparar, migrar, comprobar y administrar la base; exportar OpenAPI. |
| `test` | Pruebas unitarias e integraciones con base configurada. |

Una corrección de validación debe considerar el formulario **y** el servidor. Las reglas del backend están distribuidas entre validadores, middleware, servicios y repositorios; no alcanza con modificar la pantalla.

## Configuración y salidas

| Archivo o ubicación | Para qué sirve |
| --- | --- |
| `package.json` / `package-lock.json` de cada aplicación | Comandos, dependencias, versión y versiones exactas instaladas. |
| `frontend/native/app.json` | Identidad Expo, icono, versión visible y código Android. |
| `frontend/native/eas.json` / `.easignore` | Perfil y archivos enviados al compilador EAS; `preview` produce APK. |
| `frontend/native/vercel.json` | Exporta la web a `dist` y dirige `/api` al backend independiente. |
| `backend/vercel.json` | Configura el despliegue de la API. |
| `.env*.example` | Plantillas públicas de configuración. Los `.env` reales son privados y no se versionan. |
| `node_modules` | Dependencias generadas por npm; se reconstruyen con `npm ci`. |
| `frontend/native/dist` | Web compilada, no su fuente. |
| `frontend/native/dist-android` | Exportación de código y recursos Android; no es un instalador APK. |
| `artifacts/android` | APK descargadas y evidencia local de compilación. |
| `.expo`, `.npm-cache`, `.vercel` | Estado y herramientas locales ignorados por Git. |

No hay una carpeta nativa `android` versionada: EAS genera el proyecto Android al compilar. TiDB guarda los registros y Vercel Blob las imágenes subidas; ninguno vive dentro de `assets`. Modificar el backend requiere desplegar la API. Modificar código incluido en Android requiere generar otra APK; modificar la web requiere exportarla y publicarla.

## Documentos y material auxiliar

`docs` contiene las fuentes Markdown y las guías técnicas. `docs/scripts` las transforma en visores, diagramas o PDF. `docs/diagramas` reúne HTML autónomos, SVG y originales `.drawio`; `docs/capturas` y `docs/pruebas` guardan imágenes y evidencia. `output/pdf` contiene los cuatro manuales exportados.

`artifacts/qa-2026-10-26` es evidencia versionada de una auditoría histórica. Las otras carpetas de revisión dentro de `artifacts` son salidas locales ignoradas. `output/capturas-demo` y `output/video` son material local no versionado en el estado revisado. `Claude outputs` contiene una copia auxiliar de documentación. `.impeccable`, `DESIGN.md` y `PRODUCT.md` orientan el diseño y alcance; no son código de ejecución. `AGENTS.md` contiene instrucciones de trabajo. `revision-frontend.patch` es un parche guardado. `Nueva carpeta` está vacía y no cumple una función en el programa.

## Mantener el mapa

Las descripciones y las vistas se mantienen en `docs/scripts/build_code_map.mjs`; la interfaz se mantiene en `code_map_viewer.html.in`. Desde ExpoTec:

```powershell
npm install --prefix artifacts/system-map/model-tools --no-save --package-lock=false @viz-js/viz@3.31.0
node docs/scripts/build_code_map.mjs
```

El generador lee rutas versionadas con `git ls-files`; agregar primero las fuentes nuevas al índice de Git para incluirlas. No necesita conexión a TiDB ni servicios de producción. Graphviz/WASM distribuye los nodos y renderiza los SVG; el editable draw.io conserva figuras, texto y conexiones, con geometría traducida del mismo modelo. Los SVG no son exportaciones nativas de draw.io. Para los datos y relaciones del sistema, consultar el [DFD y DER](DFD_Y_DER.md).
