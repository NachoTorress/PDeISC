# Interfaz ExpoTec · octubre de 2026

## Contrato visual

Herramienta escolar para recorrer la exposición, presentar proyectos y gestionar espacios y recursos. La prioridad es reconocer la sección, encontrar la acción principal y comparar fichas sin que la longitud de sus nombres desordene la pantalla.

Lectura de diseño: aplicación educativa de uso público y operativo, con lenguaje cercano y color funcional. ENERGY 2 / RHYTHM 2 / MOTION 1. La dirección responde al pedido de más color y controles estandarizados.

- Petróleo en la navegación: mantiene reconocible la estructura y separa el recorrido del contenido.
- Verde para acciones y selección; azul para proyectos y recursos; ámbar para fotos y préstamos. Los estados conservan sus etiquetas además del color.
- Superficies claras con texto azul oscuro; la versión oscura mantiene los mismos roles, con tintes legibles.
- Tipografía del sistema: conserva buena lectura en web y Android sin descargar fuentes.
- Botones y campos de al menos 48 puntos, radio de 10 y separación de 8; los controles de icono conservan al menos 44. Las acciones de una misma fila se reparten el ancho y se apilan cuando falta espacio.
- Tarjetas con radio de 16, margen interior de 20 y grillas con separación de 16. Las fichas de una fila se estiran a la misma altura; el pie de acciones utiliza el espacio restante.
- La cantidad de columnas depende del ancho disponible, no de cuántos resultados hay. Un único resultado conserva el ancho de una columna.
- Fotografías contenidas en marcos uniformes en las listas, sin recortar su contenido. Las fichas de detalle conservan la proporción original.
- El plano, las fotografías y el icono existentes son los recursos gráficos del producto. No se agregan imágenes decorativas ni nuevos servicios de generación.
- Una cabecera de sección con fondo de color sustituye la duplicación de títulos entre la barra de navegación y el contenido. Las fichas y formularios de detalle conservan el retroceso.

Objetivos de revisión: 320×812, 390×844, 768×1024, 1024×900 y 1440×1000. Menú lateral permanente desde 1200; en anchos menores se mantiene el panel móvil. No debe haber desbordes horizontales, acciones recortadas ni saltos de ancho al seleccionar filtros.

## Referencias consultadas

- [GOV.UK, botones](https://design-system.service.gov.uk/components/button/): acción principal identificable y etiquetas concretas.
- [USWDS, grupos de botones](https://designsystem.digital.gov/components/button-group/): agrupación de acciones relacionadas y adaptación al ancho disponible.
- [Department for Education, sistema de diseño](https://design.education.gov.uk/design-system): componentes y patrones compartidos entre servicios educativos.
- `frontend/web`, `DESIGN.md` y recursos gráficos de ExpoTec: navegación, plano y recorridos del producto existente. Se conservan las funciones de Expo, sin copiar la identidad de las referencias externas.

## Skills y herramientas

Anti Slop (core, UI y mobile), ECC Frontend Design Direction y Agent Skills (Frontend UI Engineering y Browser Testing). Se revisó AI Graphic Design: su flujo genera artefactos gráficos independientes en Superdesign y no corresponde a la implementación de esta aplicación. Se reutilizan los recursos del repositorio.

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
