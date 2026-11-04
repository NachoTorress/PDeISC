# Diccionario del DFD

Frontera: Frontend web + APK Android + API ExpoTec. La misma persona puede actuar con varios perfiles. Los almacenes D1–D6 son agrupaciones lógicas de tablas, no bases separadas. D7 conserva archivos.

## Almacenes

| Código | Nombre | Tablas / soporte |
| --- | --- | --- |
| D1 | Cuentas, permisos y sesiones | `users`, `roles`, `user_roles`, `sessions`, `refresh_tokens`, `auth_rate_limits`, `social_providers`, `social_identities`, `social_flows`, `password_resets` |
| D2 | Espacios y puestos | `spaces`, `furniture`, `booths` |
| D3 | Proyectos y asignación de puestos | `projects`, `project_members`, `project_teachers`, `subjects`, `project_subjects`, `project_reviews`, `booth_allocations` |
| D4 | Inventario, pedidos y reservas | `resources`, `project_resource_requests`, `resource_allocations`, `resource_conditions`, `inventory_events`, `inventory_condition_events` |
| D5 | Préstamos y devoluciones | `loans`, `loan_returns` |
| D6 | Galería y metadatos de cargas | `gallery_photos`, `gallery_reviews`, `image_uploads` |
| D7 | Archivos de imágenes | `Vercel Blob privado` |

## Flujos del nivel 1

| Flujo | Origen | Destino | Datos |
| --- | --- | --- | --- |
| B01 | E1 | P7 | Solicitudes de espacios, proyectos, galería o TV |
| B02 | P7 | E1 | Planos y contenido publicado |
| B03 | E2 | P1 | Datos de registro, credenciales, renovación o recuperación |
| B04 | P1 | E2 | Sesión, perfil y resultado de acceso o recuperación |
| B05 | E2 | P3 | Consulta, propuesta, corrección o cancelación propia |
| B06 | P3 | E2 | Expediente, estado y observaciones de su proyecto |
| B07 | E3 | P3 | Consulta o dictamen de revisión, motivo y versión |
| B08 | P3 | E3 | Expedientes asignados y resultados de revisión |
| B09 | E4 | P5 | Datos de entrega, devolución o novedad |
| B10 | P5 | E4 | Préstamos, saldos e historial de movimientos |
| B11 | E5 | P1 | Consulta de usuarios y cambios de roles o estado |
| B12 | P1 | E5 | Cuentas y resultado de gestión de permisos |
| B13 | E5 | P2 | Datos del plano, puestos y baja de espacio |
| B14 | P2 | E5 | Plano, versión y resultado de gestión |
| B15 | E5 | P4 | Cambios de existencias y condición |
| B16 | P4 | E5 | Inventario, disponibilidad e historial |
| B17 | E5 | P6 | Dictamen de moderación o eliminación |
| B18 | P6 | E5 | Fotos por estado y resultado de moderación |
| B19 | E5 | P3 | Consulta, reapertura o cancelación administrativa |
| B20 | P3 | E5 | Expediente y resultado administrativo |
| B21 | E2 | P6 | Imagen, metadatos y aporte de galería |
| B22 | P6 | E2 | Permiso de carga, URL y estado de aportes |
| B23 | P1 | E6 | Solicitud de autenticación e intercambio OAuth |
| B24 | E6 | P1 | Prueba de identidad y perfil del proveedor |
| B25 | P1 | E7 | Mensajes de recuperación o cambio de contraseña |
| B26 | E7 | P1 | Resultado del envío SMTP |
| B27 | E2 | P4 | Consulta de catálogo o inventario según permiso |
| B28 | P4 | E2 | Catálogo o detalle de inventario permitido |
| S01 | D1 | P1 | Cuentas, permisos, sesiones y flujos de acceso |
| S02 | P1 | D1 | Altas, sesiones, permisos y tokens invalidados |
| S03 | D1 | P2 | Identidad y permiso de administración |
| S04 | D2 | P2 | Planos, puestos y versiones actuales |
| S05 | P2 | D2 | Espacios, mobiliario y puestos actualizados |
| S06 | D3 | P2 | Referencias de propuestas y ocupación de puestos |
| S07 | D1 | P3 | Cuentas activas y roles de participantes |
| S08 | D2 | P3 | Puestos habilitados y espacios activos |
| S09 | D3 | P3 | Expedientes, versiones y asignaciones vigentes |
| S10 | P3 | D3 | Propuestas, relaciones, dictámenes y asignaciones |
| S11 | D4 | P3 | Catálogo, pedidos, stock y reservas |
| S12 | P3 | D4 | Pedidos y reservas actualizados |
| S13 | D5 | P3 | Saldos de unidades sin devolver |
| S14 | D1 | P4 | Identidad y permisos de inventario |
| S15 | D4 | P4 | Catálogo, existencias, condición e historial |
| S16 | P4 | D4 | Existencias, condición y eventos de inventario |
| S17 | D1 | P5 | Operador y alumno destinatario activos |
| S18 | D3 | P5 | Proyectos confirmados y sus integrantes |
| S19 | D4 | P5 | Reservas, existencias y unidades no utilizables |
| S20 | P5 | D4 | Condiciones y eventos por daño |
| S21 | D5 | P5 | Entregas previas, saldos y versiones |
| S22 | P5 | D5 | Entregas, devoluciones y novedades |
| S23 | D1 | P6 | Autor activo y permisos de moderación |
| S24 | D6 | P6 | Cargas, aportes y revisiones actuales |
| S25 | P6 | D6 | Metadatos de cargas, aportes y moderaciones |
| S26 | D7 | P6 | Bytes de imágenes cargadas |
| S27 | P6 | D7 | Archivo original temporal y JPEG optimizado |
| S28 | D2 | P7 | Planos y puestos consultables |
| S29 | D3 | P7 | Proyectos confirmados y datos públicos |
| S30 | D6 | P7 | Fotos aprobadas y referencias de imagen |
| S31 | D7 | P7 | Bytes JPEG con publicación permitida |

## Balance entre niveles

El contexto agrupa B01–B28 por entidad y dirección. El nivel 1 conserva los 28 intercambios. La descomposición de 3.0 conserva exactamente B05–B08, B19–B20 y S07–S13; un mismo flujo agregado puede descomponerse en más de una lectura/escritura. I31–I35 son intercambios internos entre subprocesos. El generador verifica estos conjuntos y que cada flecha pase por al menos un proceso.

Las flechas representan datos; no significan secuencia temporal, llamadas de navegación ni decisiones sí/no. La validación, permisos y transacciones se aplican dentro de los procesos. La demostración local queda fuera del DFD compartido: su persistencia no alimenta TiDB.
