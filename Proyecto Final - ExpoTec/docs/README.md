# Documentación de ExpoTec

Documentación de referencia de la versión 0.4.0, actualizada el 25 de octubre de 2026.

## Documentos para la entrega

| Documento | Fuente editable | PDF |
| --- | --- | --- |
| Manual de usuario | [Leer y editar](MANUAL_USUARIO.md) | [Abrir PDF](../output/pdf/ExpoTec_MANUAL_USUARIO.pdf) |
| Guía de instalación y configuración | [Leer y editar](GUIA_INSTALACION.md) | [Abrir PDF](../output/pdf/ExpoTec_GUIA_INSTALACION.pdf) |
| Guía de demostración para la exposición | [Leer y editar](GUIA_DEMOSTRACION.md) | [Abrir PDF](../output/pdf/ExpoTec_GUIA_DEMOSTRACION.pdf) |
| Documentación de la API | [README del backend](../backend/README.md) | Se mantiene en README según la consigna. |

El manual usa márgenes de 2,54 cm, Arial de 11 puntos, interlineado doble en el cuerpo y páginas numeradas. La portada identifica el proyecto, documento, versión y fecha. Los datos académicos personales e institucionales pueden incorporarse al preparar la portada de presentación; no se inventaron autor, escuela, asignatura ni docente.

Las guías técnicas y de demostración usan interlineado más compacto para consultar pasos, tablas y comandos. Los tres PDF tienen contenido con números de página, enlaces y marcadores de navegación. Los archivos Markdown son las fuentes mantenidas en el repositorio.

## Recorrido recomendado para evaluar

1. Leer el manual para conocer las tareas por perfil.
2. Seguir la guía de demostración para mostrar los cinco perfiles con datos locales.
3. Mostrar el acceso real y una consulta compartida para completar la evidencia de API y base de datos.
4. Usar la guía de instalación y el README del backend para revisar configuración y contratos.

La demostración no acredita por sí sola llamadas al backend ni permisos del servidor. En particular, su formulario local de proyectos y la carga compartida de cuatro pasos tienen recorridos distintos, explicados en los manuales.

## Estado de las pruebas Android

El usuario confirmó el 25 de octubre de 2026 que la APK funciona bastante bien y que funciona el ingreso con Google nativo. Se registra como confirmación de uso del usuario. No se infieren modelo de teléfono, versión de Android ni prueba exhaustiva de todos los recorridos. Los detalles de compilación y la lista de comprobación están en [APK de prueba](APK_PRUEBA.md).

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

El exportador lee los tres Markdown, usa Arial de `C:/Windows/Fonts` y escribe en `output/pdf`. Otra instalación puede indicar `--font-dir` con los cuatro archivos de Arial y `--output-dir`. Después de cambiar contenido o formato, regenerar y revisar visualmente todas las páginas antes de distribuir los PDF. Estas dependencias son solo de documentación y no forman parte de la app.
