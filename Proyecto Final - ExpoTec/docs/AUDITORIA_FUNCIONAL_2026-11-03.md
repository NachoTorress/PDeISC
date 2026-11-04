# Auditoría funcional web — 3 de noviembre de 2026

Se revisaron los recorridos de acceso, propuestas y revisión de proyectos, galería, espacios, inventario, préstamos y permisos. La revisión combinó lectura de los cambios de estado, pruebas de validadores y uso real del navegador sobre la exportación web corregida.

## Fallas corregidas

| Recorrido | Falla | Corrección y evidencia |
| --- | --- | --- |
| Salir de una propuesta al cerrar sesión | El botón Volver quedaba bloqueado por la protección de un borrador que ya no podía mostrarse. | La protección exige el actor y el permiso actuales. Se reprodujo el bloqueo antes y se comprobó la navegación después. |
| Guardar un proyecto de demostración | Un intento fallido de reemplazar una imagen válida impedía guardar los demás cambios, aunque conservaba la imagen anterior. | Se permite guardar con la imagen válida y se explica que se conserva. Comprobado en navegador con un archivo que supera 2 MB, cambio de nombre y guardado exitoso. |
| Vista previa de foto por enlace | El botón rechazaba espacios exteriores o HTTPS en mayúsculas que el validador de envío aceptaba. | La vista previa usa el mismo validador que el envío. Comprobado en navegador con ambos casos en un mismo enlace. |
| Confirmar una revisión de proyecto | Se podía modificar el motivo después de abrir la confirmación y enviar un texto inválido. | El motivo queda fijo durante la confirmación y se valida otra vez antes de enviar. Comprobado en navegador: campo de solo lectura al confirmar y editable al cancelar. |
| Datos privados al cambiar permisos | El alcance de las consultas privadas identificaba la cuenta pero omitía sus roles, por lo que podía conservar una respuesta anterior. | El alcance incluye cuenta y roles, invalida la información anterior y vuelve a consultar. Revisión del código y comprobaciones de compilación; no se acredita una revocación dinámica de extremo a extremo en navegador. |
| Actualizar espacios con respuestas lentas | Una lista anterior podía reemplazar un resultado más reciente, incluso después de dar de baja un espacio. | Se descartan consultas superadas y se invalidan al editar o aceptar un guardado. Una respuesta demorada 12 segundos llegó después de la baja y no volvió a mostrar el espacio. |
| Descartar y recargar inventario | Un doble clic podía lanzar recargas duplicadas; una respuesta tardía podía reemplazar otro editor o aplicarse fuera del permiso vigente. | Se bloquean acciones durante la recarga y se verifica el contexto del editor. Doble clic comprobado con una consulta demorada: se registró una sola solicitud y el formulario se restauró. |
| Notas de inventario y préstamos | La longitud se comprobaba antes de normalizar Unicode. Ciertos textos aceptados excedían el límite al guardarse; se reprodujo un error 500 de base de datos. | Se normaliza antes de comprobar límites en app y API. El mismo caso devuelve 400 con error de campo; pruebas de expansión y contracción Unicode agregadas. |
| Nombres en el registro | Un nombre compuesto solo por marcas combinantes podía pasar la validación. | Se exige al menos una letra Unicode en app y API. Pruebas agregadas y mensajes de error comprobados en el registro web. |
| Reintento de acceso social | Si fallaba la consulta inicial del acceso pendiente, faltaba un botón para reintentar conservando el flujo. La confirmación de contraseña podía quedar desactualizada al cambiar la contraseña. | Se agregó el reintento de consulta y se recalcula la confirmación. Revisión del código, validadores y compilación; sin consentimiento real de proveedores durante esta auditoría. |

## Recorridos comprobados en navegador

- Acceso con campos vacíos y correo inválido; registro con nombre inválido, contraseña corta y confirmación diferente, sin crear una cuenta.
- Propuesta con cambios, cierre de sesión y salida mediante Volver.
- Galería con campos obligatorios vacíos, vista previa por enlace y descarte del aporte sin enviarlo.
- Revisión de proyecto: solicitud de cambios con motivo válido y comprobación de la nota fija durante la confirmación corregida.
- Baja de un espacio ficticio mientras existía una consulta anterior demorada.
- Inventario con cantidad fraccionaria, unidades fuera de servicio mayores al total y recarga mediante doble clic.
- Préstamos: entrega sin destinatario o elemento, cantidad superior a la reserva, entrega válida, devolución superior al saldo y dañadas superiores a las recibidas. La devolución válida dejó cero unidades pendientes.
- Búsqueda de una cuenta ficticia, editor de permisos sin ningún rol y descarte sin guardar. Menú, búsqueda y formulario comprobados a 390 × 844; sin desborde horizontal en esa pantalla.
- Proyecto de demostración con imagen válida, reemplazo demasiado grande y guardado de los demás cambios. La lista mostró el nombre actualizado y la imagen conservada.

La consola del navegador no registró advertencias ni errores durante la verificación final.

## Verificación automática

| Comprobación | Resultado |
| --- | --- |
| Frontend: `npm run typecheck` | Correcto |
| Frontend: `npm run lint` | Correcto |
| Frontend: `npm test` | 125 pruebas aprobadas |
| Frontend: `npm run export:web` | Exportación correcta |
| Backend: `npm test` | 68 pruebas aprobadas |
| `git diff --check` | Correcto |

Las pruebas completas corresponden al código corregido. Las consultas y operaciones del navegador usaron los repositorios reales del backend sobre una base exclusiva de pruebas, distinta de producción, con seis cuentas ficticias. El almacenamiento de archivos y el envío de correo externos estuvieron desactivados en ese servidor de auditoría.

## Datos y límites

Al terminar se detuvieron los servidores temporales y se eliminaron en una transacción únicamente las cuentas y entidades de esta auditoría: dos espacios, un elemento, tres proyectos, tres fotos, un préstamo con su devolución y sus relaciones. La limpieza validó las referencias antes de borrar y conservó los datos de pruebas anteriores. No se modificaron registros de producción ni objetos de almacenamiento externos.

Esta revisión no equivale a probar todas las combinaciones posibles. Quedan fuera el consentimiento real de Google, Discord y GitHub, el envío real de correo, una carga real a Blob y la ejecución física en Android. El cambio dinámico de rol se revisó en código; no se pudo acreditar la actualización por foco con el navegador de pruebas.

La APK 0.5.2 (código 8) generada antes de esta auditoría contiene la eliminación de fotos, pero no las correcciones de interfaz posteriores descritas aquí. Este trabajo genera la exportación web y no una nueva APK. Las correcciones se incorporaron después en la [APK 0.5.3 (código 9), compilada y verificada el 4 de noviembre](APK_PRUEBA.md).
