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

El hito 7A incorpora una API Express de cuentas, sesiones y permisos, con SQL para TiDB. El usuario confirmó el 14/10/2026 la base en TiDB y dos proyectos separados en Vercel para backend y frontend. TiDB está configurado y la web y API están publicadas; la conexión de la API a TiDB está comprobada. El hito 7B del 19/10/2026 conecta **Mi cuenta**: registro como alumno, ingreso, consulta de permisos, renovación y cierre con confirmación. Android utiliza Expo SecureStore; la web, cookie HttpOnly y un proxy del mismo origen. Los servicios de acceso social, recuperación por correo y archivos siguen pendientes. Las direcciones y las pruebas están en docs/DESPLIEGUE.md.

El hito 7C incorpora espacios, mobiliario y puestos relacionales, guardado atómico con versiones y bajas sin eliminar registros. El hito 7D incorpora propuestas compartidas, equipos vinculados con cuentas de alumnos, profesores responsables, materias, pedido de cambios y reenvío, confirmación transaccional de un único proyecto por puesto, reapertura y cancelación con historial. Los proyectos confirmados aparecen en el plano y en la consulta pública; sus correos permanecen privados. El inventario, las solicitudes y reservas de recursos, los préstamos y la presentación TV compartida siguen pendientes. Android se retoma al final por indicación del usuario del 19/10/2026.

## Operating Context

Alumnos presentan proyectos; uno de los profesores asignados los confirma. La confirmación ocupa el puesto. Los recursos físicos se entregan y devuelven cada día. Organización acomoda aulas y patio. Una televisión reproduce la presentación pública.

## Evidence on Hand

Consigna aportada por el usuario. No hay plano real, imágenes de proyectos, fechas de la exposición ni relevamiento eléctrico. Los espacios y proyectos del prototipo están identificados como datos de ejemplo.

## Open Decisions

Distribución real de la escuela, fechas, proveedores sociales, almacenamiento de archivos, criterios de revisión eléctrica y formatos admitidos para videos. Los proyectos compartidos vinculan hasta 12 cuentas de alumnos y 5 profesores habilitados; la demostración local conserva participantes ficticios por nombre. Por ahora las imágenes y videos compartidos usan enlaces HTTPS a contenido ya alojado. No inventar capacidades eléctricas ni presentar el prototipo como sistema terminado.
