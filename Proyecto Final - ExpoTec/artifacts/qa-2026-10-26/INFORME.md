# Pruebas de ExpoTec — 26 de octubre de 2026

Se probó la web publicada en https://expotec-web-gn19.vercel.app, con el navegador de escritorio y un viewport móvil de 390 × 844. El código activo revisado está en `frontend/native`. Este informe registra hallazgos; no se aplicaron correcciones al código.

## Errores reproducidos

### QA-01 · P2 · El profesor no puede abrir un proyecto confirmado de otro docente en la muestra de demostración

1. Entrar en **Demostración → Cambiar vista → Profesor**.
2. Abrir **Muestra**.
3. Abrir **Energía en movimiento**.

**Resultado:** aparece «Proyecto no disponible. La propuesta fue eliminada o tu perfil no puede verla».

**Esperado:** mostrar la ficha pública de un proyecto confirmado, conservando la restricción de revisión para el profesor responsable. El mismo proyecto se abre correctamente como Invitado.

**Causa identificada:** `frontend/native/src/pages/ProjectDetailPage.tsx:43–48` exige que el profesor esté asignado incluso para leer un confirmado. `GalleryPage` sí ofrece ese proyecto a todos los perfiles.

**Alcance confirmado:** demostración local; no se comprobó este fallo con una cuenta docente real.

Evidencia: [bloqueo del docente](docente-proyecto-publico-bloqueado.png) y [misma ficha disponible como invitado](invitado-mismo-proyecto-disponible.png).

### QA-02 · P2 · La propuesta de demostración pierde el borrador al volver sin advertencia

1. Elegir **Demostración → Estudiante**.
2. Desde Espacios, pulsar **Cargar mi proyecto**.
3. Escribir «Borrador QA sin guardar» en el nombre.
4. Pulsar **Volver a proyectos**.
5. Volver a pulsar **Cargar mi proyecto**.

**Resultado:** sale sin confirmación, vuelve a Espacios y al reabrir el nombre está vacío. El botón tampoco lleva al listado de proyectos cuando el formulario se abrió desde el plano.

**Esperado:** advertir antes de descartar cambios y hacer coincidir el destino con el nombre del botón.

**Causa identificada:** los controles de salida de `frontend/native/src/pages/ProjectFormPage.tsx:130` y `:203` llaman directamente a `onDone`; `frontend/native/src/App.tsx:597` resuelve esa acción con `navigation.goBack()`.

**Alcance confirmado:** formulario de demostración. El formulario compartido es otro componente y no se incluye en este hallazgo.

Evidencia: [borrador escrito](borrador-antes-de-salir.png) y [formulario vacío al reabrir](borrador-vacio-al-reabrir.png). El recorrido se reprodujo dos veces.

### QA-03 · P2 · Recargar una ficha pública vuelve a Espacios

1. Abrir **Proyectos** desde el menú principal, fuera de la demostración.
2. Abrir **Prueba - Guía digital de la Expo**.
3. Recargar el navegador.

**Resultado:** desaparece la ficha y se abre Espacios compartidos. La URL permanece en `/` durante el recorrido y no identifica al proyecto.

**Esperado:** conservar una dirección que permita recargar y compartir la ficha pública concreta.

**Causa identificada:** `frontend/native/src/App.tsx:451` monta `NavigationContainer` sin configurar la vinculación entre rutas y URL; la pantalla inicial vuelve a ser Espacios.

**Alcance confirmado:** navegación pública de la web publicada.

Evidencia: [antes de recargar](ficha-publica-antes-de-recargar.png) y [después de recargar](ficha-publica-despues-de-recargar.png).

## Confusiones de interfaz observadas

- El mismo rol se llama **Organización** en la demostración y **Administrador** en cuentas reales.
- El registro ofrece Alumno o Invitado. Un docente necesita registrarse y pedir por fuera de la aplicación que un administrador le asigne Profesor. La interfaz menciona que la escuela asigna permisos, pero no ofrece una solicitud ni explica ese recorrido completo.

## Comprobaciones que funcionaron

| Recorrido | Resultado observado |
| --- | --- |
| Espacios compartidos | Carga, cambio de espacio y apertura de ficha desde un puesto ocupado |
| Proyectos públicos | Listado y lectura de las dos fichas disponibles |
| Acceso y registro | Validaciones de campos vacíos; proveedores sociales anunciados |
| Docente y estudiante, en demostración | Rechazo de devolución vacía, pedido de cambios, edición, reenvío y confirmación del proyecto |
| Préstamos, en demostración | Rechazo de cantidad superior a la reserva y de fracciones; entrega de dos unidades; devolución parcial; advertencia de pendientes al cambiar de jornada |
| Plano móvil, en demostración | Selección por flechas, giro de 90° y cancelación de la edición |
| Galería, en demostración | Motivo obligatorio al rechazar, confirmación al aprobar y publicación de una foto pendiente |
| Invitado, en demostración | Aporte con imagen de ejemplo, validación del formulario vacío, estado pendiente en Mis fotos y ausencia del aporte pendiente en la lista pública |
| Presentación pública | Avance manual, inicio, avance automático entre fichas y pausa; ancho móvil sin desborde horizontal de la página |
| Consola | Sin errores ni advertencias en las consultas realizadas |

## Pruebas automáticas locales

- Frontend: **118/118 aprobadas** (`npm test`).
- Backend: **58/58 aprobadas** (`npm test`).
- Tipos del frontend: aprobado (`npm run typecheck`).
- Análisis de estilo del frontend: aprobado (`npm run lint`).

La primera ejecución del backend no pudo conectar a sus servidores HTTP locales por las restricciones del entorno. La repetición con acceso a esas conexiones completó las 58 pruebas; ese primer resultado no se considera un defecto de la aplicación.

## Límites y datos utilizados

Las operaciones de escritura del navegador se hicieron en la demostración local: revisión y confirmación de Estación meteorológica, una entrega con devolución parcial, aprobación de una foto de ejemplo y un aporte pendiente de Invitado. No se crearon cuentas ni se modificaron registros compartidos de producción. No se enviaron correos ni se completaron autorizaciones sociales.

No se probaron sesiones reales de administración, docentes o préstamos, integraciones con una base temporal, carga de archivos reales, videos, un televisor físico ni Android. Pasar las pruebas automáticas no sustituye esos recorridos pendientes. La revisión no acredita ausencia de otros errores.
