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

La interfaz actual es un prototipo migrado a componentes nativos para revisar los flujos y el diseño. Sus datos son ficticios y se guardan localmente en cada dispositivo; no se comparten entre equipos. La selección de una vista por perfil no es autenticación ni control de acceso real. Los equipos admiten varios integrantes y los proyectos informáticos admiten enlaces opcionales de GitHub y de su página.

El hito 7A incorpora por separado una API Express de cuentas, sesiones y permisos, con SQL para TiDB. El usuario confirmó el 14/10/2026 la base en TiDB y dos proyectos separados en Vercel para backend y frontend. La conexión de las pantallas, los datos de ExpoTec y los servicios externos sigue pendiente; los servicios todavía no se crearon.

## Operating Context

Alumnos presentan proyectos; uno de los profesores asignados los confirma. La confirmación ocupa el puesto. Los recursos físicos se entregan y devuelven cada día. Organización acomoda aulas y patio. Una televisión reproduce la presentación pública.

## Evidence on Hand

Consigna aportada por el usuario. No hay plano real, imágenes de proyectos, fechas de la exposición ni relevamiento eléctrico. Los espacios y proyectos del prototipo están identificados como datos de ejemplo.

## Open Decisions

Distribución real de la escuela, fechas, vinculación de integrantes con cuentas reales, proveedores sociales, hosting, criterios de revisión eléctrica y formatos admitidos para videos. Los proyectos admiten equipos de varios integrantes; el prototipo registra sus nombres y apellidos. No inventar capacidades eléctricas ni presentar el prototipo como sistema terminado.
