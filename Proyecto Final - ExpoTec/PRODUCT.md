# ExpoTec

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Alumnos, profesores responsables, encargados de préstamos, administradores e invitados de una escuela técnica. El público consulta proyectos sin iniciar sesión.

## Product Purpose

Organizar una exposición de tres días: proyectos, puestos y distribución de los espacios, asignación de recursos, entregas y devoluciones al terminar cada jornada.

## Capabilities and Constraints

Los requisitos completos están en docs/REQUISITOS.md. El usuario confirmó React Native con Expo SDK 57 como base de la aplicación. React Native Web permite revisar las mismas pantallas en el navegador y presentar la muestra en TV. La versión anterior con Vite se conserva como referencia. El servidor usa Node con import/export y protocolo MySQL para TiDB. La generación del APK quedó postergada por indicación explícita del usuario.

La aplicación abre espacios compartidos guardados en TiDB, de consulta pública y edición exclusiva de administradores reales. Cada mesa puede ser mobiliario o habilitarse como puesto. La demostración se mantiene aparte, con proyectos, espacios, inventario y préstamos ficticios guardados localmente. La selección de una vista de demostración no concede permisos reales. Sus equipos admiten varios integrantes y los proyectos informáticos admiten enlaces opcionales de GitHub y de su página.

El hito 7A incorpora una API Express de cuentas, sesiones y permisos, con SQL para TiDB. El usuario confirmó el 14/10/2026 la base en TiDB y dos proyectos separados en Vercel para backend y frontend. TiDB está configurado y la web y API están publicadas; la conexión de la API a TiDB está comprobada. El hito 7B del 19/10/2026 conecta **Mi cuenta**: registro como alumno, ingreso, consulta de permisos, renovación y cierre con confirmación. Android utiliza Expo SecureStore; la web, cookie HttpOnly y un proxy del mismo origen. El acceso social y la recuperación por correo siguen pendientes. La carga directa de archivos queda postergada; se mantienen enlaces. Las direcciones y las pruebas están en docs/DESPLIEGUE.md.

El hito 7C incorpora espacios, mobiliario y puestos relacionales, guardado atómico con versiones y bajas sin eliminar registros. El hito 7D incorpora propuestas compartidas, equipos vinculados con cuentas de alumnos, profesores responsables, materias, pedido de cambios y reenvío, confirmación transaccional de un único proyecto por puesto, reapertura y cancelación con historial. Los proyectos confirmados aparecen en el plano y en la consulta pública; sus correos permanecen privados. El hito 7E conecta inventario y reservas: administración gestiona existencias con versiones e historial, préstamos consulta, y los alumnos agregan cantidades de elementos a sus propuestas. La confirmación reserva puesto y todos los elementos de forma atómica; los pendientes no consumen stock. Se protegen bajas y reducciones de total y se liberan reservas al reabrir o cancelar. El hito 7F conecta préstamos y devoluciones por jornadas ordinales 1–3, con entregas a integrantes activos, devoluciones parciales, novedades y daños auditados. Los pendientes de cualquier jornada consumen disponibilidad y bloquean edición, reapertura y cancelación del proyecto. Los daños apartan unidades hasta una reparación registrada por administración. El hito 7G conecta la presentación TV con los proyectos confirmados del servidor: acceso público, fichas y videos, pausa y avance, duración de fichas de 8/15/30 segundos, pantalla completa web y sonido opcional. Actualiza cada minuto, retira proyectos reabiertos o cancelados y pausa ante fallos de conexión. Los videos no disponibles vuelven a la ficha con reintento. Los diagramas editables del sistema están en docs/diagramas. Android se retoma al final por indicación del usuario del 19/10/2026.

## Operating Context

Alumnos presentan proyectos; uno de los profesores asignados los confirma. La confirmación ocupa el puesto. Los recursos físicos se entregan y devuelven cada día. Organización acomoda aulas y patio. Una televisión reproduce la presentación pública.

## Evidence on Hand

Consigna aportada por el usuario. No hay plano real, imágenes de proyectos, fechas de la exposición ni relevamiento eléctrico. Los espacios y proyectos del prototipo están identificados como datos de ejemplo.

## Open Decisions

Distribución real de la escuela, fechas, configuración de Google/Discord/GitHub y del correo personal para recuperación, criterios de revisión eléctrica y formatos admitidos para videos. Los proyectos compartidos vinculan hasta 12 cuentas de alumnos y 5 profesores habilitados; la demostración local conserva participantes ficticios por nombre. Por ahora las imágenes y videos compartidos usan enlaces HTTPS a contenido ya alojado. No inventar capacidades eléctricas ni presentar el prototipo como sistema terminado.

El hito 7H del 21/10/2026 agrega la gestión administrativa de usuarios desde Mi cuenta: búsqueda, páginas, selección de varios permisos y confirmación. La comparación transaccional de los permisos leídos impide sobrescrituras simultáneas; el servidor protege al último administrador activo. No requiere nuevos servicios ni modifica contraseñas.

Decisiones del 21/10/2026: conservar fotos, videos y archivos por enlace; configurar la recuperación desde el correo personal del usuario más adelante. Hito 7I implementado: galería pública de recuerdos de la ExpoTec, aportes por enlace desde cuentas autenticadas (incluido un nuevo permiso de invitado), aprobación o rechazo por administración y consulta del estado de los propios aportes. El registro de invitado no concede permisos de alumno. Solo se publican fotos aprobadas; los correos de autores permanecen privados.

La galería usa enlaces HTTPS y moderación con versiones e historial. Registro como alumno o invitado, sin duplicar identidad por correo ni conceder al invitado permisos de alumno. Toda cuenta activa puede aportar; solo administración publica, rechaza o retira. La consulta pública omite correos y datos de revisión. La carga directa y el correo de recuperación siguen postergados.
## Accesos sociales web — preparación del hito 7J

Mi cuenta incorpora Google, Discord y GitHub solo cuando el backend tiene configurado el proveedor. La primera alta social pide contraseña propia de ExpoTec y permite elegir alumno o invitado. Para vincular un correo que ya existe se exige la contraseña de esa cuenta. Una identidad vinculada conserva el mismo usuario y permisos. Las aplicaciones externas todavía no fueron creadas: activación y pruebas reales pendientes; guía en `docs/ACCESOS_SOCIALES.md`. Android permanece al final.
