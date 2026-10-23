# APK de prueba de ExpoTec

Versión inicial: 0.2.0, Android versionCode 1. Proyecto Expo: [nachot/expotec-organizacion](https://expo.dev/accounts/nachot/projects/expotec-organizacion).

Segunda APK de prueba: 0.2.0, Android versionCode 2. Compilación EAS `0d0b28a2-ba16-4f7c-83a0-659c5c540415`, terminada el 22/10/2026, desde el código de `46ce1920`. Incluye el ícono propio, acceso nativo de Google, formulario que acompaña al teclado y barra inferior del sistema oculta con recuperación por deslizamiento. La confirmación de uso en un teléfono físico sigue pendiente.

APK actual: **0.3.0, Android versionCode 3**. [Descargar APK](https://expo.dev/artifacts/eas/CZZjemTc8DIDqac40PhPcTZ-y9-yp_lsdycotgPCCQY.apk). [Compilación EAS](https://expo.dev/accounts/nachot/projects/expotec-organizacion/builds/f27a7a2c-cfa6-45a7-b654-60165947a1f8), terminada el 22/10/2026 a las 23:40, hora de Argentina, con el frontend de `fca3dbcf`. El archivo local se conserva en `artifacts/android/ExpoTec-0.3.0-3.apk`, excluido de Git.

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

Registrar modelo de teléfono, versión de Android y pasos para cualquier error. No compartir contraseñas ni enlaces de recuperación.
