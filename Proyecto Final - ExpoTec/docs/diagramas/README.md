# Cómo funciona ExpoTec

El archivo [sistema-expotec.drawio](sistema-expotec.drawio) contiene cuatro páginas editables. Abrirlo con draw.io/diagrams.net y elegir la página desde las pestañas inferiores. Cada forma, texto y conexión conserva su edición individual.

| Vista | Explica | Imagen | Vector |
| --- | --- | --- | --- |
| Arquitectura | Personas, web/TV, API, TiDB y Android pendiente | [PNG](arquitectura.png) | [SVG](arquitectura.svg) |
| Proyectos | Propuesta, cambios, confirmación conjunta de puesto/recursos y retirada | [PNG](proyectos.png) | [SVG](proyectos.svg) |
| Préstamos | Entrega, saldos entre jornadas, devoluciones, daños y reparación | [PNG](prestamos.png) | [SVG](prestamos.svg) |
| TV | Carga pública, fichas y videos, avance, actualización y recuperación | [PNG](presentacion-tv.png) | [SVG](presentacion-tv.svg) |

Las vistas se modelaron a partir del código y requisitos del repositorio: `frontend/native/src/app.tsx`, `SharedPresentationPage.tsx`, las rutas y repositorios del backend, las migraciones `001_auth.sql` a `005_loans.sql` y `docs/DESPLIEGUE.md`. Las referencias aparecen también al pie de cada página. No son una extracción automática exhaustiva de tablas ni un certificado de infraestructura en funcionamiento.

Se utilizó la skill drawio-skill para el documento XML y la validación estructural: cuatro páginas, identificadores únicos, geometrías y extremos válidos, sin advertencias de solapamiento ni rutas explícitas que atraviesen formas. Los ciclos de corrección, devolución parcial y reproducción son intencionales; el comprobador semántico genérico de dependencias los advierte porque no distingue estos flujos de una arquitectura de servicios. Títulos, leyendas y notas no son componentes que necesiten conexiones.

La aplicación de escritorio de draw.io no está instalada. Las vistas SVG se generaron localmente a partir de las formas, etiquetas y rutas del XML; los PNG son capturas de esas vistas. Se revisaron sus imágenes y la geometría del SVG. No se enviaron diagramas a un visor externo. Los PNG no contienen XML embebido: el original editable es el archivo `.drawio`.

La demostración conserva datos ficticios separados. El diagrama distingue Android/APK como pendiente y no incluye credenciales, correos de personas ni información del entorno privado.
