# ExpoTec

Prototipo de organización escolar migrado a **React Native con Expo SDK 57**. El código activo está en `frontend/native`; la versión anterior de Vite queda en `frontend/web` como referencia. La generación del APK quedó para una etapa posterior, como indicó el usuario.

La aplicación abre **Espacios compartidos**, con planos y puestos guardados en TiDB y consulta pública. **Ver proyectos** permite presentar propuestas, vincular equipos con cuentas reales y revisarlas; los proyectos confirmados aparecen en el puesto y en la muestra pública. Solo los administradores reales pueden crear espacios, guardar su distribución y darlos de baja. **Mi cuenta** permite registrarse como alumno, ingresar, consultar los permisos del servidor y cerrar sesión. La demostración conserva aparte sus proyectos, espacios, inventario y préstamos ficticios, locales a cada dispositivo.

La [web pública](https://expotec-web-gn19.vercel.app) ya está en Vercel. La API está publicada por separado en `https://expotec-api-gn19.vercel.app` y conectada a TiDB. Los pasos para probarla y actualizar los despliegues están en [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).

## Instalar y abrir

Requisitos: Node.js 24.3 o posterior y npm.

```powershell
cd "frontend/native"
npm install
npx expo start
```

`npm start` ejecuta el mismo comando, porque el script `start` de `package.json` es `expo start`.

Escanear el QR con Expo Go compatible con SDK 57 en Android. El teléfono y la computadora deben poder comunicarse por la misma red. Para un emulador ya configurado, usar `npm run android`.

Para revisar las mismas pantallas en el navegador:

```powershell
npm run web
```

La dirección y el QR aparecen en la terminal. No abrir `index.html` directamente. El puerto puede indicarse con `npm start -- --port 8082`.

## Comprobar

```powershell
npm run typecheck
npm run lint
npm test
npm run export:android
npm run export:web
```

La exportación Android comprueba el empaquetado JavaScript y los recursos; no genera ni prueba un APK. Para abrir la exportación web:

```powershell
$env:PORT = "5173"
npm run preview
```

La configuración de `eas.json` incluye el perfil `preview` para un APK futuro. Su generación e instalación se realizarán después; requieren preparar EAS y probar en Android.

## Presentación TV compartida

**Presentación TV** se abre desde los espacios o proyectos compartidos, sin iniciar sesión. Carga los proyectos confirmados y muestra su descripción, equipo, profesores, materias y ubicación. **Iniciar presentación** comienza la secuencia; **Pausar**, **Anterior** y **Siguiente** permiten manejarla. Las fichas duran 8 segundos por defecto, con opciones de 15 y 30; los videos avanzan al terminar. La secuencia vuelve al primer proyecto al completarse.

Los videos empiezan sin sonido; **Activar sonido** lo habilita. Si el navegador bloquea la reproducción, la pantalla permite continuar sin sonido. Un video con error o 30 segundos sin avanzar se reemplaza por su ficha y ofrece **Reintentar video**. Una imagen no disponible conserva los textos del proyecto. Al ocultar la página o salir, la reproducción se pausa.

**Pantalla completa** está disponible cuando el navegador la admite, requiere pulsar el botón y permite salir también con Escape. **Ver ficha completa del proyecto** abre la consulta pública y pausa la presentación. En pantallas anchas se resume visualmente la descripción larga; la ficha completa conserva todo el texto.

La muestra se consulta cada minuto y al volver a la pantalla. Los proyectos reabiertos o cancelados salen en la siguiente actualización correcta. **Actualizar muestra** permite comprobarlos en el momento. Se cargan todas las páginas antes de reemplazar la secuencia, conservando el proyecto actual si sigue publicado. Ante un fallo se pausa y oculta la secuencia; al recuperar los datos hay que volver a iniciarla. No se usan proyectos ficticios de la demostración.

El [diagrama editable del sistema](docs/diagramas/sistema-expotec.drawio) tiene cuatro páginas: arquitectura, aprobación de proyectos, préstamos y presentación. Sus [imágenes y guía](docs/diagramas/README.md) permiten consultarlo sin un editor.

## Demostración local

- Mapa de aulas y patio, con consulta del proyecto que ocupa cada mesa.
- Organización: crear, modificar y eliminar espacios sin referencias; agregar mesas, bancos, puntos eléctricos y etiquetas; arrastrar, girar y cambiar el tamaño de las mesas con tiradores. Guardar o cancelar la edición.
- Estudiante de ejemplo: presentar y editar propuestas con varios integrantes, imagen, profesores, materias, mesa y recursos. Video opcional.
- Proyectos informáticos: enlaces opcionales al repositorio de GitHub y a la página del proyecto, validados mientras se escriben.
- Profesor asignado: confirmar o solicitar cambios. La confirmación comprueba mesa y stock y ocupa el lugar automáticamente.
- Inventario: alta, modificación y eliminación con protección de reservas, préstamos e historial.
- Préstamos: entrega y devolución parcial o completa en cada una de las tres jornadas. Un elemento no devuelto continúa prestado al cambiar de día.
- Invitado: muestra pública de los proyectos confirmados, sin edición.
- Presentación en TV: avance automático de fichas, reproducción de videos y paso al siguiente cuando terminan.
- Temas claro y oscuro separados, navegación adaptable, retroceso nativo, validación inmediata y confirmaciones dentro de la interfaz.

La interfaz usa tarjetas y controles compactos. En el editor, seleccioná cualquier mueble, escribí su **Giro en grados** (0–360) y pulsá **Aplicar giro**; también hay ajustes de ±15°. Después pulsá **Guardar plano** para conservar la distribución. El giro se guarda grado a grado; 360° equivale a 0°.

## Guía breve de uso

**Espacios compartidos** es la entrada de la aplicación. Al principio puede estar vacío: la organización debe cargar la distribución real. **Actualizar espacios** consulta el servidor. Los invitados y alumnos pueden ver los planos sin editarlos. Un administrador puede crear un espacio, abrir **Acomodar espacio**, agregar y mover mobiliario y guardar el plano para todos los dispositivos. Cada mesa se agrega como mobiliario; seleccionarla y marcar **Habilitar esta mesa como puesto para proyectos** la convierte en un puesto inscribible. Los alumnos pueden solicitar esos puestos desde **Ver proyectos → Presentar proyecto**; el puesto se ocupa cuando un profesor responsable confirma la propuesta.

Si otro administrador guardó cambios, se avisa del conflicto y se conserva el borrador en pantalla. **Descartar borrador y recargar** pide confirmación antes de reemplazarlo por la versión del servidor. **Dar de baja espacio** también requiere confirmación, lo retira de la consulta pública y conserva sus registros. Los tamaños y posiciones del plano son relativos, sin dimensiones físicas certificadas. Las cuentas nuevas no pueden concederse permisos de administración; la escuela los asigna mediante el procedimiento del backend.

**Proyectos de ExpoTec** ofrece la muestra pública y **Mis proyectos y revisiones** (o **Gestionar proyectos** para administración). Para presentar, ingresar como alumno, completar nombre, descripción, curso, enlace HTTPS de imagen, materias y puesto, y agregar integrantes y profesores mediante el correo exacto de sus cuentas registradas. El creador y quien edita permanecen incluidos. El equipo admite hasta 12 alumnos y 5 profesores responsables. Video directo MP4/WebM y enlaces de GitHub y web para proyectos informáticos son opcionales. Todavía no hay carga de archivos: se guardan enlaces a contenido ya alojado.

Un profesor asignado puede pedir cambios con un motivo o confirmar la propuesta. El equipo corrige y reenvía; el historial se conserva. Solicitar no reserva: pueden existir varias propuestas para un puesto, pero una sola confirmación lo ocupa. El plano distingue puestos disponibles y confirmados y permite abrir su ficha pública. Las fichas públicas muestran nombres del equipo y profesores, sin correos ni identificadores de cuentas. Administración puede reabrir una confirmación o cancelar conservando el historial. El plano protege puestos con proyectos vigentes frente a su retiro o baja del espacio.

Si otra persona modificó el proyecto o confirmó el puesto, se informa el conflicto y se conserva el borrador en pantalla. **Actualizar puestos** consulta la disponibilidad sin borrar los datos escritos. El borrador no persiste al cerrar la aplicación y salir sin enviarlo pide confirmación. Los pedidos de recursos se eligen del catálogo compartido. La confirmación reserva todos los elementos y el puesto en una transacción; un faltante conserva la propuesta pendiente y no guarda reservas parciales.

**Inventario compartido** se abre desde **Mi cuenta** o **Ver proyectos** con permisos de administración o préstamos. Administración crea elementos, modifica nombre, descripción y unidades totales, y da de baja con confirmación. **Ver historial** muestra las modificaciones de existencias y su autor. **Dados de baja** conserva la consulta histórica. Un cambio simultáneo conserva el borrador y ofrece **Descartar y recargar elemento**. El encargado de préstamos tiene consulta sin edición.

En la propuesta, **Elementos solicitados** permite buscar elementos, agregarlos, indicar cantidades de 1 a 10000 y quitarlos con confirmación. Es opcional y admite hasta 50 tipos distintos. **Actualizar elementos** vuelve a consultar la disponibilidad sin borrar el pedido. Mientras el proyecto esté pendiente no se reserva stock. Un profesor confirma elementos y mesa juntos; si faltan unidades no se asigna nada. Los ajustes protegen las reservas y los préstamos abiertos; las unidades fuera de servicio se actualizan con motivo. No se puede dar de baja un elemento solicitado por un proyecto vigente. Reabrir o cancelar libera reservas conservando pedidos e historial, una vez devueltos todos los elementos.

**Préstamos y devoluciones** se abre desde **Mi cuenta**, proyectos o inventario con permisos reales de préstamos o administración. **Nueva entrega** permite elegir jornada 1–3, proyecto confirmado, elemento reservado, integrante activo que retira y cantidad. **Revisar entrega** muestra una confirmación antes de guardar. Se admite una entrega por proyecto, elemento y jornada; las unidades pendientes de cualquier día limitan las nuevas entregas. No se inventan fechas de exposición: cada movimiento guarda la fecha y hora reales.

**Devolver** admite devoluciones parciales o completas, con el detalle de las unidades dañadas. **Registrar novedad** conserva una observación sin devolver unidades. Novedades y daños requieren al menos 10 caracteres de explicación. Los daños apartan unidades del stock y quedan en ambos historiales; administración puede habilitarlas nuevamente después de revisarlas, indicando el motivo. Un conflicto conserva el borrador y permite **Descartar y actualizar préstamo** con confirmación. No se editan ni borran entregas o devoluciones históricas.

La vista inicial reúne **Pendientes de todas las jornadas**. También se pueden consultar las entregas de la jornada elegida o todo el historial, buscar entre los registros cargados y cargar más. Cada préstamo muestra quién entrega, quién retira, cantidades y fecha; sus movimientos muestran quién recibe y las últimas 100 devoluciones y novedades. Cambiar de jornada conserva los pendientes. Un proyecto con unidades sin devolver no se puede editar, reabrir ni cancelar.

Los elementos son cantidades de unidades equivalentes, separadas del mobiliario del plano. La disponibilidad para reservar descuenta reservas y unidades fuera de servicio; la disponibilidad física para entregar descuenta unidades fuera de servicio y préstamos abiertos de todas las jornadas. Un daño puede dejar reservas sin cobertura: se informa el faltante y se protege el stock restante. Las devoluciones completas conservan la reserva para el próximo día. No se calcula ni certifica capacidad eléctrica.

**Mi cuenta** abre el acceso real. El registro pide nombre, apellido, correo y contraseña de 12–128 caracteres, con repetición para comprobarla. Las nuevas cuentas reciben únicamente el permiso de alumno. La ficha muestra los permisos actuales y permite actualizarlos o cerrar sesión con confirmación. Si falla la conexión, se puede reintentar sin eliminar la sesión guardada. La recuperación de contraseña y los proveedores sociales siguen pendientes.

La sesión se conserva con Expo SecureStore en Android y con una cookie HttpOnly, Secure y SameSite=Strict en la web de producción. El token de acceso vive en memoria. La web utiliza `/api` a través de Vercel para mantener la cookie en su propio origen; no guarda tokens en AsyncStorage ni localStorage.

**Cambiar vista → Probar vista como** permite cambiar entre perfiles ficticios. Es una herramienta de demostración independiente de la cuenta real. El estudiante de ejemplo es Lucía Fernández; el profesor es Martín García. Los cambios en proyectos, espacios, inventario y préstamos continúan guardándose solo en este dispositivo.

Las siguientes instrucciones corresponden a la **demostración con datos de ejemplo**. En **Espacios → Acomodar espacio**, mantener una pieza de la paleta (Mesa, Banco, Toma o Zona) y arrastrarla al plano. Se crea únicamente al soltarla dentro; tocarla o soltarla fuera no agrega elementos. Seleccionar un objeto existente y arrastrarlo lo mueve; los tiradores achican o agrandan las mesas. **Girar** cambia su orientación. Arrastrar **Zona** agrega una etiqueta cuyo texto se edita en el inspector. **Guardar plano** conserva los cambios; **Cancelar** descarta el borrador. La eliminación requiere confirmación dentro del editor. Con teclado, Enter o Espacio sobre una pieza de la paleta la coloca en el centro; los lectores de pantalla ofrecen la misma acción. Escape cancela un gesto activo. Los campos de texto continúan editables y seleccionables.

En **Proyectos → Presentar proyecto**, completar los campos rotulados. **Agregar integrante** añade compañeros; quitar uno pide confirmación. El creador y el alumno que edita permanecen incluidos. Al marcar **Proyecto informático**, aparecen GitHub y página; son opcionales. Desmarcar con enlaces cargados solicita confirmación antes de quitarlos.

El profesor revisa su propuesta desde **Ver proyecto**. Una confirmación reserva mesa y elementos; una devolución indica qué debe corregir el equipo. Organización puede reabrir una propuesta cuando no hay préstamos pendientes.

En **Préstamos**, elegir la jornada y entregar elementos a los proyectos confirmados. Registrar devoluciones en la tarjeta de cada entrega, indicando la cantidad; se conserva el saldo pendiente.

## Datos y migración

El esquema local conserva equipos, mesas, tamaños, etiquetas, recursos, revisiones y préstamos del prototipo anterior. Los proyectos antiguos sin equipo se convierten en equipos de un integrante. El almacenamiento utiliza la misma clave `expotec-design-v1`. En la vista web, los datos anteriores se conservan al abrir desde el mismo origen (por ejemplo `http://127.0.0.1:5173`). Otra dirección o puerto tiene almacenamiento independiente.

Cada teléfono guarda sus propios datos en un archivo local con respaldo, para que las fotos no excedan el límite por registro de AsyncStorage. AsyncStorage conserva la preferencia del tema y los datos de la vista web. Los datos de una computadora no se transfieren automáticamente al teléfono. Si la lectura de datos guardados falla, la app muestra un aviso y evita sobrescribirlos. Esta persistencia corresponde únicamente a la demostración; los espacios y proyectos compartidos ya utilizan la API y TiDB.

No ingresar información privada ni usar la demostración para organizar la exposición real. Los puntos eléctricos son referencias de ejemplo: no calculan cargas ni certifican la seguridad de la instalación.

## Estructura

```text
frontend/native/
  index.ts             Entrada Expo
  app.json             Configuración SDK y permisos
  eas.json             Perfiles para compilaciones futuras
  src/
    main.tsx           Registro de la aplicación
    app.tsx            Navegación y composición
    components/        Controles, plano y formularios modulares
    pages/             Espacios, proyectos, inventario, préstamos y muestra
    contexts/          Datos locales y tema
    hooks/             Acceso al estado compartido
    lib/               Tipos, reglas, validaciones y pruebas
    theme/             Paletas claras y oscuras independientes
frontend/web/          Prototipo anterior, conservado como referencia
backend/               API Express, cuentas, sesiones, permisos y SQL para TiDB
```

## Backend y despliegue — hito 7A

Por decisión del 14/10/2026, la base se aloja en **TiDB** y hay **dos proyectos en Vercel**: `expotec-web` para `frontend/native` (exportación web de Expo) y `expotec-api` para `backend` (Express). Android utilizará la misma API. TiDB tiene `expotec`, sus migraciones y un usuario limitado de aplicación. Ambos proyectos están publicados; la API confirma su conexión a la base y acepta el origen de la web.

El backend incluye registro como alumno, ingreso con correo y contraseña, JWT de acceso, renovación rotativa, revocación y cierre de sesión. Comprueba los permisos en la base y permite a un administrador asignar responsabilidades sin que una cuenta nueva pueda concedérselas. El SQL normaliza usuarios, roles y sesiones, y las migraciones tienen un registro de aplicación.

Para preparar el backend:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Esos pasos corresponden a una instalación nueva: no reemplazar el `.env` existente de esta computadora. Para crear otra base, seguir la guía de `.env.setup` y `db:setup` en backend/README.md. `npm test` comprueba la API localmente con almacenamiento controlado; las 18 pruebas pasaron. `npm run test:database` requiere una base vacía exclusiva de pruebas y comprueba SQL y concurrencia reales; pasó contra TiDB el 14/10/2026 en `expotec_test_01`. También se comprobaron los endpoints públicos de salud, conexión, sesión sin token y CORS desde Vercel.

La [documentación de la API](backend/README.md) detalla todos los métodos, rutas, permisos, cuerpos, respuestas y errores. Las consultas usan POST mientras se confirma la restricción sobre GET de la consigna. La [guía de TiDB y Vercel](docs/DESPLIEGUE.md) explica raíces de los dos proyectos, variables y orden de configuración. Las credenciales de base y `JWT_SECRET` se guardan exclusivamente en el backend.

El hito **7B: acceso desde la aplicación**, implementado el 19/10/2026, incorpora las pantallas y la persistencia de sesión. El hito **7C: espacios compartidos** añade las tablas relacionales de espacios, mobiliario y puestos, con edición atómica, control de versiones y baja sin borrado. Los perfiles ficticios se mantienen exclusivamente para la demostración local. El hito **7D: proyectos compartidos** conecta equipos, materias, profesores, revisiones, confirmación transaccional y consulta pública. El hito **7E: inventario y reservas** incorpora existencias, pedidos y reservas transaccionales. El hito **7F: préstamos y devoluciones** conecta entregas por jornada, devoluciones parciales, novedades y unidades fuera de servicio. El hito **7G: presentación TV compartida** reproduce los proyectos confirmados del servidor, con fichas, videos, controles y pantalla completa.

En desarrollo web, copiar `frontend/native/.env.example` a `.env.local` únicamente si no existe y configurar `EXPO_PUBLIC_API_URL=http://localhost:3001`. Abrir Expo Web con `localhost` y autorizar su origen y puerto exactos en `CORS_ORIGINS` del backend. Reiniciar Expo tras modificar variables. En Android sin variable se usa la API pública; para el emulador con API local usar `http://10.0.2.2:3001`. Nunca colocar credenciales de base ni secretos en variables `EXPO_PUBLIC_`.

Para probar una exportación local, iniciar el backend y ejecutar `npm run preview`: su servidor reenvía `/api` al puerto 3001. `API_PROXY_URL` permite cambiar ese destino. La vista previa y la API deben usar un origen incluido en `CORS_ORIGINS`.

## Usuarios y permisos — hito 7H

Desde **Mi cuenta → Usuarios y permisos**, administración busca cuentas por nombre o correo y carga más resultados. **Editar permisos** permite combinar alumno, profesor, préstamos y administrador. **Revisar cambios** muestra la cuenta y los permisos elegidos antes de confirmar. El servidor protege al último administrador y rechaza una edición si cambiaron los permisos mientras se preparaba. Ante conflicto, se conserva la selección y se puede **Descartar selección y recargar cuenta**, con confirmación. Los cambios rigen en la próxima operación de la cuenta con el servidor. Invitados y cuentas sin administración no pueden consultar este listado.

Este hito no necesita nuevas variables ni migraciones. `npm run test:users`, en backend, comprueba la integración sobre una base exclusiva de pruebas. Recuperación, archivos y accesos sociales continúan pendientes de sus servicios externos.

## Entrega final pendiente

Almacenamiento de archivos, tres proveedores sociales, recuperación de contraseña, pruebas completas contra los servicios reales, manual final en APA y APK probado. Por indicación del usuario, Android se retoma al final. El alcance está en [docs/REQUISITOS.md](docs/REQUISITOS.md).

Las fechas, el plano real, el relevamiento eléctrico, los proveedores externos y el almacenamiento de videos requieren definición antes de reemplazar los ejemplos. El prototipo usa enlaces directos MP4/WebM; su reproducción final depende del formato compatible con cada dispositivo.

[PRODUCT.md](PRODUCT.md) documenta el producto y [DESIGN.md](DESIGN.md) sus decisiones visuales. El repositorio Git está en la carpeta superior `PDelSC`; las credenciales se excluyen mediante el `.gitignore` de ExpoTec.

La conservación de datos y las comprobaciones de esta migración están en [docs/MIGRACION_EXPO.md](docs/MIGRACION_EXPO.md).

