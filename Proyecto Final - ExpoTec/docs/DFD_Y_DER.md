# ExpoTec: diagrama de flujo de datos y diagrama entidad–relación

Modelos revisados el 4 de noviembre de 2026. [Abrir el visor de DFD y DER](diagramas/modelos-datos.html). La página contiene los dibujos y funciona sin conexión. Permite elegir nivel o dominio, ampliar, desplazar y descargar el SVG de la vista actual.

## DFD lógico

Se utiliza notación Gane–Sarson: rectángulos para entidades externas, procesos numerados con verbo, almacenes abiertos y flechas rotuladas con los datos que circulan. No se representan decisiones sí/no, pasos de navegación ni una secuencia temporal de botones.

La frontera incluye el frontend web, la APK Android y la API de ExpoTec. Google/Discord/GitHub y SMTP son entidades externas. D1–D6 son agrupaciones lógicas de tablas de TiDB; D7 contiene los archivos de imágenes en Blob. La demostración local queda fuera del circuito de datos compartidos.

| Vista | Contenido | Archivo |
| --- | --- | --- |
| Contexto, nivel 0 | ExpoTec como proceso 0 y sus intercambios con siete entidades externas. | [SVG](diagramas/dfd-contexto.svg) |
| Nivel 1 | Siete procesos, siete almacenes y sus flujos con usuarios y servicios. | [SVG](diagramas/dfd-nivel-1.svg) |
| Nivel 2 de 3.0 | Validación de participantes, registro, expediente, revisión/confirmación y reapertura/cancelación. | [SVG](diagramas/dfd-proyectos.svg) |

El contexto agrupa los intercambios B01–B28 por entidad y dirección. El nivel 1 conserva esos 28 flujos de frontera. La descomposición de propuestas conserva los intercambios de 3.0 con las entidades y almacenes; los procesos 3.1–3.5 añaden flujos internos. El generador comprueba el balance entre niveles.

El [diccionario DFD](diagramas/DICCIONARIO_DFD.md) detalla cada B/S, sus extremos y los grupos de tablas. Una misma persona puede cumplir varios roles externos. Por ejemplo, administración puede iniciar sesión como persona registrada y realizar gestiones como administración.

La selección y subida directa de archivos desde el cliente forman parte de 6.0, junto con la autorización y el procesamiento del backend. Por eso el DFD no dibuja un acceso directo desde una entidad externa al almacén de archivos. Los permisos y las transacciones son reglas internas de los procesos, no flechas de control.

## DER físico

El modelo se deriva de las diez migraciones SQL y de la tabla `schema_migrations` creada por el motor de migraciones: **32 tablas, 169 atributos y 40 restricciones FK**. Se aplica también `ALTER TABLE social_flows ADD COLUMN binding_hash` de la migración 008. No se consultaron datos privados ni se modificó la base para producir estos diagramas.

Se utiliza pata de cuervo, acompañada por multiplicidades escritas en los extremos:

- `1`: exactamente un registro relacionado.
- `0..1`: relación opcional de máximo uno.
- `0..N`: relación opcional de muchos registros.
- `PK`: clave primaria; puede estar compuesta por varias columnas.
- `FK`: columna que participa en una clave foránea.
- `U1`, `U2`: grupo de columnas de una restricción UNIQUE. Una columna marcada U1 dentro de una clave compuesta no es necesariamente única por sí sola.
- `NULL`: columna que admite ausencia de valor.
- Línea continua: FK cuyos campos participan en la PK de la entidad hija; línea discontinua: relación no identificante.

La multiplicidad del extremo padre indica cuántos padres puede referenciar una fila hija. La del extremo hijo indica cuántas filas hijas permite un padre. La presencia de una FK NOT NULL obliga a una hija a tener padre, pero no obliga a que cada padre tenga hijas.

| Vista | Alcance |
| --- | --- |
| [General](diagramas/der-general.svg) | Las 32 entidades con PK, FK, grupos UNIQUE y cardinalidades. |
| [Físico completo](diagramas/der-completo.svg) | Las 32 entidades con sus 169 atributos, tipos y nulabilidad. |
| [Identidad](diagramas/der-identidad.svg) | Cuentas, roles, sesiones, renovación, proveedores, accesos y recuperación; incluye tablas técnicas independientes. |
| [Proyectos y espacios](diagramas/der-proyectos.svg) | Planos, mobiliario, puestos, equipos, materias, asignaciones y revisiones. |
| [Inventario y préstamos](diagramas/der-prestamos.svg) | Recursos, pedidos, reservas, entregas, devoluciones, daños e historial. |
| [Galería](diagramas/der-galeria.svg) | Autoría, aportes, revisiones y metadatos de cargas. |

Las vistas por dominio muestran las relaciones entre las tablas incluidas; el modelo completo conserva las restantes. El [diccionario DER](diagramas/DICCIONARIO_DER.md) enumera las 40 FK, las PK y la procedencia de cada entidad.

## Restricciones relevantes

1. `furniture` tiene PK compuesta `(space_id, code)`. `booths(space_id, furniture_code)` la referencia mediante una sola FK compuesta y tiene una restricción UNIQUE sobre ese par. Una pieza de mobiliario admite como máximo un registro de puesto.
2. `projects.requested_booth_id` admite varios pedidos sobre un mismo puesto. La asignación confirmada se representa con `booth_allocations`: `booth_id` es PK y `project_id` es UNIQUE. Cada puesto y cada proyecto admite como máximo una asignación confirmada.
3. `resource_allocations(project_id, resource_id)` referencia la PK compuesta de `project_resource_requests`. La reserva es una entidad distinta del pedido y existe como máximo una por par.
4. `loans` referencia por FK a `projects` y `resources`; el requisito de tener reserva se comprueba en código. Su UNIQUE `(project_id, resource_id, day)` impide dos entregas del mismo elemento al proyecto en la misma jornada.
5. `resource_conditions.resource_id` es PK y FK: un recurso puede tener cero o un registro de condición. `inventory_condition_events.event_id` aplica el mismo patrón al evento de inventario.
6. `inventory_condition_events.loan_return_id` es nullable. El SQL permite cero o una devolución por evento y cero o muchos eventos por devolución; no se agrega al DER una unicidad que el esquema no declara.
7. `projects.image_url` y `gallery_photos.image_url` no tienen FK hacia `image_uploads`. La propiedad y publicación se comprueban en el backend. Tampoco existe FK de `social_flows.email` a `users.email`.
8. `auth_rate_limits` y `schema_migrations` son independientes. No se inventan relaciones para conectarlas al resto del dibujo.

Estas diferencias permiten separar restricciones estructurales de reglas del programa, como reservar puesto y elementos en una transacción, exigir devolución antes de liberar reservas o conservar al último administrador activo.

## Editables y regeneración

- [DFD-ExpoTec.drawio](diagramas/DFD-ExpoTec.drawio): contexto, nivel 1 y detalle de propuestas.
- [DER-ExpoTec.drawio](diagramas/DER-ExpoTec.drawio): seis vistas del modelo relacional.
- [dfd-modelo.json](diagramas/dfd-modelo.json): procesos, almacenes, flujos y referencias entre niveles.
- [der-esquema.json](diagramas/der-esquema.json): atributos, PK, UNIQUE, FK, nulabilidad y procedencia.

El generador usa Node.js y una dependencia de diagramación instalada únicamente en la carpeta temporal del proyecto:

```powershell
npm install --prefix artifacts/system-map/model-tools --no-save --package-lock=false @viz-js/viz@3.31.0
node docs/scripts/build_data_models.mjs
```

La diagramación se realiza con Graphviz mediante [la API de Viz.js](https://viz-js.com/api/); el visor final incorpora los SVG y no necesita esa biblioteca ni Internet. Los editables conservan la geometría derivada del mismo modelo, con formas y atributos independientes. La aplicación de escritorio de draw.io no se utilizó para renderizar las imágenes.

Fuentes principales: `backend/sql/001_auth.sql` a `010_password_recovery.sql`, `backend/scripts/migrations.mjs`, `backend/src/routes/`, `backend/src/repositories/`, `backend/src/services/uploads.mjs`, `auth.mjs`, `social.mjs` y `recovery.mjs`. El modelo describe el esquema declarado en este repositorio, no una introspección del servidor TiDB.
