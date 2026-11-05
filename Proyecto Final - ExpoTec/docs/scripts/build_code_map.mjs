/** Mapa del repositorio: inventario de rutas, roles documentados y diagramación con Graphviz/WASM. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.join(root, 'docs/diagramas');
const require = createRequire(import.meta.url);
const { instance } = require(path.join(root, 'artifacts/system-map/model-tools/node_modules/@viz-js/viz'));
const viz = await instance();
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const q = JSON.stringify;
const definitions = new Map();
function describe(p, summary, note = '', status = 'source') { definitions.set(p, { summary, note, status }); }
describe('.', 'Proyecto Final - ExpoTec', 'Este proyecto vive dentro del repositorio PDelSC. Las rutas de este mapa empiezan aquí; los demás proyectos del repositorio quedan fuera.');
describe('frontend', 'Interfaces de usuario: aplicación actual y prototipo anterior.');
describe('frontend/native', 'Aplicación actual: Android y web comparten este código.', 'React Native + Expo + TypeScript. La web publicada también se construye desde esta carpeta.');
describe('frontend/native/index.ts', 'Primer archivo que carga Expo.', 'Importa src/main.tsx. El campo main de package.json apunta a este archivo.');
describe('frontend/native/src', 'Código de la aplicación actual.');
describe('frontend/native/src/main.tsx', 'Registra la raíz en Expo y restaura el acceso social.', 'En Android espera a que socialBridge recupere un acceso pendiente antes de montar App.');
describe('frontend/native/src/app.tsx', 'Arma la aplicación, sus contextos y la navegación.', 'Proveedores de sesión, tema, demostración, teclado y área segura; estructura general de pantallas y menú.');
describe('frontend/native/src/pages', 'Pantallas completas de cada sección.', 'Shared* usa datos de la API. AccountPage y AdminUsersPage también son reales. Las pantallas de demostración usan estado local.');
describe('frontend/native/src/contexts', 'Estado compartido entre pantallas.');
describe('frontend/native/src/contexts/AuthContext.tsx', 'Sesión real, usuario y operaciones de acceso.');
describe('frontend/native/src/contexts/DemoContext.tsx', 'Datos y perfil ficticio de la demostración.', 'Su estado local no representa los datos compartidos de TiDB.');
describe('frontend/native/src/contexts/ThemeContext.tsx', 'Selección de tema y colores disponibles para la interfaz.');
describe('frontend/native/src/hooks', 'Lógica reutilizable de pantallas y comportamientos React.', 'Coordina carga, formularios, selección de espacios, préstamos, presentación y gestos.');
describe('frontend/native/src/components', 'Piezas visuales y formularios reutilizables.', 'Incluye componentes en esta carpeta y subcarpetas por función.');
for (const [dir, purpose] of Object.entries({ base: 'Botones, campos, opciones, pantallas y estilos básicos.', navigation: 'Cabecera, menú, rutas, pila de pantallas y pestañas.', account: 'Presentación del acceso y campos de registro.', social: 'Botones de proveedores y completar el perfil social.', project: 'Ficha, enlaces, recursos e historial de revisión de proyectos.', proposal: 'Pasos, selección de lugar y errores de la propuesta.', spaces: 'Crear y editar espacios y puestos.', floorplan: 'Geometría, selección, movimiento y tamaño en el plano.', map: 'Secciones del mapa y creación de espacios de demostración.', inventory: 'Tarjetas e historial del inventario.', loans: 'Tarjetas e historial de préstamos.' })) describe(`frontend/native/src/components/${dir}`, purpose);
describe('frontend/native/src/lib', 'Clientes de API, reglas de dominio y adaptaciones de plataforma.', 'Aquí conviven módulos reales y del modo demostración; el nombre y la pantalla que lo importa determinan cuál se utiliza. Las pruebas *.test.ts están junto a estos módulos.');
describe('frontend/native/src/lib/authRequest.ts', 'Transporte de solicitudes autenticadas y tratamiento de errores.');
describe('frontend/native/src/lib/authClient.ts', 'Operaciones de cuenta y sesión contra la API.');
for (const [name, purpose] of Object.entries({ sharedSpaces: 'espacios y planos', sharedProjects: 'proyectos compartidos', sharedInventory: 'inventario compartido', sharedLoans: 'préstamos compartidos', sharedPresentation: 'presentación pública', adminUsers: 'administración de cuentas', gallery: 'galería, moderación y eliminación de fotos' })) describe(`frontend/native/src/lib/${name}.ts`, `Cliente de API para ${purpose}.`);
describe('frontend/native/src/lib/model.ts', 'Operaciones del modelo local de demostración.');
describe('frontend/native/src/lib/seed.ts', 'Datos iniciales de ejemplo para la demostración.');
describe('frontend/native/src/lib/persistence.ts', 'Lectura y escritura del estado de demostración.');
describe('frontend/native/src/lib/photoUpload.ts', 'Coordina la subida de imágenes desde la aplicación.');
describe('frontend/native/src/components/navigation/RootStack.tsx', 'Relaciona nombres de ruta con las pantallas de la pila.');
describe('frontend/native/src/components/navigation/navigationItems.ts', 'Define las opciones de navegación según la sesión y permisos.');
describe('frontend/native/src/theme', 'Colores y medidas compartidos de los temas claro y oscuro.');
describe('frontend/native/assets', 'Recursos que se empaquetan con la aplicación.', 'Marca e imágenes de demostración; las fotos subidas por usuarios se almacenan en Blob.');
describe('frontend/native/assets/brand', 'Icono y marca de ExpoTec.');
describe('frontend/native/assets/demo-gallery', 'Imágenes de ejemplo incluidas para la demostración.');
describe('frontend/native/public', 'Archivos estáticos para la exportación web.', 'mobile-auth.html y mobile-auth.js participan del regreso del acceso social al teléfono.');
describe('frontend/native/scripts', 'Vista previa y comprobaciones auxiliares de la interfaz.', 'Incluye captura del manual y revisiones de diseño, correcciones móviles y propuestas.');
describe('frontend/native/package.json', 'Dependencias, versión de la app y comandos de trabajo.', 'Incluye test, lint, typecheck, export:web y export:android.');
describe('frontend/native/app.json', 'Identidad y configuración de Expo y Android.', 'Nombre, icono, versión visible, código Android, permisos y plugins.');
describe('frontend/native/eas.json', 'Perfiles de compilación remota de Android.', 'preview genera APK; production genera App Bundle. EAS compila usando el código de frontend/native.');
describe('frontend/native/.easignore', 'Selecciona qué archivos se envían a la compilación EAS.', 'Evita enviar dependencias instaladas, exportaciones y archivos ajenos al código necesario.');
describe('frontend/native/vercel.json', 'Publicación de la web actual en Vercel.', 'Ejecuta export:web, sirve dist y dirige /api a la API separada.');
describe('frontend/native/metro.config.js', 'Configuración del empaquetador de Expo.');
describe('frontend/native/tsconfig.json', 'Reglas de TypeScript y resolución de archivos.');
describe('frontend/native/eslint.config.mjs', 'Reglas de revisión estática del código de interfaz.');
describe('frontend/web', 'Prototipo web anterior con React y Vite.', 'Se conserva como antecedente. Para cambiar la web actual hay que trabajar en frontend/native.', 'legacy');
describe('backend', 'API que aplica permisos y guarda los datos compartidos.', 'Node.js + Express; conexión con TiDB mediante mysql2. Se despliega por separado de la web.');
describe('backend/src', 'Código de ejecución del servidor.');
describe('backend/src/app.mjs', 'Entrada de producción: configuración, base y repositorios reales.', 'Exporta la aplicación Express que usa Vercel. No existe una carpeta backend/api en este proyecto.');
describe('backend/src/server.mjs', 'Arranca el servidor HTTP local y cierra conexiones al salir.', 'npm run dev y npm start utilizan este archivo, que importa app.mjs.');
describe('backend/src/create-app.mjs', 'Compone Express: seguridad, rutas y errores comunes.', 'Recibe repositorios para permitir reemplazarlos en pruebas. Monta las rutas, CORS, límites del cuerpo JSON y manejo de fallos.');
describe('backend/src/config', 'Lectura de configuración y creación de conexiones a TiDB.');
describe('backend/src/config/database.mjs', 'Construye el pool de conexiones MySQL/TiDB.');
describe('backend/src/config/env.mjs', 'Lee y valida las variables de configuración.', 'Los valores reales vienen de archivos privados locales o de la configuración del despliegue.');
describe('backend/src/middleware', 'Comprobaciones que se ejecutan antes de las rutas.', 'auth.mjs comprueba acceso y permisos; legacy-routes.mjs adapta rutas de APK anteriores.');
describe('backend/src/routes', 'Endpoints HTTP por dominio.', 'Reciben solicitudes y conectan validadores, servicios y repositorios. auth.mjs también contiene la gestión administrativa de usuarios; projects.mjs incluye la presentación.');
describe('backend/src/validators', 'Validación del cuerpo de las solicitudes.', 'Comprueba tipos, formatos, límites y estructuras antes de operar con los datos.');
describe('backend/src/services', 'Servicios de acceso, seguridad e integraciones.', 'Contraseñas, JWT, OAuth, recuperación por correo y procesamiento de imágenes. No hay una capa services por cada dominio.');
describe('backend/src/repositories', 'SQL, transacciones y reglas de persistencia.', 'Además de consultar tablas, verifica reglas del negocio: disponibilidad, versiones, asignaciones, préstamos y estados.');
describe('backend/src/docs', 'Construcción de la especificación OpenAPI de la API.');
describe('backend/src/lib', 'Errores y utilidades comunes del servidor.');
describe('backend/sql', 'Migraciones SQL que definen el esquema de la base.', '001–010 crean y modifican las tablas. No contienen la base de producción ni sus registros; los datos viven en TiDB.');
describe('backend/scripts', 'Herramientas de administración de base y documentación.', 'Migrar, comprobar, preparar la base, otorgar administración, depurar y exportar OpenAPI. Algunas cambian datos: revisar el comando antes de ejecutarlo.');
describe('backend/scripts/migrations.mjs', 'Motor y registro de las migraciones SQL.');
describe('backend/scripts/migrate.mjs', 'Aplica migraciones pendientes a la base configurada.');
describe('backend/test', 'Pruebas unitarias y de integración del backend.', '*.test.mjs: pruebas de npm test; *.integration.mjs: pruebas específicas con base configurada.');
describe('backend/package.json', 'Dependencias, versión y comandos del servidor.', 'Distingue pruebas unitarias, integraciones, migraciones, administración y exportación de API.');
describe('backend/vercel.json', 'Configuración del despliegue independiente de la API.');
describe('docs', 'Manuales, explicación técnica y evidencia del proyecto.', 'Los documentos de auditoría describen el estado de su fecha; no son comprobaciones ejecutadas hoy.');
describe('docs/README.md', 'Índice de la documentación.');
describe('docs/MANUAL_USUARIO.md', 'Cómo utilizar la aplicación por perfil.');
describe('docs/GUIA_INSTALACION.md', 'Preparación y configuración del sistema.');
describe('docs/GUIA_DEMOSTRACION.md', 'Recorrido de demostración para presentar el proyecto.');
describe('docs/DOCUMENTACION_API.md', 'Contrato y uso de los endpoints de la API.');
describe('docs/FUNCIONAMIENTO_COMPLETO.md', 'Recorridos y conexiones entre app, API, base y servicios.');
describe('docs/DFD_Y_DER.md', 'Notación y restricciones de los modelos de datos.');
describe('docs/MAPA_DEL_CODIGO.md', 'Guía del mapa de carpetas y de dónde modificar cada función.');
describe('docs/APK_PRUEBA.md', 'Versiones, enlace de descarga y verificaciones de la APK.');
describe('docs/openapi.json', 'Contrato OpenAPI exportado desde el backend.', 'Se regenera con npm run docs:openapi en backend.');
describe('docs/diagramas', 'Visores, SVG, modelos y originales editables de diagramas.');
describe('docs/capturas', 'Imágenes utilizadas en los manuales.');
describe('docs/pruebas', 'Evidencias de pruebas guardadas con la documentación.');
describe('docs/scripts', 'Generadores de manuales y diagramas, y sus plantillas.');
describe('docs/scripts/build_code_map.mjs', 'Genera este inventario y los cinco diagramas del código.', 'Lee las rutas versionadas y estas descripciones; no lee archivos .env privados. Distribuye con Graphviz y exporta HTML, SVG, JSON y draw.io.');
describe('docs/scripts/code_map_viewer.html.in', 'Plantilla del visor de carpetas y archivos.');
describe('docs/scripts/build_data_models.mjs', 'Extrae el esquema SQL y genera el DFD y DER actuales.');
describe('docs/scripts/build_system_flow.py', 'Generador de los recorridos explicativos anteriores.', 'Los modelos técnicos actuales son los DFD y DER; estos recorridos se conservan como antecedentes.', 'legacy');
describe('docs/scripts/export_manuals.py', 'Convierte los manuales Markdown a PDF en output/pdf.');
describe('output', 'Archivos producidos para entrega y demostración.', 'No es código de ejecución. Los PDF versionados y las salidas locales se distinguen en el inventario.', 'output');
describe('output/pdf', 'Manuales PDF generados desde docs.', 'Editar los Markdown y volver a exportar para actualizar estos archivos.', 'output');
describe('artifacts', 'Evidencia, compilaciones y herramientas de trabajo.', 'Contiene una auditoría versionada y varias salidas locales ignoradas.', 'output');
describe('artifacts/qa-2026-10-26', 'Informe y capturas de la auditoría del 26 de octubre.', 'Evidencia histórica, no código necesario para arrancar la aplicación.', 'output');
describe('Claude outputs', 'Copia de documentación y entregables auxiliares.', 'La fuente mantenida de los manuales está en docs; no es parte del programa.', 'output');
describe('.impeccable', 'Referencias de diseño y descripción de superficies.', 'Documentación para el trabajo de diseño; no interviene en la ejecución.');
describe('README.md', 'Presentación del proyecto, enlaces y comandos principales.');
describe('AGENTS.md', 'Instrucciones de trabajo para agentes en este proyecto.');
describe('PRODUCT.md', 'Objetivo, alcance y comportamiento esperado del producto.');
describe('DESIGN.md', 'Criterios de diseño visual de la aplicación.');
describe('.gitignore', 'Reglas para excluir archivos locales, privados y generados de Git.');
describe('.gitattributes', 'Reglas de Git para tratar los archivos del repositorio.');
describe('revision-frontend.patch', 'Parche guardado de una revisión del frontend.', 'No se ejecuta al abrir ni compilar la aplicación.', 'legacy');
for (const p of ['frontend/native/node_modules', 'backend/node_modules', 'frontend/web/node_modules']) describe(p, 'Dependencias instaladas por npm.', 'Se reconstruyen con npm ci a partir de package.json y package-lock.json; no se editan como código del proyecto.', 'generated');
for (const [p, s] of Object.entries({ 'frontend/native/dist': 'Web exportada para publicar o probar.', 'frontend/native/dist-android': 'Exportación de JavaScript y recursos para Android; no es una APK.', 'frontend/native/.expo': 'Estado y caché local de Expo.', 'artifacts/android': 'APK descargada y evidencia de sus compilaciones.', 'artifacts/system-map': 'Herramientas locales y comprobaciones de los diagramas.', 'artifacts/design-review': 'Evidencia local de revisión visual.', 'artifacts/mobile-fixes': 'Evidencia local de correcciones móviles.', 'artifacts/proposal-flow': 'Evidencia local del formulario de propuestas.', 'artifacts/documentation': 'Archivos auxiliares para revisar documentación.', '.npm-cache': 'Caché local de npm.', '.vercel': 'Vinculación local con los proyectos de Vercel.' })) describe(p, s, 'Salida o configuración local ignorada por Git; no forma parte del código fuente versionado.', 'generated');
describe('output/capturas-demo', 'Capturas locales de la demostración.', 'Directorio local no versionado en el estado revisado.', 'local');
describe('output/video', 'Material audiovisual local de demostración.', 'Directorio local no versionado en el estado revisado.', 'local');
describe('Nueva carpeta', 'Carpeta local vacía, sin función en la aplicación.', 'No tiene archivos ni referencias de ejecución en el estado revisado.', 'local');
describe('backend/.env', 'Configuración privada local del backend.', 'Se representa solo la ubicación. Nunca se incorporan valores ni contenidos al mapa.', 'private');
describe('artifacts/android/ExpoTec-0.5.3-9.apk', 'Instalador Android 0.5.3, código de versión 9.', 'APK generada y descargada para instalar en el teléfono; no es código fuente y no se versiona en Git.', 'generated');

const palette = { source: ['#eef6ff', '#3872a8'], legacy: ['#fff3dd', '#a77925'], output: ['#eaf7ee', '#3e7954'], generated: ['#f0f1f4', '#747c88'], local: ['#f0f1f4', '#747c88'], private: ['#ffeded', '#b25a5a'], external: ['#f1ecff', '#7459a4'] };
const views = [];
function tree(id, title, note, paths, direction = 'LR') {
  const nodes = paths.map(p => ({ id: p, path: p, label: p === '.' ? 'ExpoTec/' : path.posix.basename(p) + (p.includes('.') && !definitions.has(p + '/x') ? '' : '/'), ...definitions.get(p) }));
  const edges = [];
  for (const n of nodes) {
    const parents = nodes.filter(p => p.id !== n.id && (p.id === '.' || n.path.startsWith(p.id + '/'))).sort((a,b) => b.path.length-a.path.length);
    if (parents.length) edges.push({ source: parents[0].id, target: n.id, label: '' });
  }
  views.push({ id, title, note, nodes, edges, direction });
}
tree('mapa-general', '01 · Estructura general', 'Las líneas significan «contiene». Las etiquetas indican qué se modifica y qué se genera.', ['.', 'frontend', 'frontend/native', 'frontend/web', 'backend', 'backend/src', 'backend/sql', 'backend/test', 'docs', 'docs/diagramas', 'docs/scripts', 'output', 'output/pdf', 'artifacts', 'artifacts/android', 'artifacts/qa-2026-10-26', '.impeccable', 'Claude outputs']);
tree('mapa-frontend', '02 · Web y Android', 'Todo lo mostrado pertenece a frontend/native. Shared* identifica las pantallas conectadas a la API; Account y AdminUsers también usan la API.', ['frontend/native', 'frontend/native/index.ts', 'frontend/native/src', 'frontend/native/src/main.tsx', 'frontend/native/src/app.tsx', 'frontend/native/src/pages', 'frontend/native/src/components', 'frontend/native/src/components/base', 'frontend/native/src/components/navigation', 'frontend/native/src/components/floorplan', 'frontend/native/src/contexts', 'frontend/native/src/hooks', 'frontend/native/src/lib', 'frontend/native/src/theme', 'frontend/native/assets', 'frontend/native/public', 'frontend/native/scripts', 'frontend/native/package.json', 'frontend/native/app.json']);
tree('mapa-backend', '03 · API y base de datos', 'La API está en backend. Las migraciones definen tablas; los datos reales viven en TiDB. Seleccioná una carpeta para ver archivos concretos.', ['backend', 'backend/src', 'backend/src/app.mjs', 'backend/src/server.mjs', 'backend/src/create-app.mjs', 'backend/src/config', 'backend/src/middleware', 'backend/src/routes', 'backend/src/validators', 'backend/src/services', 'backend/src/repositories', 'backend/src/docs', 'backend/src/lib', 'backend/sql', 'backend/scripts', 'backend/test', 'backend/package.json', 'backend/vercel.json']);
tree('mapa-documentacion', '05 · Documentos y soporte', 'Las fuentes de los manuales son Markdown. output/pdf contiene la entrega generada. Los informes de auditoría son evidencia de su fecha.', ['.', 'docs', 'docs/README.md', 'docs/MANUAL_USUARIO.md', 'docs/GUIA_INSTALACION.md', 'docs/DOCUMENTACION_API.md', 'docs/FUNCIONAMIENTO_COMPLETO.md', 'docs/DFD_Y_DER.md', 'docs/diagramas', 'docs/scripts', 'docs/capturas', 'docs/pruebas', 'output', 'output/pdf', '.impeccable', 'DESIGN.md', 'PRODUCT.md', 'AGENTS.md', 'README.md']);
const buildNodes = [
  ['native','frontend/native','frontend/native/'], ['webconfig','frontend/native/vercel.json','vercel.json · web'], ['dist','frontend/native/dist','frontend/native/dist/'],
  ['easconfig','frontend/native/eas.json','eas.json · Android'], ['appconfig','frontend/native/app.json','app.json · identidad'], ['apk','artifacts/android','artifacts/android/'],
  ['api','backend/src/app.mjs','backend/src/app.mjs'], ['sql','backend/sql','backend/sql/'], ['migrate','backend/scripts/migrate.mjs','scripts/migrate.mjs'],
  ['web','@web','Web en Vercel'], ['eas','@eas','Compilador EAS'], ['vercelapi','@api','API en Vercel'], ['tidb','@tidb','TiDB Cloud'], ['blob','@blob','Vercel Blob'],
].map(([id,p,label]) => ({id, path:p, label, ...definitions.get(p)}));
for (const [id,summary,note] of [['web','Web publicada desde frontend/native.','Sirve los archivos de dist. No publica frontend/web.'],['eas','Servicio remoto que compila Android.','Genera el proyecto Android y la APK a partir de Expo; no hay un directorio android fuente versionado.'],['vercelapi','API publicada de manera independiente.','Ejecuta la aplicación Express del backend y aplica sus permisos.'],['tidb','Base de datos remota compatible con MySQL.','Guarda los registros del sistema. No es una carpeta dentro del repositorio.'],['blob','Almacenamiento remoto de imágenes subidas.','Los archivos de usuarios no se guardan dentro de assets.']]) Object.assign(buildNodes.find(n=>n.id===id), {summary,note,status:'external'});
const buildEdges = [['native','dist','export:web'],['webconfig','dist','configura exportación'],['dist','web','publica'],['native','eas','envía código'],['easconfig','eas','perfil preview'],['appconfig','eas','versión y plugins'],['eas','apk','genera APK'],['api','vercelapi','despliega'],['sql','migrate','lee migraciones'],['migrate','tidb','aplica esquema'],['vercelapi','tidb','lee y escribe'],['vercelapi','blob','gestiona imágenes']].map(([source,target,label])=>({source,target,label}));
views.splice(3,0,{id:'mapa-compilacion',title:'04 · Código → web, API y APK',note:'En esta vista las flechas indican acciones. Morado = servicio remoto; gris = salida local generada.',direction:'LR',nodes:buildNodes,edges:buildEdges});

// Solo rutas de Git: no se recorre node_modules ni se leen valores privados.
const tracked = execFileSync('git', ['ls-files', '-z', '--', '.'], {cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
const products = ['docs/MAPA_DEL_CODIGO.md','docs/scripts/build_code_map.mjs','docs/scripts/code_map_viewer.html.in','docs/diagramas/mapa-codigo.html','docs/diagramas/mapa-codigo.json','docs/diagramas/Mapa-del-codigo-ExpoTec.drawio',...views.map(v=>`docs/diagramas/${v.id}.svg`)];
const files = [...new Set([...tracked,...products])].filter(p=> !/(^|\/)\.env(?:\.|$)/.test(p) || /\.example$/.test(p)).sort((a,b)=>a.localeCompare(b,'es'));
const all = new Map();
function addPath(p, type) { if (!all.has(p)) all.set(p,{path:p,type}); }
addPath('.', 'directory');
for (const p of files) { addPath(p,'file'); for(let parent=path.posix.dirname(p);parent!=='.';parent=path.posix.dirname(parent))addPath(parent,'directory'); }
for (const [p,definition] of definitions) if(!all.has(p)) {
  try { const stat=await fs.stat(path.join(root,p));addPath(p,stat.isDirectory()?'directory':'file'); }
  catch { if(!['generated','local','private'].includes(definition.status))throw new Error(`Ruta documentada inexistente: ${p}`);addPath(p,p.endsWith('.apk')||p==='backend/.env'?'file':'directory');all.get(p).optionalLocation=true; }
}
const domain = {auth:'cuentas y acceso',spaces:'espacios y planos',projects:'proyectos y revisiones',inventory:'inventario',loans:'préstamos y devoluciones',gallery:'galería de fotos',recovery:'recuperación de contraseña',uploads:'subidas de imágenes',social:'accesos sociales',presentation:'presentación pública'};
for (const record of all.values()) {
  const exact = definitions.get(record.path);
  const parentRole = [...definitions].filter(([p])=>record.path.startsWith(p+'/')).sort((a,b)=>b[0].length-a[0].length)[0]?.[1];
  Object.assign(record, { status:exact?.status ?? parentRole?.status ?? 'source', summary:exact?.summary ?? parentRole?.summary ?? 'Archivo de soporte del proyecto.', note:exact?.note ?? '', descriptionBasis:exact?'documented':'folder' });
  const name = path.posix.basename(record.path);
  if (!exact && record.type==='file') {
    if (/\.test\./.test(name)) { record.summary='Pruebas unitarias del módulo '+name.replace(/\.test\..+$/,'')+'.'; record.descriptionBasis='convention'; }
    else if (/\.integration\.mjs$/.test(name)) { record.summary='Prueba de integración con base para '+name.replace('.integration.mjs','')+'.';record.descriptionBasis='convention'; }
    else if (name==='package-lock.json') { record.summary='Versiones exactas del árbol de dependencias de npm.';record.descriptionBasis='convention'; }
    else if (/^\.env.*\.example$/.test(name)) { record.summary='Plantilla pública de variables de configuración, sin valores privados.';record.descriptionBasis='convention'; }
    else if (/^backend\/src\/(routes|validators|repositories)\//.test(record.path)) {
      const layer=record.path.split('/')[2], d=domain[name.replace('.mjs','')] ?? name.replace('.mjs','');
      record.summary=({routes:'Endpoints HTTP de ',validators:'Validación de solicitudes de ',repositories:'Persistencia y reglas de datos de '})[layer]+d+'.';record.descriptionBasis='convention';
    } else if (/^backend\/sql\//.test(record.path)) {record.summary='Migración SQL: '+name.replace(/^\d+_/,'').replace('.sql','').replaceAll('_',' ')+'.';record.descriptionBasis='convention';}
    else if (/\.(native|web)\.(tsx?|jsx?)$/.test(name)) {record.summary=`Implementación específica de ${name.includes('.native.')?'Android / plataforma nativa':'navegador'} para ${name.split('.')[0]}.`;record.descriptionBasis='convention';}
    else if (/^frontend\/native\/src\/pages\//.test(record.path)) {record.summary=`Pantalla ${name.replace('.tsx','')}; ${name.startsWith('Shared')||/^(Account|AdminUsers)/.test(name)?'interfaz conectada a la API':'recorrido de demostración local'}.`;record.descriptionBasis='convention';}
    else if (/\.d\.ts$/.test(name)) {record.summary='Declaraciones de tipos de TypeScript para '+name.replace('.d.ts','')+'.';record.descriptionBasis='convention';}
  }
  record.children=[...all.values()].filter(c=>c.path!==record.path&&path.posix.dirname(c.path)===record.path).map(c=>c.path).sort((a,b)=>(all.get(a).type===all.get(b).type?0:all.get(a).type==='directory'?-1:1)||a.localeCompare(b,'es'));
}
for(const record of all.values())record.fileCount=record.type==='directory'&&!['generated','local'].includes(record.status)?[...all.values()].filter(f=>f.type==='file'&&f.status!=='private'&&(record.path==='.'||f.path.startsWith(record.path+'/'))).length:undefined;
for (const v of views) for(const n of v.nodes) if(!n.path.startsWith('@')) {
  const entry=all.get(n.path); if(!entry)throw new Error(`Nodo sin inventario: ${n.path}`);
  n.label=(n.id==='.'?'ExpoTec':(v.id==='mapa-compilacion'?n.label.replace(/\/$/,''):path.posix.basename(n.path)))+(entry.type==='directory'?'/':'');
}
const wrap=(text,limit=34)=>{const lines=[''];for(const word of text.split(/\s+/)){if((lines.at(-1)+' '+word).length>limit&&lines.at(-1))lines.push(word);else lines[lines.length-1]+=(lines.at(-1)?' ':'')+word;}return lines;};
function graph(v) {
  return `digraph G { graph [rankdir=${v.direction} bgcolor="transparent" nodesep=0.20 ranksep=0.60 pad=0.25 splines=${v.id==='mapa-compilacion'?'polyline':'ortho'} ordering=out]; node [shape=box style="rounded,filled" fontname="Arial" margin="0.15,0.12" penwidth=1.1]; edge [color="#8a9aaa" arrowsize=0.55 fontname="Arial" fontsize=11];\n`+
  v.nodes.map((n,i)=>{const [fill,stroke]=palette[n.status??'source'];const lines=wrap(n.summary,v.direction==='TB'?29:35);return `${q(n.id)} [id="mapnode${i}" fillcolor=${q(fill)} color=${q(stroke)} label=<<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="1"><TR><TD ALIGN="LEFT"><FONT POINT-SIZE="13"><B>${esc(n.label)}</B></FONT></TD></TR>${lines.map(l=>`<TR><TD ALIGN="LEFT"><FONT POINT-SIZE="11">${esc(l)}</FONT></TD></TR>`).join('')}</TABLE>>];`;}).join('\n')+'\n'+
  v.edges.map((e,i)=>`${q(e.source)} -> ${q(e.target)} [id="edge-${i}" ${e.label?`label=${q(e.label)}`:'arrowhead=none'}];`).join('\n')+'\n}';
}
const diagrams=[];
for (const v of views) {
  const dot=graph(v), rendered=viz.render(dot,{format:'svg'});
  if(rendered.status!=='success')throw new Error(JSON.stringify(rendered.errors));
  let svg=rendered.output.replace(/<\?xml[^>]*\?>\s*/,'').replace(/<!DOCTYPE[\s\S]*?>\s*/,'');
  svg=svg.replace('<svg ',`<svg role="group" aria-label="${esc(v.title)}" `).replace(/<g id="mapnode(\d+)" class="node">/g,(_m,i)=>`<g id="mapnode${i}" class="node" data-path="${esc(v.nodes[i].path)}" tabindex="0" role="button" aria-label="Ver ${esc(v.nodes[i].path)}">`);
  await fs.writeFile(path.join(out,v.id+'.svg'),svg);
  const layout=viz.renderJSON(dot), box=layout.bb.split(',').map(Number), H=box[3], cells=['<mxCell id="0"/>','<mxCell id="1" parent="0"/>'];
  for(const n of v.nodes){
    const p=layout.objects.find(o=>o.name===n.id),[cx,cy]=p.pos.split(',').map(Number),w=Number(p.width)*72,h=Number(p.height)*72,[fill,stroke]=palette[n.status??'source'];
    const label=`<b>${esc(n.label)}</b><br>${esc(n.summary)}`;
    cells.push(`<mxCell id="${esc(n.id)}" value="${esc(label)}" data-source="${esc(n.path)}" style="rounded=1;whiteSpace=wrap;html=1;align=left;spacing=10;fontSize=12;fontFamily=Arial;fillColor=${fill};strokeColor=${stroke};" vertex="1" parent="1"><mxGeometry x="${(cx-w/2).toFixed(2)}" y="${(H-cy-h/2).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" as="geometry"/></mxCell>`);
  }
  for(const [i,e] of v.edges.entries()) {
    const item=layout.edges.find(item=>item.id===`edge-${i}`), pts=(item._draw_??[]).filter(op=>op.op==='b'||op.op==='L').flatMap(op=>op.points), waypoints=pts.filter((p,j)=>j>0&&j<pts.length-1&&(j===1||p[0]!==pts[j-1][0]||p[1]!==pts[j-1][1])).map(([x,y])=>`<mxPoint x="${x}" y="${H-y}"/>`).join('');
    const port=(id,point,prefix)=>{const n=layout.objects.find(o=>o.name===id),[x,y]=n.pos.split(',').map(Number),w=Number(n.width)*72,h=Number(n.height)*72;return `${prefix}X=${Math.min(1,Math.max(0,(point[0]-x+w/2)/w)).toFixed(6)};${prefix}Y=${Math.min(1,Math.max(0,(y+h/2-point[1])/h)).toFixed(6)};${prefix}Perimeter=0;`;};
    cells.push(`<mxCell id="edge-${i}" value="${esc(e.label)}" source="${esc(e.source)}" target="${esc(e.target)}" edge="1" parent="1" style="edgeStyle=none;html=1;fontSize=10;labelBackgroundColor=#ffffff;strokeColor=#8a9aaa;endArrow=${e.label?'block':'none'};${port(e.source,pts[0],'exit')}${port(e.target,pts.at(-1),'entry')}"><mxGeometry relative="1" as="geometry"><Array as="points">${waypoints}</Array></mxGeometry></mxCell>`);
  }
  diagrams.push(`<diagram id="${v.id}" name="${esc(v.title)}"><mxGraphModel grid="0" page="0"><root>${cells.join('')}</root></mxGraphModel></diagram>`);
  v.svg=svg;
}
const model={title:'Mapa del código de ExpoTec',scope:'Rutas del proyecto ExpoTec dentro de PDelSC; inventario versionado más ubicaciones locales documentadas. No contiene valores privados.',catalog:[...all.values()].sort((a,b)=>a.path.localeCompare(b.path,'es')),views:views.map(({svg,...v})=>v),external:buildNodes.filter(n=>n.path.startsWith('@'))};
await fs.writeFile(path.join(out,'Mapa-del-codigo-ExpoTec.drawio'),`<?xml version="1.0" encoding="UTF-8"?><mxfile host="drawio">${diagrams.join('')}</mxfile>`);
await fs.writeFile(path.join(out,'mapa-codigo.json'),JSON.stringify(model,null,2)+'\n');
const template=await fs.readFile(path.join(root,'docs/scripts/code_map_viewer.html.in'),'utf8');
const payload=JSON.stringify({...model,views}).replaceAll('<','\\u003c');
await fs.writeFile(path.join(out,'mapa-codigo.html'),template.replace('/*__CODE_MAP__*/',payload));
console.log(`Mapa generado: ${files.length} archivos versionados/entregables, ${all.size} entradas, ${views.length} vistas, ${views.reduce((n,v)=>n+v.nodes.length,0)} nodos.`);
