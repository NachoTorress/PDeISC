# Correcciones de Android 0.3.1

Esta versión corrige la carga de fotos, la edición de mobiliario en teléfono y el espacio superior duplicado en los títulos. Conserva cuentas, permisos, datos guardados y distribución pública de los espacios.

## Fotos

El error «función undefined» se reprodujo usando `abort-controller/dist/abort-controller`, el mismo paquete que instala React Native: `signal.throwIfAborted` no existe allí. La comprobación de cancelación ahora consulta `signal.aborted`. La regresión recorre preparación, envío y confirmación con ese AbortController, además de cancelación y limpieza del archivo temporal.

Android prepara un JPEG de hasta 1600 píxeles con `expo-image-manipulator` y transmite su URI local. La interfaz diferencia optimización, subida y guardado, permite reintentar y cancela las cargas en curso. Sólo la confirmación de fotos dispone de un límite de 60 segundos. El backend conserva la validación y la aprobación antes del acceso público. [Flujo y configuración](CARGA_FOTOS.md).

## Editor móvil y cabeceras

El contorno anterior imponía un mínimo de 80 × 80 puntos y desplazaba su centro para alojar los tiradores. Ahora coincide con la geometría y el centro de la pieza girada.

En ventanas de menos de 900 puntos, las flechas recorren todas las piezas sin apuntar a elementos pequeños. El panel ofrece giros de −15°, +15° y +90°, ángulo exacto y botones de ancho/fondo. Los tiradores permanecen en escritorio. Al editar se retiran cabeceras y selectores repetidos, se compacta sólo el plano de edición y las propiedades de la pieza aparecen primero. La consulta pública conserva sus dimensiones anteriores.

La cabecera global ya ocupaba el margen superior seguro, pero el navegador interior volvía a reservarlo sobre «Proyecto compartido». El contexto interior usa `top: 0`, conservando los márgenes inferior y laterales. La barra global móvil mide al menos 64 puntos.

## Verificación

- TypeScript, ESLint y las 109 pruebas de frontend pasaron.
- Las exportaciones web y Android con Hermes terminaron correctamente.
- La integración real de fotos pasó con TiDB de pruebas y Blob privado: JPEG sintético, transporte del cliente Android, procesamiento, propiedad, vista previa, aprobación, retiro y limpieza.
- `scripts/check-mobile-fixes.cjs` pasó 70 comprobaciones y generó 16 capturas, sin errores de JavaScript. Cubre editor compartido y demostración a 320, 390, 768 y 1440 puntos: selección, contorno, giro exacto y rápido, tamaño, arrastre, guardar y descartar conservando metadatos y puestos. No escribe en producción.
- Evidencia local excluida de Git: `artifacts/mobile-fixes/evidence.json` y `artifacts/android/photo-validation-0.3.1.json`.
- Producción: despliegue `dpl_431J5B7Bv8XGcJaw8D3p6q7AHtcX`, desde `82a8beb4`, publicado correctamente. La consulta de un proyecto público y la selección/giro del editor de demostración pasaron en 390 puntos y modo oscuro, sin errores de JavaScript ni escrituras externas. Evidencia en `artifacts/mobile-fixes/production-evidence.json`.
- APK 0.3.1/4 terminada y descargada: manifiesto, integridad ZIP, digest y firma v2 verificados. El certificado coincide con la APK 0.3.0 anterior. [Descarga e identificación](APK_PRUEBA.md).

Las pruebas del navegador, la integración y la inspección del SDK no sustituyen la selección de una foto y los gestos desde una APK instalada. No se ejecutó un dispositivo ni un emulador Android en este entorno. La identificación y descarga del archivo final se registran en [APK de prueba](APK_PRUEBA.md).
