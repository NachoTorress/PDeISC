# Revisión funcional de ExpoTec

Fecha: 22 de octubre de 2026. Alcance: aplicación web.

## Resultado

El recorrido probado terminó correctamente. Se corrigieron los mensajes de carga de fotos: el botón distingue «Subiendo foto…» de «Enviando propuesta…», el aviso de foto faltante se oculta durante la carga y la validación permite entender que se puede elegir un archivo o ingresar un enlace HTTPS.

| Verificación | Resultado |
| --- | --- |
| Pruebas del backend | 55 aprobadas |
| Pruebas del frontend | 83 aprobadas |
| Integraciones con TiDB y Blob | 11 circuitos aprobados con la preparación indicada abajo |
| TypeScript y análisis del frontend | Sin errores |
| Exportación web | Correcta |
| API publicada | 6 consultas respondieron HTTP 200 |

La ejecución conjunta de integraciones aprobó 10 circuitos. El circuito de instalación rechazó correctamente la base de pruebas compartida porque contenía 32 tablas y exige una base vacía. Se volvió a ejecutar en una base nueva, creada exclusivamente para esa prueba: aprobó y la base se eliminó al finalizar. No se vació la base compartida.

## Recorrido en navegador

Se usaron seis cuentas ficticias, el backend real con una base TiDB temporal y cargas reales a Blob privado.

1. Un alumno ingresó, armó una propuesta con otro integrante y un docente, eligió puesto y dos elementos y subió una foto. La propuesta quedó pendiente, sin reservar stock y con la imagen protegida.
2. El docente asignado revisó y confirmó la propuesta. Se verificaron el puesto ocupado, las dos unidades reservadas y la ficha pública sin correos privados.
3. La responsable de préstamos entregó dos unidades. Registró una devolución parcial y luego la restante; el saldo y el historial coincidieron. Al consultar otra jornada se conservó la devolución pendiente de la primera.
4. Una invitada subió una foto con descripción. Quedó pendiente y fuera de la galería pública; su imagen tampoco podía consultarse públicamente.
5. Una administradora revisó y publicó esa foto. Recién entonces apareció en la galería pública y quedó habilitada su imagen pública.
6. Se revisaron la navegación según permisos, el menú de cuenta, el listado de usuarios y las validaciones de formularios vacíos.
7. En la web publicada se comprobó la presentación TV con dos proyectos: avance manual, inicio, avance automático y pausa.

Las comprobaciones de estado incluyeron consultas directas a la base temporal y solicitudes HTTP. El entorno local utilizó el origen HTTPS de la web para generar enlaces compatibles con la validación; las vistas privadas se cargaron mediante la API local y los permisos públicos de las imágenes se comprobaron directamente contra ese backend temporal.

## Pantallas y consola

Se revisaron escritorio a 1280 × 720 y móvil a 390 × 844. La galería móvil quedó dentro del ancho de pantalla, con la imagen completa y el menú accesible. No se observaron errores ni advertencias de consola en las comprobaciones finales de móvil y presentación TV.

- [Galería aprobada en escritorio](pruebas/2026-10-22/galeria-aprobada.png).
- [Galería en móvil](pruebas/2026-10-22/galeria-movil.png).
- [Préstamo devuelto](pruebas/2026-10-22/prestamo-devuelto.png).

## Integraciones y producción

Las integraciones cubrieron permisos y concurrencia, sesiones, recuperación de contraseña, vinculación social, espacios, propuestas, reservas, préstamos de tres jornadas, presentación pública, moderación y cargas privadas reales.

En producción se consultaron salud y conexión a base, proveedores sociales, disponibilidad de recuperación, proyectos públicos, galería pública y presentación: todas respondieron HTTP 200. Se anunciaron Google, Discord y GitHub, y la recuperación estaba habilitada. Las acciones de escritura del recorrido se realizaron únicamente en la base temporal.

Las cuatro cargas de imágenes del recorrido y su base temporal fueron retiradas al terminar. No se modificaron los datos de producción ni se enviaron correos a usuarios reales.

## Límites de esta revisión

El inicio real con los tres proveedores y la recepción del correo de recuperación ya habían sido confirmados por el usuario en la sesión anterior. Esta revisión comprobó su configuración publicada y sus circuitos automatizados; no repitió autorizaciones externas ni cambió contraseñas personales.

No se validaron reproducción audiovisual, pantalla completa en un televisor físico ni una APK. La versión Android queda pendiente de su propia preparación y pruebas; estos resultados corresponden a la web.
