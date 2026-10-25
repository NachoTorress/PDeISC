# Guía de demostración de ExpoTec

Recorrido para la exposición del proyecto

Versión de referencia 0.4.0

25 de octubre de 2026

## Propósito del recorrido

Esta guía permite mostrar en unos 10 a 15 minutos cómo se relacionan los perfiles de ExpoTec. La demostración contiene ejemplos locales y permite cambiar de usuario sin iniciar sesión en cinco cuentas distintas. Al final se agrega una comprobación breve del sistema compartido para mostrar el acceso real y el consumo de la API.

## Preparación

1. Abrí la APK o la web y comprobá que la interfaz se vea bien en la pantalla de exposición.
2. Entrá en **Demostración**. Usá **Cambiar vista** y **Probar vista como** para elegir cada perfil.
3. Revisá los ejemplos antes de presentar. Los cambios se guardan en este dispositivo; el estado puede ser distinto al inicial si ya practicaste.
4. Ubicá **Estación meteorológica**, que inicialmente está pendiente y pertenece a Lucía Fernández, con Martín García como profesor. Ubicá también **Brazo robótico**, inicialmente confirmado y con un préstamo de una zapatilla eléctrica en la jornada 1.
5. Si esos ejemplos ya cambiaron, adaptá el recorrido a su estado. Organización puede reabrir un confirmado que no tenga préstamos pendientes; así se puede repetir la revisión. No borres los datos locales para preparar la exposición si querés conservar lo practicado.

No hay que cargar cuentas, fotografías ni movimientos ficticios en producción para seguir esta guía. La demostración sirve para practicar esas operaciones.

## Presentar la aplicación

Explicación sugerida: ExpoTec organiza la presentación de proyectos escolares, sus puestos y los elementos que se prestan durante tres jornadas. Cada perfil ve acciones acordes a su responsabilidad. La aplicación funciona en Android y web, y el sistema compartido guarda sus datos mediante una API y una base TiDB.

Mostrá la navegación y el cambio entre claro y oscuro. Indicá la franja de demostración para que el público identifique el entorno de los ejemplos.

## Mostrar el perfil de estudiante

Elegí **Estudiante**. La identidad de ejemplo es Lucía Fernández.

1. Abrí **Proyectos** y buscá **Estación meteorológica**.
2. Abrí su ficha y mostrá equipo, profesores, materias, puesto y elementos solicitados.
3. Editá una parte de la descripción y guardá con **Guardar y enviar a revisión**.
4. Mostrá que el estado es pendiente: presentar una propuesta no equivale a reservar el puesto.

Para mostrar validaciones, también podés abrir **Presentar proyecto**, intentar enviarlo vacío y señalar los campos marcados. Volvé sin crear otro registro si no lo necesitás.

En la demostración se usa un formulario local. El formulario del sistema compartido organiza la carga en Proyecto, Equipo, Puesto y Revisar, y permite buscar cuentas registradas por correo. Conviene mostrar esa pantalla aparte si se quiere explicar la versión compartida.

## Mostrar la revisión del profesor

Elegí **Profesor**. La identidad de ejemplo es Martín García.

1. Abrí **Estación meteorológica** y pulsá **Pedir cambios**.
2. Escribí un comentario concreto, por ejemplo: “Aclarar qué sensores utiliza el equipo y cómo se muestran las mediciones”. Enviá la devolución.
3. Cambiá a **Estudiante**, abrí la propuesta y mostrá el comentario recibido. Corregí la descripción y reenviá.
4. Volvé a **Profesor** y elegí **Confirmar proyecto**.
5. Abrí el plano del Patio central y comprobá que el puesto P03 figure ocupado por el proyecto, si conserva la ubicación inicial.

Si aparece un conflicto de lugar o de recursos, usalo para explicar la validación y corregí el pedido antes de confirmar. El resultado esperado es un proyecto confirmado con puesto y elementos asignados.

## Mostrar préstamos y devoluciones

Elegí **Préstamos** y abrí la jornada 1.

1. Mostrá el préstamo inicial de una zapatilla eléctrica de **Brazo robótico**. Si sigue pendiente, registrá su devolución.
2. Para mostrar una devolución parcial, pulsá **Registrar entrega** y elegí un proyecto confirmado con una reserva de al menos dos unidades de un elemento y sin entrega registrada para ese elemento en la jornada elegida.
3. Registrá dos unidades, devolvé una y mostrá el saldo de una pendiente. Completá la devolución.
4. Cambiá de jornada y explicá que los elementos no devueltos siguen afectando la disponibilidad.

Si se confirmó Estación meteorológica sin cambiar su pedido inicial, sus dos zapatillas eléctricas permiten ilustrar la devolución parcial. Si ya existe esa entrega, usá otra jornada habilitada. Revisá disponibilidad y movimientos antes de presentar; la demostración controla las cantidades y los préstamos pendientes. El sistema compartido agrega una restricción de una entrega por proyecto, elemento y jornada.

Explicá que reservar elementos para un proyecto y entregarlos físicamente son operaciones distintas. Una devolución completa conserva la reserva para los días siguientes.

## Mostrar organización

Elegí **Organización**.

1. Abrí **Espacios** y **Acomodar espacio**. Seleccioná una mesa y mostrá giro y tamaño. Cancelá si no querés conservar el cambio.
2. Abrí **Inventario**, mostrá un elemento y las opciones para crear o modificar existencias. Explicá que el sistema protege reservas y préstamos.
3. Abrí la galería y mostrá la moderación de fotos.

La gestión real de **Usuarios y permisos** se muestra desde una cuenta administradora del sistema compartido. El selector de perfiles ficticios no modifica cuentas reales. Para la defensa basta abrir la pantalla con una cuenta autorizada; no hace falta cambiar permisos durante la presentación.

## Mostrar invitado y galería

Elegí **Invitado** y recorré la muestra: aparecen los proyectos confirmados. Abrí una ficha y ubicá un proyecto en el plano.

Para mostrar el circuito de fotos, elegí **Galería** y **¡Subí tu foto de la ExpoTec!**. Usá la imagen de ejemplo si no querés elegir un archivo y completá la descripción. Enviá y mostrá el aporte en **Mis fotos**.

Cambiá a **Organización**, abrí la moderación y aprobá ese aporte. Volvé a **Invitado** y comprobá que aparezca entre las fotos publicadas. Explicá que los aportes pendientes no se publican automáticamente.

Desde Invitado, abrí **TV** o la presentación disponible en la demostración. Iniciá la secuencia y mostrá pausa, avance y retroceso. Si no hay videos cargados, las fichas permiten completar el ejemplo sin depender de contenido externo.

## Mostrar el sistema compartido

Volvé a **Ver espacios compartidos** o elegí **Espacios** desde la navegación principal. Indicá que ahora se consultan los datos del servidor.

1. Mostrá el acceso con una cuenta propia; en Android podés mostrar el selector nativo de Google.
2. Consultá los permisos desde el menú de cuenta.
3. Abrí proyectos o galería compartidos y actualizá una consulta para mostrar el uso del backend.
4. Si disponés de otro dispositivo, abrí una ficha pública existente en ambos para explicar que consultan la misma información compartida.

Elegí previamente una cuenta que puedas mostrar y evitá proyectar contraseñas, enlaces de recuperación o configuración privada. El recorrido de demostración prueba las reglas locales y las pantallas; la evidencia del backend se completa con el sistema compartido, la documentación y las pruebas registradas.

## Relacionar el recorrido con la consigna

| Punto de la consigna | Qué mostrar |
| --- | --- |
| Registro y autenticación social | Pantalla de acceso real y Google nativo; disponibilidad de Discord y GitHub. |
| Tres o más roles | Los cinco perfiles de demostración y sus acciones. |
| CRUD y permisos | Edición de propuesta, revisión, inventario y espacios; documentación de la API. |
| Manejo de errores | Formulario vacío, falta de stock o un conflicto reproducible. |
| React Native y navegación adaptable | APK funcionando y las mismas secciones desde la web. |
| Sesión persistente | Cerrar y volver a abrir la app después de ingresar. |
| Consumo de API y base de datos | Consulta del sistema compartido y explicación de la arquitectura. |
| APK y documentación | Archivo instalable, manual de usuario y guía de instalación. |

## Antes de terminar

Dejá a mano el enlace web, el archivo APK y la carpeta de documentación. Si se graba un video, este mismo recorrido puede resumirse en ingreso, revisión de proyecto, préstamo, galería y vista pública. El video es opcional según la consigna.
