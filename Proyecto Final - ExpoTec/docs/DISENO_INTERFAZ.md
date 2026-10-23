# Interfaz ExpoTec · octubre de 2026

## Contrato visual

Herramienta escolar para recorrer la exposición, presentar proyectos y gestionar espacios y recursos. La prioridad es reconocer la sección, encontrar la acción principal y comparar fichas sin que la longitud de sus nombres desordene la pantalla.

Lectura de diseño: aplicación educativa de uso público y operativo, con lenguaje cercano y color funcional. ENERGY 2 / RHYTHM 2 / MOTION 1. La dirección responde al pedido de más color y controles estandarizados.

- Azul profundo en la navegación: mantiene reconocible la estructura y separa el recorrido del contenido.
- Azul para acciones y selección; naranja para fotos, préstamos y el destino activo. El verde queda reservado a estados exitosos. Los estados conservan sus etiquetas además del color.
- Superficies claras con texto azul oscuro; el modo oscuro usa carbón y grafito en fondo, tarjetas, cabeceras y navegación. El azul queda en acciones y selecciones, con naranja y verde para estados concretos.
- Tipografía del sistema: conserva buena lectura en web y Android sin descargar fuentes.
- Botones y campos de al menos 44 puntos, radio de 10 y separación de 8. Los filtros conservan anchos iguales; las acciones de fichas comparten el ancho de su fila con un máximo de 144 puntos por botón y se apilan cuando falta espacio. Los botones de Android amplían dos puntos su área táctil a cada lado.
- Tarjetas con radio de 12, margen interior de 16 y grillas con separación de 16. Las fichas de una fila se estiran a la misma altura; el pie de acciones utiliza el espacio restante.
- Las grillas se dividen en filas explícitas y celdas flexibles: el redondeo de anchos fraccionales no puede hacer perder una columna. Inventario admite hasta cuatro columnas desde 280 puntos por ficha; proyectos, desde 300. Las listas cortas aprovechan el ancho disponible.
- Usuarios usa filas de ancho completo: identidad, correo y permisos juntos, con la acción a la derecha desde 660 puntos de ancho útil. En móvil la acción baja sin recortar el correo.
- Los proyectos sin imagen muestran un icono de categoría de 40 puntos junto al título. Las fotos reales usan un marco contenido de 132 puntos de alto; el detalle conserva su proporción original y la descripción completa.
- El plano, las fotografías y el icono existentes son los recursos gráficos del producto. No se agregan imágenes decorativas ni nuevos servicios de generación.
- Una cabecera de sección con fondo de color sustituye la duplicación de títulos entre la barra de navegación y el contenido. Las fichas y formularios de detalle conservan el retroceso.
- Los selectores sólo forman filas completas: tres opciones se muestran en una fila o en una columna, nunca como dos más una. Jornada y vista de préstamos utilizan todo el ancho del bloque, con la ayuda y la búsqueda debajo.

Corrección solicitada después de la primera revisión: se reemplazó la paleta petróleo/verde por azul profundo y naranja. El ensayo de navegador ahora comprueba explícitamente la alineación de ambos grupos de préstamos a 320, 390, 600, 768, 872, 1024 y 1440 píxeles; la captura del usuario sirve como caso de regresión.

La revisión posterior corrige el desperdicio de ancho y las fichas demasiado altas. Se comprueban además 1365, 1536 y 1691 píxeles, anchos fraccionales y zoom al 125 %, comparando el extremo derecho de cada fila con el área útil. La revisión del tema oscuro comprueba superficies neutrales además del contraste.

Objetivos de revisión: 320×812, 390×844, 768×1024, 1024×900 y 1440×1000. Menú lateral permanente desde 1200; en anchos menores se mantiene el panel móvil. No debe haber desbordes horizontales, acciones recortadas ni saltos de ancho al seleccionar filtros.

## Referencias consultadas

- [GOV.UK, botones](https://design-system.service.gov.uk/components/button/): acción principal identificable y etiquetas concretas.
- [USWDS, grupos de botones](https://designsystem.digital.gov/components/button-group/): agrupación de acciones relacionadas y adaptación al ancho disponible.
- [Department for Education, sistema de diseño](https://design.education.gov.uk/design-system): componentes y patrones compartidos entre servicios educativos.
- `frontend/web`, `DESIGN.md` y recursos gráficos de ExpoTec: navegación, plano y recorridos del producto existente. Se conservan las funciones de Expo, sin copiar la identidad de las referencias externas.
- Catálogo local de Awesome Design MD: `linear.app/DESIGN.md` para superficies carbón escalonadas y densidad de herramienta; `notion/DESIGN.md` para jerarquía tipográfica y separación neutral. Son análisis de referencia, no afirmaciones sobre el diseño actual de esos servicios.

## Skills y herramientas

Anti Slop (core, UI y mobile), ECC Frontend Design Direction, Agent Skills (Frontend UI Engineering y Browser Testing), Awesome Design MD y Sites para revisión e implementación local. Se conserva el despliegue existente en Vercel. Se revisó AI Graphic Design: su flujo genera artefactos gráficos independientes en Superdesign y no corresponde a la implementación de esta aplicación. Se reutilizan los recursos del repositorio.

La herramienta Chrome DevTools de ECC no encontró Chrome instalado. La revisión utiliza Playwright con Edge en un contexto aislado. Los casos con datos de prueba se identifican en el informe; no escriben en TiDB ni sustituyen datos de producción.

## Estados que deben conservarse

| Estado | Respuesta visible y siguiente acción |
| --- | --- |
| Carga | Indicador de actividad; actualizar deshabilitado mientras se consulta. |
| Vacío | Texto contextual; acceso a participar o cambiar filtros donde corresponde. |
| Error | Mensaje explícito y botón de actualización o reintento. |
| Parcial | Una imagen fallida conserva descripción; espacios advierte si conserva datos anteriores. |
| Éxito | Aviso contextual tras guardar, sin cambiar los permisos ni el modelo. |
| Permisos | Gestión restringida; visitantes pueden ingresar desde la pantalla. |
