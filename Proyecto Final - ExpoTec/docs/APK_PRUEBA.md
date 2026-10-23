# APK de prueba de ExpoTec

APK actual: **0.4.0, Android versionCode 5**. [Descargar APK](https://expo.dev/artifacts/eas/2PBiG--Pnz0L_bkfG5PCBe9A0grheNB3PZSQsYw94F0.apk). [Compilación EAS](https://expo.dev/accounts/nachot/projects/expotec-organizacion/builds/53774cc9-9297-4fcf-ae97-27a21a2d602f), terminada el 23/10/2026 a las 10:30:46, hora de Argentina, desde el frontend de `b8213d23bd31eb531f4f454829ee3b21d2a575e6`.

La carga y edición de propuestas ahora se organiza en cuatro pasos: proyecto, equipo, puesto y revisión. Alumnos y profesores se buscan por correo, se revisa la cuenta encontrada y se agregan de forma explícita. Las materias tienen sugerencias y entrada personalizada. El recorrido conserva los datos al volver atrás, detecta texto pendiente de agregar y lleva cada error al paso correspondiente. [Cambios y validación del recorrido](REVISION_CARGA_PROYECTOS.md). También conserva las correcciones de fotos y del editor móvil de la versión 0.3.1.

Archivo local excluido de Git: `artifacts/android/ExpoTec-0.4.0-5.apk`, 109.979.231 bytes. Paquete `ar.edu.expotec.organizacion`, versión `0.4.0`, código `5`, sin modo depuración. Integridad ZIP, digest y firma APK v2 correctos; certificado idéntico al de la APK 0.3.1, para actualizarla. SHA-256: `c7d0acfbf10d53896d265f4509f56244e2de835dab91ea47e2988f2c1d291c49`. Informe: `artifacts/android/verification-0.4.0.json`. El archivo EAS inspeccionado contiene únicamente 151 archivos de fuentes, recursos y configuración del frontend; sus hashes coincidieron con la fuente final antes de subirlo. La exportación Android terminó correctamente. La instalación y el uso del recorrido en un teléfono físico siguen pendientes de prueba.

## APK anteriores

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
