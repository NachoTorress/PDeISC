# APK de prueba de ExpoTec

Versión inicial: 0.2.0, Android versionCode 1. Proyecto Expo: [nachot/expotec-organizacion](https://expo.dev/accounts/nachot/projects/expotec-organizacion).

## Alcance

La app incluye el frontend y usa `https://expotec-api-gn19.vercel.app`. Las cuentas, permisos, proyectos, fotos y préstamos son los mismos que en la web; las operaciones realizadas desde la APK se guardan en ese servidor.

Google, Discord y GitHub abren el navegador del teléfono y vuelven a la app mediante `expotec://auth`. El navegador conserva la cookie del inicio; la prueba privada del flujo permanece en SecureStore. Al volver, el servidor valida esa prueba y entrega la sesión móvil. Se conservan la vinculación explícita con contraseña y los permisos de la cuenta existente. Los enlaces no contienen contraseñas ni tokens de sesión.

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
2. Entrar con Google, Discord y GitHub, volver desde el navegador y cancelar un acceso sin dejar la pantalla bloqueada.
3. Subir una foto desde la galería del teléfono y comprobar su vista previa y moderación.
4. Recorrer espacios, proyectos, préstamos y devoluciones con los permisos correspondientes.
5. Probar teclado, botón Atrás, modo del sistema, videos y recuperación de contraseña.

Registrar modelo de teléfono, versión de Android y pasos para cualquier error. No compartir contraseñas ni enlaces de recuperación.
