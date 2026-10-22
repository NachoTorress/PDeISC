# ExpoTec — requisitos y alcance

Fecha de registro: 13/10/2026.

Este documento registra la consigna. No afirma que las funciones ya estén implementadas. El desarrollo se realizará por etapas, revisando cada una con el usuario.

## Propósito

Organizar los proyectos, los espacios y los recursos de una ExpoTec de tres días en una escuela técnica. Evitar superposiciones de puestos y mantener un registro de los préstamos y las devoluciones de cada jornada.

## Perfiles y permisos

| Perfil | Acciones |
| --- | --- |
| Invitado, sin iniciar sesión | Consultar proyectos confirmados, su ubicación, materias, profesores e imágenes; acceder a la presentación pública. |
| Invitado con cuenta (hito 7I) | Enviar fotos por enlace a la galería y consultar el estado de sus aportes. Sin permisos de alumno, revisión de proyectos, préstamos ni administración. |
| Alumno | Registrarse, ingresar, recuperar su contraseña y crear, consultar, modificar y eliminar sus proyectos dentro de los estados permitidos. Elegir un puesto disponible, profesores, materias y recursos; adjuntar imagen y video opcional. |
| Profesor responsable | Revisar los proyectos que lo incluyan como responsable, confirmar el lugar y los recursos solicitados o pedir correcciones. |
| Encargado de préstamos | Registrar las entregas, devoluciones y novedades de los elementos durante cada uno de los tres días. |
| Administrador | Gestionar usuarios y permisos, espacios, disposición de mobiliario, puestos, inventario y configuración de la exposición. |

Los permisos se verificarán también en el servidor. Los alumnos no podrán autoconcederse perfiles de profesor, encargado ni administrador.

Decisión pendiente: confirmar si profesor y encargado son perfiles separados o permisos que puede acumular la misma cuenta. La propuesta conserva un permiso específico para préstamos aunque una persona tenga más de una responsabilidad.

## Proyecto y aprobación

1. El alumno crea el proyecto con nombre, descripción, integrantes del equipo, imagen de referencia, profesores responsables, materias, puesto y recursos necesarios. El video es opcional. Si es un proyecto informático, puede agregar un enlace de GitHub y un enlace a su página; ambos son opcionales y se validan mientras se ingresan.
2. El proyecto queda pendiente de revisión. Solicitar un puesto no equivale a confirmarlo.
3. Uno de los profesores asignados revisa la solicitud completa.
4. La confirmación verifica y asigna el puesto y los recursos en una misma transacción. Dos aprobaciones simultáneas no pueden ocupar el mismo puesto ni asignar más recursos de los disponibles.
5. El puesto ocupado permite abrir la ficha del proyecto y conocer su ubicación.
6. Si se piden cambios, el alumno ve el motivo, corrige y vuelve a enviar.

Estados implementados en 7D: pendiente, requiere cambios, confirmado y cancelado. El borrador existe en memoria del formulario, sin guardado en el servidor.

Los proyectos confirmados no podrán modificar silenciosamente su ubicación o recursos. Reabrir o cancelar deberá liberar o recalcular sus asignaciones, conservando el historial de préstamos.

Cada proyecto admite varios integrantes. El alumno que presenta la propuesta queda incluido; los integrantes pueden editar una propuesta antes de su confirmación. Desde el hito 7D se vinculan con cuentas de alumnos mediante una tabla de relación y un alumno puede integrar varios proyectos. La demostración conserva sus participantes ficticios por nombre y apellido.

## Espacios y editor de distribución

- Crear, consultar, modificar y eliminar espacios que representen aulas, patio u otros sectores reales de la escuela.
- Definir dimensiones y distribuir mesas, bancos y otros elementos mediante arrastrar y soltar.
- En una pantalla táctil, permitir mantener presionado para mover un elemento, sin impedir el desplazamiento normal de la página.
- Ofrecer una alternativa accesible: seleccionar un elemento y moverlo con controles o teclado.
- Guardar posición, orientación, dimensiones y tipo de cada elemento.
- Distinguir el mobiliario físico de un puesto inscribible y de los recursos que se prestan.
- Permitir seleccionar un puesto para consultar su estado y su proyecto confirmado.
- Mostrar claramente disponibilidad, solicitud pendiente y ocupación; no usar solo el color para diferenciarlas.
- Proteger la distribución frente a cambios que invaliden proyectos confirmados, préstamos abiertos o referencias existentes.
- Confirmar las eliminaciones dentro del elemento o su ficha antes de ejecutarlas.

Pendiente: plano real, dimensiones, mobiliario inicial, cantidad de puestos y reglas para circulación. Los datos de ejemplo se identificarán como tales.

## Inventario, préstamos y devoluciones

- Gestionar recursos como zapatillas eléctricas, alargues, mesas, bancos y demás elementos necesarios.
- Registrar existencias, estado y disponibilidad. Diferenciar unidades identificables de cantidades de elementos equivalentes.
- Registrar el proyecto destinatario, responsable de entrega, fecha, jornada y cantidades entregadas.
- Registrar devoluciones, responsable receptor, cantidad recibida y novedades: faltante, daño o devolución parcial.
- Mantener separados la asignación al proyecto y el préstamo físico. La devolución al final del día no cancela automáticamente la asignación para la siguiente jornada.
- Calcular la disponibilidad de cada jornada y conservar las entregas y devoluciones de los tres días.
- Evitar entregas duplicadas, cantidades negativas, devoluciones superiores a lo entregado y eliminación de historial necesario para rendir los elementos.
- Dar de baja recursos con historial en vez de borrar sus registros históricos.

Pendiente: fechas de la exposición y política sobre quién retira, entrega y recibe los elementos.

## Instalación eléctrica

El sistema debe permitir registrar puntos de alimentación y advertencias relacionadas con la distribución eléctrica. La interfaz no debe presentar una ubicación ni una asignación de zapatillas como garantía de seguridad.

La validación de una instalación requiere datos y criterios definidos por personal habilitado. No se inventarán límites de carga, potencias permitidas ni reglas de conexión.

Pendiente: relevamiento real de circuitos, capacidades, equipos y procedimiento de aprobación de la escuela. Una futura comprobación de carga solo podrá desarrollarse con esos datos y requisitos confirmados.

## Modo invitados y presentación para televisión

- Acceso sin cuenta, con proyectos confirmados y navegación por espacios o proyectos.
- No exponer correos, fecha de nacimiento, tokens ni otra información privada de las cuentas.
- Generar una secuencia de presentación a partir de los proyectos confirmados.
- Reproducir los videos y mostrar una diapositiva del proyecto cuando no tenga video.
- Permitir comenzar, pausar, avanzar, retroceder y activar pantalla completa.
- Mostrar un estado recuperable cuando un video no esté disponible o no pueda reproducirse.
- Respetar las restricciones de reproducción automática del navegador: el inicio con sonido puede necesitar una acción del usuario.

En 7G se usan enlaces HTTPS directos a MP4/WebM, orden estable por identificador y fichas de 8 segundos por defecto (también 15 o 30). Los videos mantienen enlaces directos. Desde el 22/10/2026 se incorpora carga de fotos a almacenamiento privado de Vercel Blob. Un enlace de una plataforma externa no equivale a un archivo reproducible directamente.

## Autenticación y seguridad

- Registro, inicio de sesión y recuperación de contraseña.
- Acceso mediante tres proveedores sociales reales: Google, Discord y GitHub, confirmados por el usuario el 20/10/2026.
- Decisión del usuario del 20/10/2026, pendiente de implementación: si el correo se registra por primera vez mediante un proveedor social, solicitar también una contraseña propia de ExpoTec para completar el alta. La misma cuenta permitirá ingresar con el proveedor o con correo y contraseña, compartiendo identidad, permisos y datos; no crear cuentas duplicadas. Guardar únicamente el hash de la contraseña, nunca el texto original; no solicitar la contraseña de Google, Discord ni GitHub.
- La vinculación de proveedores a una cuenta existente debe comprobar la titularidad de la cuenta; no unir cuentas automáticamente por un correo sin verificar. Si el proveedor no entrega un correo verificado, verificarlo antes de completar el alta o la vinculación.
- Tokens JWT de acceso y renovación, expiración, revocación y cierre de sesión.
- Persistencia segura de la sesión al cerrar y volver a abrir la aplicación.
- Contraseñas con hash adaptativo; nunca guardarlas ni registrarlas en texto plano.
- Protección de endpoints según permisos y pertenencia del proyecto.
- Validación en servidor de todos los datos recibidos, además de las validaciones de la interfaz.
- Configuración mediante variables de entorno, sin secretos en el repositorio.
- Confirmación visual para cerrar sesión, sin usar `alert` ni `confirm` del navegador.

Los accesos sociales requieren aplicaciones y credenciales de los proveedores. La recuperación por correo se enviará desde el correo personal del usuario, por decisión del 21/10/2026. Su configuración queda postergada; no se habilitará ni se considerará terminada hasta configurar y comprobar el envío real. No guardar credenciales de correo en el repositorio.

## Galería de la experiencia — hito 7I implementado

Pedido del usuario del 21/10/2026: incorporar una galería pública de fotos de la ExpoTec aportadas por quienes la visitan, con la invitación **«¡Subí tu foto de la ExpoTec!»**. Reunirá recuerdos de la experiencia y será independiente de la muestra de proyectos confirmados.

Implementado el 21/10/2026:

- Cualquier persona puede recorrer las fotos aprobadas sin iniciar sesión.
- Las cuentas autenticadas pueden elegir y subir una foto JPG, PNG o WebP de hasta 10 MB, con un título o descripción breve; el enlace HTTPS se conserva como alternativa. La imagen subida queda privada hasta la aprobación de organización.
- Incorporar el permiso real de invitado y una opción de registro como invitado, sin concederle automáticamente permisos de alumno. Mantener una sola identidad por correo y la combinación de permisos gestionada por administración.
- Cada aporte comienza pendiente. Solo administración, como organización de la exposición, puede aprobarlo o rechazarlo. El autor consulta el estado de sus propios aportes.
- La galería pública muestra únicamente aportes aprobados, con descripción, nombre público del autor y fecha; no muestra correos ni datos privados de cuentas.
- Conservar autor, estado y responsable de moderación en la base compartida. Validar permisos también en el servidor y proteger las decisiones frente a cambios simultáneos.

La galería y el registro como invitado están implementados. El servidor admite hasta 20 fotos pendientes por autor y limita el envío a 10 intentos por hora. La moderación comprueba versiones y conserva cada decisión con su responsable; retirar una publicada la excluye de la siguiente consulta pública. No se editan los enlaces ya enviados. La galería se actualiza al abrirla, cambiar de vista o pulsar Actualizar; no transmite cambios en tiempo real. La consulta anónima de proyectos y presentación TV continúa disponible.

## Decisiones de alcance del 21/10/2026

- Por indicación del 22/10/2026, incorporar carga directa de fotos en proyectos y galería, con optimización, validación y almacenamiento privado. Videos y otros documentos mantienen enlaces por ahora.
- Recuperación de contraseña: envío desde el correo personal del usuario, con configuración postergada para una etapa posterior.
- Continúan pendientes Google/Discord/GitHub, pruebas finales completas, documentación final y Android. El APK se retoma al final.

## Plataformas y estructura acordada

Por indicación posterior del usuario, la aplicación pasa a una única base de React Native con Expo SDK 57. Android y la vista para computadora utilizarán los mismos componentes, mediante React Native y React Native Web respectivamente. El mapa editable y la presentación para televisión se mantienen dentro de esta aplicación.

La referencia anterior en React con Vite y Bootstrap queda en `frontend/web/`; no será un segundo cliente activo. La decisión posterior de usar React Native sustituye el uso de Vite, Bootstrap y CSS para esta etapa. Los estilos nativos conservarán los temas claro y oscuro separados.

La aplicación conserva una demostración funcional de proyectos, inventario y préstamos con datos de ejemplo, separada de las pantallas compartidas. El hito 7A incorpora el backend Express de cuentas, sesiones y permisos, junto con las migraciones de autenticación. TiDB y los dos proyectos Vercel están publicados y comprobados. El hito 7B conecta las pantallas de cuentas y la persistencia de sesión. El hito 7C conecta espacios, mobiliario y puestos compartidos, separados de la demostración. El hito 7D conecta proyectos, equipos con cuentas reales, profesores, materias, revisión y confirmación atómica del puesto. El hito 7E conecta inventario, pedidos y reservas de recursos con la confirmación. El hito 7F conecta préstamos, devoluciones parciales, novedades, daños y saldos entre jornadas. El hito 7G conecta la presentación TV pública con los confirmados del servidor. Los proveedores sociales y la recuperación de contraseñas permanecen pendientes; la carga de fotos se incorpora el 22/10/2026; videos y otros documentos permanecen por enlace. Cambiar el perfil de demostración no equivale a autenticar usuarios.

Decisión posterior del usuario, 14/10/2026: alojar la base relacional en TiDB y desplegar el frontend y el backend como proyectos separados en Vercel. `frontend/native` se exporta para web; `frontend/web` continúa como referencia. Esta decisión ajusta el hosting, conservando MySQL como protocolo y el requisito de normalización relacional. La preparación y los límites actuales se documentan en [DESPLIEGUE.md](DESPLIEGUE.md).

```text
Proyecto Final - ExpoTec/
├── frontend/
│   ├── web/                  Referencia del prototipo anterior, sin desarrollo activo
│   └── native/               React Native + Expo SDK 57 + TypeScript
│       ├── index.ts          Entrada de Expo
│       ├── app.json          Configuración Android y web
│       ├── eas.json          Configuración de compilación Android
│       └── src/
│           ├── main.tsx
│           ├── app.tsx
│           ├── components/
│           ├── pages/
│           ├── contexts/
│           ├── hooks/
│           ├── lib/
│           └── theme/
│               ├── light.ts
│               └── dark.ts
├── backend/                  Node.js + Express; primer bloque de cuentas y sesiones
│   ├── src/
│   │   ├── config/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/
│   │   └── validators/
│   ├── sql/                  Creación de la base y migraciones MySQL
│   └── .env.example
├── docs/
│   ├── REQUISITOS.md
│   └── manual-de-usuario/    Manual final en formato APA
└── README.md                 Instalación, configuración y API
```

React Native utiliza componentes y estilos nativos también cuando se ejecuta en el navegador. Context API administra por separado el estado de la demostración y el de autenticación. La sesión real se integra con el backend desde el hito 7B. La persistencia local de datos de ejemplo no reemplaza la base de datos ni las comprobaciones de permisos del servidor.

En Android, los datos de demostración se guardarán en un archivo privado de documentos de la aplicación, con archivo temporal y respaldo fijo recuperable. Esto evita el límite por registro de AsyncStorage al incluir imágenes en los proyectos. La carga debe validar el contenido y recuperar una copia válida frente a una escritura incompleta; si ninguna copia puede leerse, se conserva el almacenamiento y se informa el error. Los datos anteriores de AsyncStorage se podrán leer sin eliminarlos automáticamente. En el navegador se mantiene AsyncStorage con la clave original para conservar los datos existentes.

El usuario pidió postergar la generación del APK. Se preparará la aplicación y su configuración de compilación durante esta migración, pero no se generará ni entregará el APK hasta retomar explícitamente esa etapa. El APK continúa como requisito de la entrega final.

## API y base de datos

- MySQL relacional, normalizada al menos hasta tercera forma normal.
- Entidades principales: usuarios, roles/permisos, proveedores de identidad, sesiones de renovación, proyectos, participantes, materias, profesores asignados, espacios, mobiliario, puestos, recursos, asignaciones, jornadas, préstamos, devoluciones y descargas.
- Relaciones mediante claves foráneas y tablas de unión. No guardar relaciones múltiples como listas de texto ni JSON cuando deban consultarse y validarse relacionalmente.
- Transacciones para confirmaciones, asignación de recursos, préstamos y devoluciones.
- Consultas parametrizadas; liberar conexiones al terminar, incluyendo errores.
- Operaciones de alta, baja, modificación y consulta para las entidades gestionables. La baja de entidades con historial deberá conservar la trazabilidad.
- Documentar método, ruta, permisos, parámetros, respuestas y errores de cada endpoint en README.
- Puerto y demás parámetros del servidor mediante variables de entorno.

Decisión pendiente: la consigna pide REST y también «NO usar más get». Para los datos se puede proponer POST de consulta y mantener POST/PATCH/DELETE para modificaciones; deberá confirmarse si esta excepción es aceptada en la evaluación. La carga normal de una web y los protocolos de proveedores externos pueden requerir GET.

## Interfaz y validaciones

- Interfaz en español, amigable, responsive y con buen uso del ancho en computadora.
- Implementado el 20/10/2026: interfaz más compacta con menores márgenes, espacios y tarjetas, controles de al menos 44 puntos y editor en dos columnas desde 900 píxeles de ancho.
- Implementado el 20/10/2026: giro del mobiliario grado a grado entre 0° y 359°, con campo de ángulo y ajustes de ±15°. Ingresar 360° equivale a 0°. Funciona en los espacios compartidos y la demostración; el servidor valida y conserva los ángulos enteros.
- Etiquetas visibles fuera de los campos; los placeholders no reemplazarán labels.
- Modos claro sutil y oscuro, con contraste legible y cambio de tema implementado. En la aplicación acordada los temas se definen en archivos nativos separados, `theme/light.ts` y `theme/dark.ts`; el CSS separado corresponde al prototipo web anterior.
- Formularios con errores visibles mientras se escribe, al abandonar el campo o cuando llega una respuesta del servidor; no solo al enviar.
- Nombres y apellidos con letras Unicode, espacios y apóstrofes; sin números ni otros símbolos.
- La restricción de nombres personales no se aplicará al nombre de un proyecto: «Robot 2026» puede ser válido.
- Fechas de nacimiento reales, no futuras; edad calculada automáticamente y no superior a 120 años, si esos datos forman parte del registro aprobado.
- Cantidades enteras no negativas, con mínimos y máximos según el recurso y la operación.
- Correos, URLs, formatos y tamaños de archivos validados.
- Estados de carga, vacío, error, éxito, permisos insuficientes y desconexión.
- Botones de operaciones ya completadas ocultos cuando la acción deje de estar disponible, sin quitar una operación recurrente legítima.
- Confirmación estilizada antes de borrar y cerrar sesión.
- Si existen selecciones múltiples: marcar todos, desmarcar y confirmar acciones destructivas sobre el conjunto.
- Fechas de creación visibles en DD/MM/AA.
- Navegación general en panel lateral de escritorio y menú hamburguesa en móvil, con accesos alineados y sección actual indicada; sin botoneras de navegación repetidas al pie de cada pantalla. Botón para volver arriba cuando la extensión de la pantalla lo requiera.
- Cada control visible deberá tener un comportamiento implementado. Las funciones de etapas futuras no se mostrarán como botones operativos.

## Descargas y auditoría

Si se incorporan descargas dentro del sistema, cada descarga debe dejar una copia local en el almacenamiento definido y un registro de quién la realizó, qué archivo se descargó y cuándo. Debe definirse si «local» significa el servidor o el dispositivo: una web no puede escribir arbitrariamente en carpetas del usuario.

La documentación final distinguirá la generación del APK, su distribución y el registro de descargas si se sirve desde la aplicación.

## Entregables

- Código fuente modular y documentado en repositorio Git.
- README con instalación de dependencias, configuración, ejecución y documentación de la API.
- SQL para crear la base de datos y aplicar cambios.
- Manual de usuario final en formato APA.
- APK Android generado, instalado y probado para la entrega final; su generación está postergada a pedido del usuario.
- ZIP del código sin node_modules, si se solicita o resulta necesario para la entrega.
- Video de demostración opcional.

No se considerará entregado el APK hasta disponer del archivo compilado y una prueba de instalación. No se considerará terminada una integración externa con credenciales ficticias.

## Secuencia de trabajo propuesta

1. Definir pantallas, navegación, roles y decisiones pendientes; revisar el diseño con Impeccable.
2. Migrar la demostración a React Native con Expo SDK 57 y revisar la misma aplicación en Android y navegador. El APK queda postergado por indicación del usuario.
3. Implementar el CRUD de proyectos y el flujo de revisión y confirmación.
4. Implementar espacios y editor de distribución con arrastrar y soltar.
5. Implementar inventario, préstamos, devoluciones y control por jornada.
6. Implementar modo invitados y presentación para televisión.
7. Implementar y verificar backend, TiDB/MySQL, autenticación, recuperación y permisos reales; verificar los flujos completos, accesibilidad, temas y tamaños de pantalla. Preparar documentación y retomar el APK cuando el usuario lo indique.

La etapa 7 comienza con el hito **7A: cuentas, sesiones y preparación del hosting**, comprobado el 14/10/2026: 18 pruebas locales, integración SQL real en TiDB, web y API publicadas por separado y conexión a TiDB verificada desde Vercel.

El hito **7B: acceso desde la aplicación**, implementado el 19/10/2026, conecta registro, ingreso, cuenta, permisos actuales y cierre con confirmación. Conserva la sesión mediante SecureStore en Android y cookie HttpOnly en web; el token de acceso permanece en memoria. Se comprobaron registro, ingreso, errores de credenciales, recarga, renovación simultánea en dos pestañas y cierre en navegador, además de las pruebas automáticas. El empaquetado Android se comprueba por separado y no sustituye la prueba en dispositivo físico.

El hito **7C: espacios compartidos** incorpora la consulta pública y la edición de planos por administradores reales, con espacios, mobiliario y puestos normalizados en TiDB. Las mesas se habilitan como puestos por separado. El guardado verifica versiones y es transaccional; las bajas conservan registros. No se importan automáticamente los datos ficticios ni se inventa el plano de la escuela.

El hito **7D: proyectos compartidos** incorpora propuestas, equipos vinculados a cuentas activas, materias, profesores, pedidos de cambios, reenvíos y confirmación del puesto en una transacción. El creador y quien edita permanecen en el equipo. Un alumno puede integrar varios proyectos. Los confirmados aparecen en el plano y en la muestra pública, sin correos ni UUID de participantes; administración puede reabrir o cancelar conservando revisiones. Los proyectos vigentes impiden retirar su puesto o dar de baja su espacio. Se usan enlaces HTTPS de imagen y video ya alojados; el borrador solo se conserva mientras la pantalla permanece abierta.

El hito **7E: inventario y reservas** incorpora elementos compartidos como cantidades de unidades equivalentes, administración de existencias con versiones e historial, consulta para encargados de préstamos y selección de pedidos en propuestas. La confirmación comprueba stock y puesto y reserva todo en una transacción; dos confirmaciones no superan las existencias. Los pendientes no reservan stock, un faltante no deja asignaciones parciales y se protegen bajas y reducciones de total. Reabrir o cancelar libera reservas conservando historial. Todavía no se identifican unidades individuales por número de serie.

El hito **7F: préstamos y devoluciones compartidos** vincula cada entrega con proyecto confirmado, elemento reservado, jornada 1–3, integrante activo que retira y persona que entrega. Una sola entrega por proyecto, elemento y jornada; cantidades enteras de 1–10000, limitadas por la reserva disponible y el stock físico. Devoluciones parciales o completas con versiones, fecha, autor y daños. Las novedades sin devolución exigen explicación y conservan el saldo. Los pendientes permanecen entre jornadas y bloquean edición, reapertura y cancelación del proyecto y la baja del elemento. Las devoluciones completas mantienen las reservas del proyecto para la jornada siguiente. Los daños apartan unidades del inventario hasta un ajuste de administración con motivo. El historial no se borra y puede reflejar faltantes de cobertura de reservas por daños. Las jornadas son ordinales; sus fechas reales quedan pendientes de definición, mientras los movimientos guardan su instante real en UTC.

El hito **7G: presentación TV compartida** carga la secuencia pública con paginación por cursor, sin correos ni datos privados de proyectos, recursos o préstamos. Inicio manual y videos sin sonido por defecto. Fichas de 8, 15 o 30 segundos, videos hasta terminar, pausa, anterior, siguiente, consulta de la ficha completa y pantalla completa web cuando esté disponible. Los errores de video o 30 segundos sin avance muestran la ficha con reintento. La actualización cada minuto retira proyectos reabiertos o cancelados y conserva el actual si sigue confirmado. Un fallo de conexión pausa y oculta la secuencia; recuperar la consulta no inicia automáticamente la reproducción. Salir u ocultar la página la pausa. La secuencia vuelve al primero al completarse. La edición local de demostración permanece separada.

El hito **7H: usuarios y permisos**, implementado el 21/10/2026, permite a administración buscar cuentas por nombre o correo, consultar páginas de usuarios y asignar uno o varios permisos desde Mi cuenta. La selección requiere revisión y confirmación antes de guardar. El servidor vuelve a comprobar que el actor sea un administrador activo, protege al último administrador y compara los permisos esperados con los actuales para rechazar sobrescrituras simultáneas. Un conflicto conserva la selección y permite descartar y recargar con confirmación. No habilita altas de profesores sin una cuenta previamente registrada ni cambia contraseñas.

El hito 7I incorpora la galería moderada con cuentas de invitados. El hito **7J** implementa la preparación del acceso social web con Google, Discord y GitHub, registro con contraseña propia y vinculación mediante la contraseña de la cuenta existente. No vincula cuentas por coincidencia de correo. Se comprueba con proveedores controlados y TiDB; queda pendiente crear las aplicaciones externas, configurar sus secretos y verificar los tres proveedores reales. La guía está en `docs/ACCESOS_SOCIALES.md`. La recuperación por correo personal y carga directa de archivos quedan postergadas. Los hitos 7A–7J no dan por finalizada la etapa 7. Los diagramas editables de arquitectura y funcionamiento están en `docs/diagramas/sistema-expotec.drawio`. Los perfiles y datos del área de demostración siguen siendo ficticios e independientes de la cuenta real. Por indicación del usuario del 19/10/2026, Android se retoma al final.

Cada etapa tendrá alcance explícito, controles funcionales y comprobaciones propias. La verificación final incluirá aprobaciones simultáneas, stock insuficiente, permisos, devolución parcial, renovación de sesión, enlaces de video inválidos y recuperación frente a errores de conexión.
