# Revisión de la carga de proyectos · 23/10/2026

La presentación y edición de propuestas conservan sus datos y reglas, con un recorrido guiado que separa las decisiones y permite revisar el conjunto antes de enviar.

## Problemas observados

El formulario reunía datos del proyecto, participantes, materias, puesto y elementos en una sola pantalla larga. Costaba reconocer el orden de carga, distinguir una búsqueda de una incorporación al equipo y comprobar qué personas o materias ya estaban agregadas. Los campos opcionales competían con los obligatorios y faltaba una revisión final de la propuesta.

## Recorrido de cuatro pasos

1. **Proyecto:** nombre, descripción, curso y foto. Video, condición de proyecto informático, GitHub y página siguen disponibles en una sección opcional.
2. **Equipo:** alumnos, profesores responsables y materias, cada grupo con sus seleccionados y acciones de incorporación.
3. **Puesto:** espacio y puesto disponible. El pedido de elementos de la escuela se despliega cuando se necesita; la disponibilidad puede actualizarse sin reiniciar el formulario.
4. **Revisar:** resumen de los datos, foto, equipo, materias, puesto y cantidades solicitadas. Cada sección permite volver a editar antes de enviar o guardar y reenviar.

El avance indica el paso actual y dirige al primer grupo incompleto. Un correo o una materia escritos todavía sin agregar requieren agregarlos o limpiar su texto antes de continuar. Solicitar un puesto o elementos no los reserva: la reserva se comprueba al confirmar la propuesta.

## Personas y materias

- Alumnos y profesores muestran filas compactas, contadores y límites de 12 alumnos y 5 profesores. La propia cuenta está incluida; el autor y quien edita permanecen protegidos en el equipo.
- Buscar una cuenta muestra primero su nombre y el correo consultado. La incorporación requiere una acción explícita. Se explican los casos de cuenta inexistente, permiso incorrecto, duplicado, límite o fallo de conexión. Se puede limpiar o cancelar la búsqueda.
- Las materias se agregan mediante sugerencias o un nombre escrito y la acción **Agregar materia**; también se admite Enter. Las sugerencias provienen de los ejemplos existentes de ExpoTec y se pueden escribir otras materias. Hay contador, máximo de 10, control de duplicados sin distinguir mayúsculas ni tildes y confirmación para quitar.

## Borrador, errores y fotos

Cambiar de paso conserva los valores, búsquedas y textos pendientes durante la sesión del formulario. Salir mediante la navegación de la aplicación pide confirmación si hay cambios o entradas pendientes. Esta conservación no equivale a guardar automáticamente un borrador en el dispositivo o en el servidor.

Los errores aparecen junto al dato y en el resumen del paso correspondiente; los campos opcionales con errores se abren para corregirlos. Un fallo de envío conserva el borrador. Ante un conflicto se pueden revisar los datos y actualizar puestos; recargar la versión guardada exige confirmar el descarte de los cambios locales. Se mantienen las restricciones de cuenta, estado editable y versión del proyecto.

La foto conserva su selector, vista previa, enlace alternativo, progreso, cancelación y reintento. El avance y el envío quedan bloqueados durante la carga para evitar enviar la propuesta sin esperar su resultado. El resumen final permite revisar la imagen elegida.

## Búsqueda y privacidad

La búsqueda de personas sigue usando el correo exacto de una cuenta registrada y el rol solicitado. No se incorpora un directorio público ni una búsqueda por nombre. La consulta se realiza al pulsar **Buscar** o Enter, sin consultar por cada tecla y respetando los límites del servicio. Este paso no crea cuentas ni envía invitaciones por correo.

## Validación

TypeScript, ESLint y las 118 pruebas del frontend pasaron. También se exportaron las versiones web y Android, incluida la compilación del código para Hermes.

`frontend/native/scripts/check-proposal-flow.cjs` completó 24 comprobaciones en navegador, con datos ficticios y sin escribir en producción: alta a 390 px en oscuro, edición a 1440 px en claro y los cuatro pasos a 320 y 768 px. Se verificaron confirmación de personas, duplicados, cancelación y respuestas tardías, materias, conservación entre pasos, protección del autor y editor, recursos, errores de campos, conflicto de versión y cancelación de foto. Los cuatro envíos interceptados conservaron el contenido y la versión esperados. No hubo errores de ejecución ni peticiones externas inesperadas.

Las 15 capturas y el informe quedan en `artifacts/proposal-flow/`, excluidos de Git. Estas comprobaciones de navegador y exportación no sustituyen la instalación y el uso de la APK en un Android físico.

La revisión `b8213d23` se publicó en `main` y Vercel la marcó lista en producción. Se comprobó que [ExpoTec web](https://expotec-web-gn19.vercel.app) sirve el formulario nuevo; el resultado de esa lectura está en `artifacts/proposal-flow/deployment.json`.
