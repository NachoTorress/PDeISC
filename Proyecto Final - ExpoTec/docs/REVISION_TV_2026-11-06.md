# Presentación TV: visor de exposición

## Cambio de recorrido

La página inicial prepara la muestra: enumera los proyectos confirmados y permite elegir duración y sonido. **Iniciar presentación** abre un visor independiente, solicita pantalla completa desde el mismo clic y comienza por el primer proyecto. El visor cubre la navegación también cuando el navegador no admite ocultar su propia barra.

Las diapositivas usan un fondo oscuro, imagen o video sin recortes, título grande, descripción, equipo y ubicación. La composición se adapta a pantallas horizontales y verticales. Los datos secundarios y la cantidad de líneas se ajustan a la altura disponible.

Los controles se ocultan tras 3,5 segundos sin interacción y reaparecen al mover el mouse o tocar la pantalla. Se mantienen visibles durante la pausa, ante un mensaje y al recibir foco de teclado. Flechas: anterior/siguiente; espacio: pausa/reanudación; Esc o Salir: regreso a la preparación. Cerrar el visor detiene el avance y sale de pantalla completa. La demostración usa el mismo visor.

Si un video falla, la secuencia continúa con imagen y datos; si también falta la imagen, conserva la ficha. Un bloqueo del sonido permite reanudar sin sonido. Un error al actualizar los proyectos detiene el visor y vuelve a la preparación para reintentar.

## Verificación

- Navegador Edge con perfil temporal, exportación local y respuestas ficticias de API, sin acceso a la base de producción.
- Recorrido completo a 1920×1080, 1366×768, 390×844 y 844×390: pantalla completa real, inicio inmediato, ocultamiento de controles, avance automático, flechas, pausa sin avance, reanudación y salida por botón y Escape.
- Casos de muestra vacía, error de consulta, imagen/video faltantes, rechazo de pantalla completa, textos extensos en pantalla baja y presentación de la demostración.
- Tres pruebas unitarias de carga paginada y selección; revisión de tipos, análisis de código y exportaciones web y Android correctas.

Regresión reproducible: `frontend/native/scripts/check-presentation.cjs`, disponible mediante `npm run test:presentation`. Requiere servir primero la exportación web en localhost (por defecto puerto 8097), Playwright y un navegador. `DESIGN_BASE_URL`, `PLAYWRIGHT_MODULE` y `BROWSER_EXECUTABLE` permiten seleccionar las herramientas del entorno. Las capturas e informes quedan en `artifacts/visual-review/tv/`, excluido de Git.

La exportación Android verifica el empaquetado; no genera un instalador. La APK 0.5.4 descargada previamente conserva su contenido anterior. El cambio requiere otra compilación para distribuirse en APK. No se probaron una instalación Android ni un televisor físico en esta revisión.
