# Manual de usuario de ExpoTec

Proyecto ExpoTec

Versión de referencia 0.4.0

25 de octubre de 2026

## Presentación

ExpoTec ayuda a organizar una exposición escolar: reúne propuestas de proyectos, puestos, recursos, préstamos y fotografías. Este manual explica cómo recorrer la aplicación en Android y en el navegador, cómo realizar las tareas de cada perfil y cómo practicar con la demostración.

La aplicación tiene un sistema compartido, conectado al servidor, y una demostración con datos de ejemplo. En el sistema compartido, las operaciones autorizadas se guardan para todos los dispositivos. En la demostración se puede cambiar de perfil y practicar con datos locales. Antes de comenzar, identificá cuál de los dos estás usando.

## Acceso desde Android y desde la web

En Android, descargá la APK desde el enlace de la guía de entrega e instalala. Si el teléfono pide autorización para instalar desde el navegador o el gestor de archivos, habilitala para completar esa instalación. Abrí ExpoTec desde su ícono. Una instalación nueva no necesita tener Expo Go ni una computadora encendida.

Desde una computadora o un teléfono también podés abrir [la web de ExpoTec](https://expotec-web-gn19.vercel.app). Para consultar y modificar los datos compartidos necesitás conexión a Internet. La demostración utiliza datos locales; las imágenes y los videos externos pueden necesitar conexión.

Al abrir la aplicación se muestran los espacios compartidos. Las secciones disponibles cambian según los permisos. En pantallas pequeñas, abrí el menú de navegación para ver las opciones. El control de tema de la barra superior permite alternar entre claro y oscuro.

## Perfiles y permisos

| Perfil | Qué puede hacer en el sistema compartido |
| --- | --- |
| Visitante sin cuenta | Consultar espacios, proyectos confirmados, fotos publicadas y presentación TV. |
| Invitado con cuenta | Consultar la muestra, enviar fotos y seguir el estado de sus aportes. |
| Alumno | Presentar propuestas, integrar equipos y corregir proyectos dentro de los estados permitidos. |
| Profesor | Revisar los proyectos que lo tengan asignado y confirmar o solicitar cambios. |
| Encargado de préstamos | Consultar inventario y registrar entregas, devoluciones y novedades. |
| Administrador | Gestionar permisos, espacios, inventario, moderación y operaciones de organización. |

Una cuenta puede tener varios permisos. Registrarse como alumno o invitado no concede permisos de profesor, préstamos o administración. La organización asigna esos permisos. El perfil ficticio elegido en la demostración tampoco cambia los permisos de la cuenta real.

## Registro e inicio de sesión

### Crear una cuenta

1. Abrí **Ingresar** desde la barra superior y elegí la opción de registro.
2. Completá nombre, apellido, correo y tipo de cuenta: alumno o invitado.
3. Escribí una contraseña de entre 12 y 128 caracteres y repetila en el campo de confirmación.
4. Revisá los mensajes de los campos y completá el registro.

Usá un correo al que tengas acceso. Para integrar un equipo o asignar un profesor, la cuenta correspondiente debe estar registrada y tener el permiso necesario.

### Ingresar y conservar la sesión

Podés ingresar con correo y contraseña o con Google, Discord y GitHub cuando sus botones estén disponibles. En Android, Google ofrece el selector nativo de cuentas. Discord y GitHub abren el navegador y regresan a ExpoTec al finalizar.

Si una identidad social es nueva, ExpoTec puede pedir completar el registro y definir una contraseña propia. Si el correo ya pertenece a una cuenta de ExpoTec, la vinculación solicita la contraseña de esa cuenta. La contraseña solicitada es la de ExpoTec; las credenciales del proveedor se introducen únicamente en su propio acceso.

La sesión se conserva al cerrar y volver a abrir la aplicación, mientras siga vigente. El menú de cuenta muestra los permisos disponibles. Para salir, elegí **Cerrar sesión** y confirmá. Si la aplicación no puede comprobar la conexión, usá la opción de reintentar.

### Recuperar la contraseña

En el acceso, elegí **Olvidé mi contraseña** e ingresá tu correo. Revisá Recibidos y Spam. Abrí el enlace recibido y elegí y repetí una contraseña nueva. El enlace vence a los 20 minutos y sirve una sola vez; si pedís otro, el anterior deja de servir. El cambio se realiza desde la web y luego podés ingresar con la nueva contraseña en Android. Al cambiarla, las sesiones anteriores se cierran.

## Consultar la exposición

En **Espacios** podés abrir un plano, distinguir puestos disponibles y confirmados y consultar el proyecto que ocupa un puesto. Una propuesta pendiente no ocupa el lugar: la asignación se realiza al confirmarla.

En **Proyectos**, la muestra pública presenta únicamente proyectos confirmados. Abrí una ficha para conocer descripción, integrantes, profesores, materias y ubicación. Algunos proyectos incluyen video, repositorio de GitHub o página web. Los enlaces son opcionales.

En **Galería de la ExpoTec** se muestran las fotos aprobadas por la organización. Las propuestas y fotos pendientes no aparecen en las vistas públicas.

## Presentar un proyecto como alumno

Ingresá con una cuenta de alumno y abrí **Proyectos**. Elegí **Presentar un proyecto**. En el sistema compartido, el formulario se organiza en cuatro pasos.

1. **Proyecto**. Completá nombre, descripción y curso; agregá una foto subida desde el dispositivo o un enlace de imagen HTTPS. El video es opcional. Si corresponde, marcá proyecto informático y agregá GitHub o página web.
2. **Equipo**. Buscá alumnos y profesores por el correo exacto de sus cuentas. Revisá la persona encontrada y agregala explícitamente. Incorporá las materias desde las sugerencias o escribí una propia y agregala. El creador y quien edita permanecen dentro del equipo.
3. **Puesto**. Elegí el espacio y un puesto habilitado. Si necesitás recursos, agregalos desde el catálogo e indicá las cantidades. Podés actualizar la disponibilidad sin borrar el resto del formulario.
4. **Revisar**. Comprobá los datos y enviá la propuesta. Si queda texto sin agregar en personas o materias, completá esa acción o retiralo antes de continuar.

Podés volver a un paso anterior sin perder lo que escribiste. Los errores señalan dónde corregir. El borrador se mantiene mientras el formulario siga abierto; no se recupera después de cerrar la aplicación. Si intentás salir con cambios, la aplicación pide confirmación.

El proyecto enviado queda pendiente. Pedir recursos o un puesto no los reserva. La confirmación del profesor comprueba la disponibilidad de todo el pedido; si falta lugar o stock, la propuesta no se confirma parcialmente.

### Corregir una propuesta

Desde tus proyectos, abrí la ficha y leé el comentario del profesor. Elegí editar, corregí los datos y reenviá. Un integrante autorizado también puede editar antes de la confirmación. Un proyecto confirmado requiere intervención de organización para reabrirse cuando corresponda.

Si otra persona guardó cambios o tomó el puesto mientras completabas el formulario, se informa el conflicto y se conserva el borrador en pantalla. Revisá la disponibilidad o recargá la versión guardada usando la acción ofrecida; el descarte requiere confirmación.

## Revisar proyectos como profesor

Ingresá con una cuenta que tenga permiso de profesor y abrí las revisiones de proyectos. Se muestran las propuestas en las que estás asignado como responsable.

1. Abrí una propuesta pendiente y revisá equipo, materias, imagen, puesto y elementos.
2. Si necesita correcciones, elegí **Pedir cambios**, explicá qué debe ajustar el equipo y enviá la devolución.
3. Si está lista, elegí **Confirmar proyecto** y completá la confirmación que muestre la pantalla.
4. Comprobá el estado final. Una confirmación correcta ocupa el puesto, reserva los elementos pedidos y publica el proyecto en la muestra.

Si el puesto fue ocupado o faltan unidades, revisá el mensaje y coordiná una corrección. La aplicación no permite confirmar dos proyectos para un mismo puesto.

## Registrar préstamos y devoluciones

Estas acciones requieren permiso de préstamos o administración. El inventario representa cantidades de elementos equivalentes; las piezas del plano se administran por separado.

### Entregar elementos

1. Abrí **Préstamos** y elegí **Nueva entrega** en el sistema compartido.
2. Seleccioná jornada 1, 2 o 3, proyecto confirmado y elemento reservado.
3. Indicá el integrante activo que retira y la cantidad.
4. Pulsá **Revisar entrega**, comprobá el resumen y confirmá.

Las jornadas identifican los tres días de la exposición; cada movimiento conserva además su fecha y hora reales. Solo puede registrarse una entrega por proyecto, elemento y jornada. Los préstamos pendientes de cualquier jornada limitan las nuevas entregas.

### Recibir una devolución

Buscá el préstamo y elegí **Devolver**. Indicá cuántas unidades recibís y, si corresponde, cuántas están dañadas. Se admiten devoluciones parciales: el resto continúa pendiente. Los daños y las novedades requieren una explicación. **Registrar novedad** agrega una observación sin devolver unidades.

La vista de pendientes reúne las jornadas. También podés consultar una jornada o el historial. Cambiar de día no devuelve elementos automáticamente. La devolución completa mantiene la reserva del proyecto para la siguiente jornada. Un proyecto con préstamos pendientes no se puede reabrir ni cancelar.

## Organizar espacios e inventario

### Crear y acomodar un espacio

Como administrador, abrí **Espacios**, creá un espacio o elegí uno existente y entrá en **Acomodar espacio**. Agregá mobiliario y ajustá posición, giro y tamaño. En el teléfono podés seleccionar piezas mediante las flechas y usar los controles de giro, ancho y fondo. **Ángulo exacto** permite escribir un valor y aplicarlo.

Para que una mesa pueda solicitarse en un proyecto, seleccionala y activá **Habilitar esta mesa como puesto para proyectos**. Guardá el plano para compartir los cambios. **Cancelar** descarta la edición según la confirmación mostrada. Las bajas y los cambios protegen puestos con proyectos vigentes. Los puntos eléctricos del plano son referencias de ubicación, sin certificación de capacidad eléctrica.

### Administrar elementos

En **Inventario**, administración puede crear elementos, cambiar nombre, descripción y total, y consultar **Ver historial**. Las bajas conservan los registros. El sistema impide ajustes que dejen sin cobertura las reservas o los préstamos. Las unidades dañadas quedan fuera de servicio y pueden rehabilitarse con un ajuste administrativo justificado.

### Asignar permisos

Abrí **Usuarios y permisos**, buscá la cuenta y revisá sus permisos antes de guardar cambios. Los permisos se comprueban también en el servidor. La aplicación protege al último administrador activo. Si otra persona modificó los mismos permisos, recargá el estado actual antes de volver a guardar.

## Enviar y moderar fotos

Con una cuenta activa, abrí **Galería de la ExpoTec** y elegí **¡Subí tu foto de la ExpoTec!**. Seleccioná una imagen JPG, PNG o WebP de hasta 10 MB, o usá un enlace HTTPS, y completá la descripción. Revisá la vista previa y enviá.

La foto queda pendiente. En **Mis fotos** podés consultar la decisión. Las imágenes subidas permanecen privadas hasta la aprobación. Administración entra en la moderación para aprobar o rechazar; retirar una publicada la excluye de la galería pública. El rechazo o retiro exige un motivo visible para el autor.

La demostración usa su propio formulario local, con límite de 2 MB para el archivo, y ofrece una imagen de ejemplo. Sus aportes no se envían a la galería compartida.

## Usar la presentación TV

Abrí **Presentación TV** desde la navegación compartida y pulsá **Iniciar presentación**. Podés pausar, avanzar, retroceder y elegir la duración de las fichas. La secuencia vuelve al inicio al terminar. Los videos avanzan al finalizar su reproducción.

El sonido comienza desactivado; **Activar sonido** lo habilita cuando el dispositivo lo permite. En el navegador, **Pantalla completa** aparece cuando está disponible. Si un video falla, se muestra la ficha y una opción de reintentar. Al salir de la pantalla o quedar oculta, la reproducción se pausa. Ante un error al actualizar la muestra, recuperá la conexión y volvé a iniciarla.

Para una exposición en televisor, comprobá previamente imagen, sonido, conexión y el modo de pantalla completa con el equipo que se vaya a usar.

## Practicar con la demostración

Abrí **Demostración** desde la navegación. La franja superior indica la identidad ficticia. Elegí **Cambiar vista**, abrí **Probar vista como** y seleccioná Estudiante, Profesor, Préstamos, Organización o Invitado. No hace falta crear cinco cuentas para recorrer los perfiles de ejemplo.

Los datos locales se conservan entre cambios de perfil. Esto permite que el estudiante envíe una propuesta, el profesor la revise y el encargado registre un préstamo sobre los mismos ejemplos. La demostración no concede permisos reales, no comprueba el acceso a TiDB y no comparte sus cambios con otros dispositivos.

En esta versión, el formulario de propuesta compartido tiene cuatro pasos y busca cuentas por correo. La demostración usa su formulario local y participantes de ejemplo. Los controles y la presentación de los datos pueden diferir entre ambos recorridos.

Para preparar la defensa, seguí la **Guía de demostración de ExpoTec**. Incluye un recorrido con Estación meteorológica y Brazo robótico, alternativas si los ejemplos ya se modificaron y una breve comprobación del acceso real.

## Resolver problemas frecuentes

| Situación | Qué hacer |
| --- | --- |
| No aparece una sección | Revisá los permisos de tu cuenta y si estás en el sistema compartido o en la demostración. |
| No se encuentra un integrante o profesor | Comprobá el correo exacto, el registro previo y el permiso de la cuenta. Buscá y agregá el resultado. |
| No se puede confirmar un proyecto | Leé el aviso de puesto, stock o participantes. Corregí y reintentá después de actualizar la disponibilidad. |
| La foto no aparece públicamente | Consultá Mis fotos. Los aportes pendientes o rechazados no se publican. |
| No conecta con el servidor | Revisá Internet y usá Reintentar o Actualizar. No cierres un borrador sin guardar si necesitás conservarlo. |
| La sesión pide ingresar de nuevo | Ingresá nuevamente; pudo vencer, cerrarse o revocarse tras un cambio de contraseña. |
| El acceso social no regresa | Volvé a ExpoTec e iniciá otro intento. En Android, comprobá que el navegador permita abrir el enlace de regreso. |
| Un cambio no aparece en otro dispositivo | Comprobá que se hizo en el sistema compartido y actualizá la consulta. Los cambios de la demo son locales. |

## Documentación relacionada

La guía de instalación explica cómo preparar el frontend, el backend y la base de datos. El README del backend describe los endpoints, parámetros, respuestas y errores. La guía de demostración organiza el recorrido para la evaluación.

Documentos del proyecto: **Guía de instalación y configuración de ExpoTec** (2026), **Guía de demostración de ExpoTec** (2026) y **Documentación de la API de ExpoTec**, disponible en `backend/README.md` dentro del repositorio.
