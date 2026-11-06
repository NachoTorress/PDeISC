# APK de prueba de ExpoTec

## Confirmación de uso del 25 de octubre de 2026

El usuario informó que la APK funciona bastante bien y confirmó explícitamente que funciona el inicio de sesión con Google nativo. Esto registra uso real en teléfono y complementa las comprobaciones de compilación. No se proporcionaron modelo, versión de Android ni resultados individuales de todos los recorridos; por eso no se afirma una prueba exhaustiva. Las referencias a pruebas físicas pendientes en las entradas de compilaciones siguientes describen el estado de esas fechas. La lista final queda como guía para ampliar la cobertura.

Los pasos de uso, instalación y exposición están en el [índice de documentación](README.md).

## Compilación actual

APK actual: **0.5.5, Android versionCode 11**. [Descargar APK](https://expo.dev/artifacts/eas/sce_pWeEp6y-Jspo1a1fLwxfb11JpTcXBuq_y3dxvY8.apk). [Compilación EAS](https://expo.dev/accounts/nachot/projects/expotec-organizacion/builds/1b25b02c-495b-420b-a4d9-efe499ac1ca2), terminada el 06/11/2026 a las 10:58:12, hora de Argentina, desde el frontend de `3368175f3a4198695d2ce31ea3e1758d9d7da138`.

Incluye el nuevo [visor de presentación TV](REVISION_TV_2026-11-06.md): preparación separada, inicio inmediato a pantalla completa, diapositivas con texto grande, controles que se ocultan durante la reproducción y salida a las opciones. La muestra pública y la demostración comparten el visor. Conserva las mejoras visuales y los accesos de la 0.5.4.

Archivo local excluido de Git: `artifacts/android/ExpoTec-0.5.5-11.apk`, 110,020,219 bytes. Paquete `ar.edu.expotec.organizacion`, versión `0.5.5`, código `11`, sin modo depuración. Integridad ZIP, digest de contenido y firma APK v2 correctos; certificado idéntico al de la APK 0.5.4. Se verificaron en el bundle Android los identificadores y el contenido del nuevo visor TV. SHA-256: `1209b9afd164186290515d959d4cc49b9a01ce69e0073ae11cb55381c01fceba`. Informe local: `artifacts/android/verification-0.5.5.json`.

Se inspeccionaron los 209 archivos enviados a EAS, sin archivos privados ni otros proyectos, y sus hashes coincidieron con las fuentes locales. Registro: `artifacts/android/source-manifest-0.5.5-11.json`. La revisión del visor pasó pruebas de navegador en cuatro tamaños, casos de error y demostración, tres pruebas unitarias, análisis de código, revisión de tipos y exportaciones web y Android. La instalación y el uso de esta versión en un teléfono físico siguen pendientes.

## APK anteriores

Décima APK de prueba: **0.5.4, Android versionCode 10**. [Descargar APK](https://expo.dev/artifacts/eas/ccLZbYnGK1ko9zTXOTepEfGWjF5VzC6QbQ4Z8FSYDNc.apk). [Compilación EAS](https://expo.dev/accounts/nachot/projects/expotec-organizacion/builds/aee16978-5142-4959-ba28-759197c82a86), terminada el 06/11/2026 a las 10:13:00, hora de Argentina, desde el frontend de `30f06cf4209f2d9987c7758f4a1ecef73b676b98`.

Incluye el acceso superior con ícono de login, puestos libres azules y ocupados verdes en modo oscuro, Google en una fila completa con Discord y GitHub juntos en celular y los ajustes suaves de bordes, cabeceras y acciones descritos en la [revisión visual del 6 de noviembre](REVISION_VISUAL_2026-11-06.md). Conserva las correcciones funcionales de la 0.5.3 y la API pública existente.

Archivo local excluido de Git: `artifacts/android/ExpoTec-0.5.4-10.apk`, 110,014,275 bytes. Paquete `ar.edu.expotec.organizacion`, versión `0.5.4`, código `10`, sin modo depuración. Integridad ZIP, digest de contenido y firma APK v2 correctos; certificado idéntico al de la APK 0.5.3. El bundle Android contiene los nuevos colores de puestos y el ícono de login. SHA-256: `6b4ceb3fc4feec0b955734adc6074b996058c593b7983b074487e9445b281134`. Informe local: `artifacts/android/verification-0.5.4.json`.

Se inspeccionaron los 207 archivos enviados a EAS y sus hashes coincidieron con las fuentes locales, sin archivos privados ni otros proyectos. Registro: `artifacts/android/source-manifest-0.5.4-10.json`. Pasaron revisión de tipos, análisis de código y exportación web. Se verificaron 50 capturas en navegador con datos ficticios, ambos temas y tamaños de celular y escritorio, sin desbordes horizontales del documento ni errores de ejecución. La instalación y el uso de esta versión en un teléfono físico siguen pendientes.

Novena APK de prueba: **0.5.3, Android versionCode 9**. [Descargar APK](https://expo.dev/artifacts/eas/pHPSd0wJPZqgZcbFK46WxwpwD0_QV4V6OqMqkLvQJ5I.apk). [Compilación EAS](https://expo.dev/accounts/nachot/projects/expotec-organizacion/builds/2c2c2789-845b-495d-81eb-48f4e19b2999), terminada el 04/11/2026 a las 20:49:01, hora de Argentina, desde el frontend de `497b932dc93125264e0570ea3f7357dac6dba1eb`.

Incluye las correcciones de la [auditoría funcional del 3 de noviembre](AUDITORIA_FUNCIONAL_2026-11-03.md): salida de propuestas al cerrar sesión, conservación de la imagen válida después de un reemplazo fallido, vista previa de enlaces, confirmación de revisiones, consultas según permisos, recargas de espacios e inventario, reintento de acceso social y validaciones de nombres y observaciones. Conserva **Eliminar foto** para administración sobre aportes pendientes, publicados y rechazados, las consultas por POST y la API pública 0.5.1.

Archivo local excluido de Git: `artifacts/android/ExpoTec-0.5.3-9.apk`, 110.012.607 bytes. Paquete `ar.edu.expotec.organizacion`, versión `0.5.3`, código `9`, sin modo depuración. Integridad ZIP, digest de contenido y firma APK v2 correctos; certificado idéntico al de la APK 0.5.2 para instalarla como actualización. El bundle Android contiene la eliminación de fotos, el reintento de acceso, el mensaje que conserva la imagen anterior y la dirección de la API pública. SHA-256: `637bf8cd1e53d53543a4f00b070fba8f2e957da509f9bd263090b364427ce46a`. Informe local: `artifacts/android/verification-0.5.3.json`. Expo indica vencimiento del artefacto el 18/11/2026 a las 20:32, hora de Argentina; conservar la copia descargada.

Antes de subir se inspeccionaron 207 archivos de fuentes, recursos y configuración del frontend: sus hashes coincidieron con el código local y no se incluyeron archivos privados ni otros proyectos. El envío se delimitó a `frontend/native` mediante `EAS_PROJECT_ROOT` y `EAS_NO_VCS`, con la lista permitida de `.easignore` y `EXPO_NO_DOTENV=1`. El listado quedó en `artifacts/android/source-manifest-0.5.3-9.json`. Pasaron 125 pruebas del frontend, revisión de tipos, análisis de estilo y exportación Android con Hermes. Las seis consultas POST publicadas de salud, disponibilidad de la base, espacios, proyectos públicos, galería y proveedores sociales respondieron HTTP 200 con JSON válido. Registro local: `artifacts/android/preflight-0.5.3.json`.

EAS conserva el aviso previo de `expo doctor` sobre versiones recomendadas por el SDK (20 de 21 comprobaciones aprobadas), también presente en la 0.5.2. La compilación Android finalizó correctamente. Se verificaron el archivo y su firma; la instalación y el recorrido de esta versión en un teléfono físico siguen pendientes.

Octava APK de prueba: **0.5.2, Android versionCode 8**. [Descargar APK](https://expo.dev/artifacts/eas/NM8NSyDKDkEx2WhevZsiOaAZrx2aPv28tKiEJghmtSM.apk). [Compilación EAS](https://expo.dev/accounts/nachot/projects/expotec-organizacion/builds/b5df5f71-5dcf-4989-a028-6728a18fd352), terminada el 02/11/2026 a las 18:35:41, hora de Argentina, desde el frontend de `4de7f42b32b4640079fcb49161c53b944a876298`.

Incluye **Eliminar foto** en **Galería de la ExpoTec → Moderar fotos**, disponible para administración sobre fotos pendientes, publicadas o rechazadas. Pide confirmación antes de eliminar el aporte y sus revisiones. La opción también está disponible en la demostración. Conserva las consultas por POST y utiliza la API pública 0.5.1, que ya admite la eliminación de fotos.

Archivo local excluido de Git: `artifacts/android/ExpoTec-0.5.2-8.apk`, 110.004.595 bytes. Paquete `ar.edu.expotec.organizacion`, versión `0.5.2`, código `8`, sin modo depuración. Integridad ZIP, digest y firma APK v2 correctos; certificado idéntico al de la APK 0.5.1, para instalarla como actualización. El código Android incluido en la APK contiene la opción de eliminar fotos y la dirección de la API pública. SHA-256: `1953143cc54abe624a0ea56623da5b88409569959820abf6a678fe22df317937`. Informe local: `artifacts/android/verification-0.5.2.json`. Expo indica vencimiento del artefacto el 16/11/2026 a las 17:50, hora de Argentina; conservar una copia descargada.

Antes de subir se inspeccionaron 207 archivos de fuentes, recursos y configuración del frontend; sus hashes coincidieron con el código local y no se incluyeron archivos privados ni otros proyectos. El listado quedó en `artifacts/android/source-manifest-0.5.2-8.json`. Pasaron 122 pruebas del frontend, revisión de tipos, análisis de estilo y exportación Android. Las seis consultas POST publicadas de salud, disponibilidad de la base, espacios, proyectos públicos, galería y proveedores sociales respondieron HTTP 200 con JSON válido. Registro local: `artifacts/android/preflight-0.5.2.json`.

EAS conserva el aviso de `expo doctor` observado también en las APK anteriores; la compilación Android finalizó correctamente. Se verificaron el archivo y su firma; la instalación y el nuevo recorrido en un teléfono físico siguen pendientes para esta versión.


Séptima APK de prueba: **0.5.1, Android versionCode 7**. [Descargar APK](https://expo.dev/artifacts/eas/_DrYzpt3Pc2cg8VchHXkfpwbNFUIU2ctImsTNd6F9YY.apk). [Compilación EAS](https://expo.dev/accounts/nachot/projects/expotec-organizacion/builds/8b57beca-be9a-49d3-869c-4ff23ec68fd4), terminada el 29/10/2026 a las 14:15:27, hora de Argentina, desde el frontend de `8ee3a3b44f8f8168c6b5db5bd41b5bb021d13fda`.

Incluye las consultas por POST de la API 0.5.1, con los datos en el cuerpo JSON, y la reorganización de componentes del frontend. Se compiló el código existente sin cambios de implementación, con el mismo proyecto Expo, perfil `preview`, API pública y credenciales de firma de las versiones anteriores. La APK 0.5.0 usaba GET y no funciona con la API actual; la 0.4.0 conserva compatibilidad.

Archivo local excluido de Git: `artifacts/android/ExpoTec-0.5.1-7.apk`, 110.003.139 bytes. Paquete `ar.edu.expotec.organizacion`, versión `0.5.1`, código `7`, sin modo depuración. Integridad ZIP, digest y firma APK v2 correctos; certificado idéntico al de la APK 0.5.0, para instalarla como actualización. SHA-256: `09da65aa1b61b17b0e70f7161fa936916a1deaf39a0678490a424fa59d16f779`. Informe local: `artifacts/android/verification-0.5.1.json`. Expo indica vencimiento del artefacto el 12/11/2026 a las 13:22, hora de Argentina; conservar una copia descargada.

Antes de subir se inspeccionaron 207 archivos de fuentes, recursos y configuración del frontend; sus hashes coincidieron con el código local. No se incluyeron archivos de entorno privados ni otros proyectos. El listado quedó en `artifacts/android/source-manifest-0.5.1-7.json`. Pasaron 121 pruebas del frontend, revisión de tipos, análisis de estilo y exportación Android. También respondieron con HTTP 200 y JSON válido las consultas POST publicadas de salud, disponibilidad de la base, espacios, proyectos públicos, galería y proveedores sociales. Registro local: `artifacts/android/preflight-0.5.1.json`. La instalación y los recorridos en un teléfono físico siguen pendientes para esta versión.

Sexta APK de prueba: **0.5.0, Android versionCode 6**. [Descargar APK](https://expo.dev/artifacts/eas/1MRotQpnDJKRVPmB8o9TVXYwrNh0DEwpYrskWHbrQkg.apk). [Compilación EAS](https://expo.dev/accounts/nachot/projects/expotec-organizacion/builds/d559c18d-cfeb-42a1-8aba-5aa3ead0ff5c), terminada el 26/10/2026 a las 22:20:35, hora de Argentina, desde el frontend de `6fb156adfa30887615ea95f8a8d951ec3695b1e7`.

Incluye el código actualizado de la versión 0.5.0, sin cambios adicionales de implementación durante esta compilación. Se usó el mismo proyecto Expo y perfil `preview` de las APK anteriores, con la API pública y sin cargar archivos de entorno privados.

Archivo local excluido de Git: `artifacts/android/ExpoTec-0.5.0-6.apk`, 109.979.775 bytes. Paquete `ar.edu.expotec.organizacion`, versión `0.5.0`, código `6`, sin modo depuración. Integridad ZIP, digest y firma APK v2 correctos; certificado idéntico al de la APK 0.4.0, para instalarla como actualización. SHA-256: `5d4b0ef8a5ea5c2102cca8867c29fef1f8e38f18c70e397fc8509b53d0ff9ba0`. Informe local: `artifacts/android/verification-0.5.0.json`.

Antes de subir el código se inspeccionaron 151 archivos de fuentes, recursos y configuración del frontend; sus hashes coincidieron con el código actual y no se incluyeron archivos privados ni otros proyectos. El listado con hashes quedó en `artifacts/android/source-manifest-0.5.0-6.json`. Pasaron 119 pruebas del frontend, revisión de tipos, análisis de estilo y exportación Android. La nueva APK todavía requiere instalación y prueba en un teléfono; la confirmación de uso del 25/10 corresponde a la versión anterior.

Quinta APK de prueba: **0.4.0, Android versionCode 5**. [Descargar APK](https://expo.dev/artifacts/eas/2PBiG--Pnz0L_bkfG5PCBe9A0grheNB3PZSQsYw94F0.apk). [Compilación EAS](https://expo.dev/accounts/nachot/projects/expotec-organizacion/builds/53774cc9-9297-4fcf-ae97-27a21a2d602f), terminada el 23/10/2026 a las 10:30:46, hora de Argentina, desde el frontend de `b8213d23bd31eb531f4f454829ee3b21d2a575e6`.

La carga y edición de propuestas ahora se organiza en cuatro pasos: proyecto, equipo, puesto y revisión. Alumnos y profesores se buscan por correo, se revisa la cuenta encontrada y se agregan de forma explícita. Las materias tienen sugerencias y entrada personalizada. El recorrido conserva los datos al volver atrás, detecta texto pendiente de agregar y lleva cada error al paso correspondiente. [Cambios y validación del recorrido](REVISION_CARGA_PROYECTOS.md). También conserva las correcciones de fotos y del editor móvil de la versión 0.3.1.

Archivo local excluido de Git: `artifacts/android/ExpoTec-0.4.0-5.apk`, 109.979.231 bytes. Paquete `ar.edu.expotec.organizacion`, versión `0.4.0`, código `5`, sin modo depuración. Integridad ZIP, digest y firma APK v2 correctos; certificado idéntico al de la APK 0.3.1, para actualizarla. SHA-256: `c7d0acfbf10d53896d265f4509f56244e2de835dab91ea47e2988f2c1d291c49`. Informe: `artifacts/android/verification-0.4.0.json`. El archivo EAS inspeccionado contiene únicamente 151 archivos de fuentes, recursos y configuración del frontend; sus hashes coincidieron con la fuente final antes de subirlo. La exportación Android terminó correctamente. La confirmación posterior de uso y Google nativo está registrada al inicio de este documento; la comprobación individual del formulario de cuatro pasos no fue detallada por el usuario.

Cuarta APK de prueba: **0.3.1, Android versionCode 4**. [Descargar APK](https://expo.dev/artifacts/eas/bJIiQlxWxtQSKQHvnVZ2YncllrZLonNJD8OPLKUgr8E.apk). [Compilación EAS](https://expo.dev/accounts/nachot/projects/expotec-organizacion/builds/e7eb2283-76e9-45ab-9df6-51594f1c7a19), terminada el 23/10/2026 a las 00:29, hora de Argentina, desde el frontend de `82a8beb4`.

Corrige el error «función undefined» de fotos en Android, prepara un JPEG nativo y mejora giro, tamaño y selección de mesas en móvil. También retira el margen superior duplicado sobre los títulos. [Causas, cambios y pruebas](CORRECCIONES_ANDROID_031.md).

Archivo local excluido de Git: `artifacts/android/ExpoTec-0.3.1-4.apk`, 109.951.795 bytes. Paquete `ar.edu.expotec.organizacion`, versión `0.3.1`, código `4`, sin modo depuración. Integridad ZIP, digest y firma APK v2 correctos; certificado idéntico al de la APK anterior, para actualizarla. SHA-256: `2e5ed36d1ae41ac7da2fd1f323b1ba2b574f479164140e16520bc2ca81ef935a`. Informe: `artifacts/android/verification-0.3.1.json`. La instalación, el selector de fotos y los gestos en un teléfono físico siguen pendientes de prueba.

Versión inicial: 0.2.0, Android versionCode 1. Proyecto Expo: [nachot/expotec-organizacion](https://expo.dev/accounts/nachot/projects/expotec-organizacion).

Segunda APK de prueba: 0.2.0, Android versionCode 2. Compilación EAS `0d0b28a2-ba16-4f7c-83a0-659c5c540415`, terminada el 22/10/2026, desde el código de `46ce1920`. Incluye el ícono propio, acceso nativo de Google, formulario que acompaña al teclado y barra inferior del sistema oculta con recuperación por deslizamiento. La confirmación de uso en un teléfono físico sigue pendiente.

Tercera APK de prueba: **0.3.0, Android versionCode 3**. [Descargar APK](https://expo.dev/artifacts/eas/CZZjemTc8DIDqac40PhPcTZ-y9-yp_lsdycotgPCCQY.apk). [Compilación EAS](https://expo.dev/accounts/nachot/projects/expotec-organizacion/builds/f27a7a2c-cfa6-45a7-b654-60165947a1f8), terminada el 22/10/2026 a las 23:40, hora de Argentina, con el frontend de `fca3dbcf`. El archivo local se conserva en `artifacts/android/ExpoTec-0.3.0-3.apk`, excluido de Git.

Incluye modo oscuro carbón y grafito, usuarios en filas compactas, grillas que aprovechan el ancho incluso con zoom, proyectos sin foto con icono pequeño y botones alineados en las pantallas compartidas y la demostración. Conserva la paleta clara azul/naranja y los selectores en filas completas. Se mantiene el perfil `preview`, el proyecto de Expo y su firma para permitir la actualización de la APK anterior.

Verificación del archivo: paquete `ar.edu.expotec.organizacion`, versión `0.3.0` y código `3`, sin modo depuración; integridad ZIP, digest y firma APK v2 correctos. El certificado coincide con la APK `0.2.0-2`. Tamaño: 109.931.099 bytes. SHA-256: `540b344a087dff8ef443fbcdbc755673399ca75d44edab4ba0cdaf0157712063`. El informe local es `artifacts/android/verification-final.json`. La instalación y el uso en teléfono físico siguen pendientes; estas comprobaciones no los sustituyen.

## Alcance

La app incluye el frontend y usa `https://expotec-api-gn19.vercel.app`. Las cuentas, permisos, proyectos, fotos y préstamos son los mismos que en la web; las operaciones realizadas desde la APK se guardan en ese servidor.

Google en Android usa Credential Manager mediante `react-native-nitro-google-signin`. El servidor emite un nonce por intento y verifica la firma del ID token de Google, su emisor, destinatario, vigencia, correo verificado y nonce. El flujo y la prueba privada son de un uso. El cliente web de Google se obtiene del servidor; la APK no contiene secretos de Google. Ver [configuración de Google Android](ANDROID_GOOGLE.md).

Discord y GitHub abren el navegador del teléfono y vuelven a la app mediante `expotec://auth`. El navegador conserva la cookie del inicio; la prueba privada del flujo permanece en SecureStore. Al volver, el servidor valida esa prueba y entrega la sesión móvil. Se conservan la vinculación explícita con contraseña y los permisos de la cuenta existente. Los enlaces no contienen contraseñas ni tokens de sesión. La web conserva el acceso de los tres proveedores en el navegador.

La pantalla de cuenta omite la cabecera adicional «Ingresar». Android usa `KeyboardProvider` y `KeyboardAwareScrollView` para mantener visible el campo activo. La web ajusta el alto al área visible del navegador al abrir el teclado. Se mantienen los márgenes de seguridad inferiores. La barra de navegación de Android se oculta y reaparece temporalmente al deslizar; el sistema puede mostrarla mientras está abierto el teclado.

La recuperación de contraseña envía el correo habitual. El enlace permite cambiarla desde la web y luego usar la contraseña nueva en la app.

Las imágenes de Android se envían directamente a Blob privado con un permiso temporal limitado al archivo, tipo y tamaño. El backend valida y convierte el contenido antes de guardarlo. La web conserva su transporte con el SDK oficial. El tema inicial sigue el sistema y los cambios manuales duran hasta volver a abrir la app.

## Compilación

El perfil `preview` de `frontend/native/eas.json` genera una APK instalable que funciona sin el servidor de desarrollo de la computadora.

Desde `frontend/native`, en PowerShell:

```powershell
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path
$env:EXPO_NO_DOTENV = '1'
npx eas-cli build --platform android --profile preview
```

La raíz explícita es necesaria porque Git está en la carpeta superior, que contiene otros proyectos. `.easignore` permite únicamente fuentes, imágenes, recursos públicos y configuración del frontend nativo. Excluye archivos de entorno, dependencias instaladas, exportaciones, pruebas y los demás proyectos. Antes de subir se inspeccionó el archivo con `eas build:inspect --stage archive`.

## Prueba en teléfono

La compilación y las pruebas automatizadas no acreditan el funcionamiento en un Android físico. La APK inicial sirve para verificar:

1. Abrir, cerrar y recuperar la sesión con correo y contraseña.
2. Entrar con el selector nativo de Google y comprobar que conserva los permisos. Probar Discord y GitHub con regreso desde el navegador; cancelar cada acceso sin dejar la pantalla bloqueada.
3. Subir una foto desde la galería del teléfono y comprobar su vista previa y moderación.
4. Recorrer espacios, proyectos, préstamos y devoluciones con los permisos correspondientes.
5. Completar el registro propio y social, incluyendo las dos contraseñas, con el teclado abierto y en horizontal. Probar botón Atrás, modo del sistema, videos y recuperación de contraseña.
6. Comprobar que la barra inferior se oculta y vuelve al deslizar desde abajo, incluso después de regresar del navegador o cerrar el teclado.
7. Crear y editar una propuesta con los cuatro pasos: buscar y confirmar alumnos y profesores, agregar materias sugeridas y propias, volver atrás sin perder datos, corregir pendientes y revisar todo antes de enviar. Probar con el teclado abierto y en ambos temas.

Registrar modelo de teléfono, versión de Android y pasos para cualquier error. No compartir contraseñas ni enlaces de recuperación.
