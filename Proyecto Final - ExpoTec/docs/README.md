# Documentación de ExpoTec

Documentación de referencia de la versión 0.5.0, actualizada el 26 de octubre de 2026.

## Documentos para la entrega

| Documento | Fuente editable | PDF |
| --- | --- | --- |
| Manual de usuario | [Leer y editar](MANUAL_USUARIO.md) | [Abrir PDF](../output/pdf/ExpoTec_MANUAL_USUARIO.pdf) |
| Guía de instalación y configuración | [Leer y editar](GUIA_INSTALACION.md) | [Abrir PDF](../output/pdf/ExpoTec_GUIA_INSTALACION.pdf) |
| Guía de demostración para la exposición | [Leer y editar](GUIA_DEMOSTRACION.md) | [Abrir PDF](../output/pdf/ExpoTec_GUIA_DEMOSTRACION.pdf) |
| Documentación de la API | [README del backend](../backend/README.md) | Se mantiene en README según la consigna. |

Los tres documentos usan hoja A4, márgenes de 2,54 cm, Arial 11, interlineado 1,5 y texto justificado, todo en blanco y negro. La portada va centrada e identifica proyecto, escuela, versión y fecha. Cada página lleva en el encabezado el título del documento y el número de página. Los títulos se numeran por nivel (1, 1.1, 1.1.1) y el índice tiene enlaces a cada sección. Las tablas siguen APA: «Tabla N» en negrita, la descripción en cursiva y solo líneas horizontales; las imágenes usan el mismo rótulo con «Imagen N» y se imprimen en escala de grises.

Las capturas del manual están en `capturas/` y se regeneran con `npm run capture:manual` desde `frontend/native` (con la exportación web local en ejecución; usa datos de ejemplo, sin conectarse a producción). Los archivos Markdown son las fuentes mantenidas en el repositorio.

## Recorrido recomendado para evaluar

1. Leer el manual para conocer las tareas por perfil.
2. Seguir la guía de demostración para mostrar los cinco perfiles con datos locales.
3. Mostrar el acceso real y una consulta compartida para completar la evidencia de API y base de datos.
4. Usar la guía de instalación y el README del backend para revisar configuración y contratos.

La demostración no acredita por sí sola llamadas al backend ni permisos del servidor. En particular, su formulario local de proyectos y la carga compartida de cuatro pasos tienen recorridos distintos, explicados en los manuales.

## APK

La compilación disponible y sus verificaciones están en [APK de prueba](APK_PRUEBA.md). La API 0.5.0 mantiene compatibilidad con la APK 0.4.0 instalada.

## Documentación técnica y evidencia

- [Despliegue](DESPLIEGUE.md).
- [Accesos sociales](ACCESOS_SOCIALES.md) y [Google Android](ANDROID_GOOGLE.md).
- [Recuperación de contraseña](RECUPERACION_CONTRASENA.md).
- [Carga de fotos](CARGA_FOTOS.md).
- [Revisión funcional web del 22 de octubre](PRUEBAS_FINALES.md).
- [Diagramas del sistema](diagramas/README.md).
- [Requisitos y decisiones](REQUISITOS.md).

Los documentos por hito conservan resultados y pendientes históricos de su fecha. Para el uso actual, tomar primero los manuales y las notas de estado actualizadas, sin interpretar una comprobación histórica como una nueva ejecución.

## Regenerar los PDF

Desde la carpeta de ExpoTec, ejecutar con Python 3 y `reportlab` disponible:

```powershell
python docs/scripts/export_manuals.py
```

El exportador lee `MANUAL_USUARIO.md`, `GUIA_INSTALACION.md` y `GUIA_DEMOSTRACION.md`, usa Arial de `C:/Windows/Fonts` (o Liberation Sans, de métricas equivalentes, si no la encuentra) y escribe en `output/pdf`. Se puede indicar `--font-dir` y `--output-dir`. En los Markdown, una línea `Tabla: descripción` justo antes de una tabla define su rótulo, e `![descripción](ruta.png)` inserta una imagen numerada. Después de cambiar contenido o formato, regenerar y revisar visualmente todas las páginas antes de distribuir los PDF. Estas dependencias son solo de documentación y no forman parte de la app.
