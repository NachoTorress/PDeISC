# Flujos de ExpoTec

Para recorrer los once flujos, abrir con doble clic [flujo-completo.html](flujo-completo.html) y elegir la sección en el selector. La página incluye sus datos y estilos; funciona sin servidor ni conexión a Internet. La [guía de funcionamiento completo](../FUNCIONAMIENTO_COMPLETO.md) desarrolla las explicaciones. El original [flujo-completo.drawio](flujo-completo.drawio) contiene once páginas editables; abrirlo con draw.io/diagrams.net y elegir el recorrido desde las pestañas inferiores.

| Página | Qué explica | Vista vectorial |
| --- | --- | --- |
| 1. Estructura general | Web, APK, API, TiDB, Blob e identidad/correo. | [SVG](flujo-general.svg) |
| 2. Del botón a la base | Pantalla, hook, sesión, validación, reglas y transacción. | [SVG](flujo-peticion.svg) |
| 3. Acceso y sesión | Correo o acceso social, tokens y diferencias web/Android. | [SVG](flujo-sesion.svg) |
| 4. Ciclo del proyecto | Propuesta, cambios, confirmación, publicación y reapertura. | [SVG](flujo-proyectos.svg) |
| 5. Espacios e inventario | Planos, puestos, catálogo y reservas. | [SVG](flujo-espacios.svg) |
| 6. Entregas y devoluciones | Jornada, retiro, retorno parcial, daños e historial. | [SVG](flujo-prestamos.svg) |
| 7. Archivo y foto publicada | Carga directa, enlace, aporte, moderación y eliminación. | [SVG](flujo-fotos.svg) |
| 8. Presentación TV | Consulta pública, reproducción y actualización. | [SVG](flujo-tv.svg) |
| 9. Código, web y APK | Publicación en Vercel y construcción/distribución Android. | [SVG](flujo-publicacion.svg) |
| 10. Demostración local | Perfil ficticio y persistencia separada en cada dispositivo. | [SVG](flujo-demo.svg) |
| 11. Relaciones de los datos | Identidad, proyectos, lugares, fotos y movimientos. | [SVG](flujo-datos.svg) |

## Fuentes y regeneración

Las vistas reflejan el código revisado el 3 de noviembre de 2026. Cada nodo del original draw.io conserva `data-source` con su archivo de referencia. La guía desarrolla los permisos, casos de error y restricciones que se simplifican en los dibujos. No son una extracción exhaustiva de tablas ni una comprobación nueva de infraestructura.

El modelo de los recorridos está en [flujo-completo.json](flujo-completo.json). Se genera junto con la página HTML, draw.io y los SVG mediante:

```powershell
python docs/scripts/build_system_flow.py
```

El generador comprueba identificadores, extremos de las conexiones y existencia de todos los archivos de referencia. Para mantener estos artefactos generados, editar las definiciones de `docs/scripts/build_system_flow.py` y regenerar. Las plantillas internas tienen extensión `.html.in`; el archivo anterior `docs/scripts/system_flow_fragment.html` redirige a la página completa. Un cambio manual del `.drawio` debe conservarse en una copia con otro nombre para que una regeneración no lo reemplace.

Se usaron Graphify para orientar la lectura del código y drawio-skill para el original editable y la validación estructural. La validación del documento actual informó once páginas, 77 nodos de recorrido y 80 conexiones, sin errores ni advertencias de geometría. Las vueltas de corrección, respuesta y actualización son intencionales.

La aplicación de escritorio de draw.io no está instalada. Los SVG se producen localmente con las mismas posiciones y rutas que el original editable; no son exportaciones del renderizador nativo de draw.io. No se enviaron los diagramas a un visor externo.

## Diagramas de la revisión anterior

Se conserva [sistema-expotec.drawio](sistema-expotec.drawio), con sus cuatro vistas y exportaciones: [arquitectura](arquitectura.svg), [proyectos](proyectos.svg), [préstamos](prestamos.svg) y [TV](presentacion-tv.svg). Ese conjunto es histórico: su arquitectura todavía marcaba Android como pendiente. Para el estado actual de web y APK, usar el flujo completo y la guía enlazados arriba.
