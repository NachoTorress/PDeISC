# Revisión de dependencias

Revisión del hito 7G, 19/10/2026, mediante `npm audit --json` contra los lockfiles existentes. Este hito no agrega paquetes ni cambia sus versiones.

Backend: cero avisos. Frontend: 22 avisos existentes (15 altos y 7 moderados, ninguno crítico), incluyendo los paquetes que heredan la gravedad de dependencias transitivas. Las causas directas reportadas son `braces`, `node-forge` y `uuid`.

| Cadena | Alcance observado | Decisión |
| --- | --- | --- |
| Metro → micromatch → braces | Procesamiento de patrones de archivos en las herramientas locales y de exportación. La presentación no recibe patrones de usuarios ni ejecuta Metro en producción; Vercel sirve la exportación estática. | Mantener el SDK 57 acordado y revisar una actualización compatible antes del siguiente cambio de herramientas o Android. No usar patrones no confiables en estas tareas. |
| Expo CLI / certificados → node-forge | Verificación criptográfica de las herramientas de Expo. La nueva consulta y el reproductor web no usan esa verificación ni habilitan actualizaciones remotas firmadas. | Revisar la cadena antes de firmar, compilar o distribuir Android. No dar por verificada esa etapa con esta publicación web. |
| xcode → uuid | Herramientas de proyectos nativos y funciones UUID afectadas cuando reciben un búfer externo. No forman parte del flujo TV publicado. | Revisar con la preparación nativa, que permanece postergada por indicación del usuario. |

Los avisos no se consideran solucionados. Se difiere la actualización de esta cadena porque la corrección automática propone cambios mayores incompatibles —incluida una bajada a Expo 44 y React Native 0.72— y no corresponde aplicarla sin probar compatibilidad. Revisar antes de retomar Android o, como máximo, el 02/11/2026. Los scripts de exportación usan archivos del repositorio; la API nueva no procesa archivos ni descarga los enlaces multimedia desde el servidor.

Referencias reportadas por el registro: [braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [uuid](https://github.com/advisories/GHSA-w5hq-g745-h8pq). Los resultados corresponden a la fecha de revisión, no a una garantía futura.
