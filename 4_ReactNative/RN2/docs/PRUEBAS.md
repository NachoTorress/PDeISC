# Matriz de verificación

## Comprobaciones automáticas

Ejecutar `npm run check`, `npm run doctor` y `npm run build:web`. Las pruebas de `tests/` cubren validación y fechas. Las verificaciones concretas de esta entrega se registran en `docs/ESTADO_ENTREGA.md`.

## Pruebas manuales de aceptación en teléfono físico

Estas pruebas requieren hardware real. Esta lista es una guía de aceptación y **no equivale a afirmar que fueron ejecutadas**.

| Caso | Procedimiento | Resultado esperado |
| --- | --- | --- |
| Primera apertura | Abrir la app sin permisos | Se muestra el inicio; no se piden permisos anticipados. |
| Temas | Cambiar tema, cerrar y volver a abrir | Preferencia conservada y textos legibles en ambos temas. |
| Cámara denegada | Denegar permiso; volver a abrir | Explicación y acción de recuperación; sin pantalla bloqueada. |
| Foto | Capturar y guardar con ambas cámaras | Foto permanente y registro visible al reiniciar. |
| Cámara ocupada | Usar cámara en otra app | Error y opción de reintentar. |
| Escaneo | Enfocar QR y EAN válido | Una única lectura; contenido visible; no abre enlaces. |
| Nuevo escaneo | Pulsar Leer otro código | La cámara vuelve a detectar. |
| GPS | Permitir ubicación y esperar | Coordenadas reales, precisión y hora. |
| GPS apagado | Desactivar GPS e iniciar | Mensaje que solicita activar ubicación. |
| GPS sin señal | Iniciar sin posición disponible | Mensaje de espera, cancelación y error al agotar el tiempo. |
| Acelerómetro | Iniciar y mover teléfono | Tres ejes y gráfico con datos reales en g. |
| Giroscopio | Iniciar y girar teléfono | Tres ejes y gráfico con datos reales en rad/s. |
| Segundo plano | Minimizar con cámara, GPS o sensores | Recursos y suscripciones liberados; regreso permite iniciar otra vez. |
| Biometría correcta | Autenticar con huella o rostro registrado | Resultado confirmado y guardable una sola vez. |
| Biometría cancelada | Cancelar el diálogo nativo | Mensaje y posibilidad de reintentar. |
| Sin biometría | Probar sin hardware o sin inscripción | Estado real y explicación para configurar o cambiar dispositivo. |
| Alta | Guardar un resultado | Registro nuevo con fecha DD/MM/AA; botón de guardar oculto tras éxito. |
| Edición inválida | Borrar título, ingresar 2 o más de 60 caracteres | Borde rojo y explicación inmediata; guardado deshabilitado. |
| Notas inválidas | Ingresar más de 400 caracteres | Error visible mientras se escribe. |
| Edición válida | Cambiar título y guardar | Se conserva fecha original y aparece fecha de edición. |
| Cancelar edición | Modificar y cancelar | Se conserva el registro original. |
| Eliminar cancelado | Eliminar y Conservar registro | Confirmación dentro de tarjeta; datos conservados. |
| Eliminar confirmado | Eliminar y Sí, eliminar | Registro y foto propia eliminados. |
| Búsqueda y filtros | Combinar búsqueda y tipo | Solo coincidencias; limpieza de filtros funcional. |
| Persistencia | Cerrar y abrir app | Registros y fotos disponibles. |
| Poco almacenamiento | Guardar con espacio agotado | Error visible; registros previos conservados. |
| Escritorio y móvil | Abrir web a 1440 px y 390 px | Uso del ancho, navegación adaptada y sin desbordes horizontales. |
| Teclado | Editar con teclado virtual | Campos accesibles y desplazamiento disponible. |
| Accesibilidad | Usar lector de pantalla y fuente grande | Controles con nombre, estados y errores comprensibles. |
| APK independiente | Instalar APK y cerrar Metro | La app inicia y funciona sin servidor de desarrollo. |
