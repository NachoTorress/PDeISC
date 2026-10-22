# Google nativo en Android

La app usa Android Credential Manager, sin abrir el navegador para Google. Discord y GitHub conservan el flujo de navegador.

## Cliente Android de Google Cloud

Registrar en el mismo proyecto que el cliente web del backend:

- Proyecto confirmado por el usuario: `expotec-512413`.
- Paquete: `ar.edu.expotec.organizacion`.
- SHA-1 de la firma de la APK inicial de EAS: `09:CD:04:46:B9:4F:A6:62:C5:FB:1A:C9:F1:E3:61:F2:82:DA:47:1C`.
- Cliente Android creado por el usuario: `171580413541-0dtqe2188mr3crbota3icij6qdis1vv7.apps.googleusercontent.com`.

La huella se extrajo del certificado público de la APK firmada, sin descargar ni exponer el keystore. La siguiente APK debe conservar esa firma para instalarse como actualización. Si se usa otra firma, por ejemplo la de Google Play, registrar también su SHA-1 en otro cliente Android.

El JSON descargado de este cliente OAuth no es un `google-services.json` de Firebase y no debe usarse como tal. No hace falta agregarlo al proyecto ni modificar los secretos existentes de Vercel. Android se enlaza automáticamente con el módulo nativo; sin Firebase, se configura el cliente web explícitamente en tiempo de ejecución. El plugin de Google de este módulo agrega configuración de Firebase o iOS, que esta APK no utiliza.

## Verificación del servidor

`/api/auth/social/google/native/start` recibe el desafío de la prueba privada y devuelve un identificador, un nonce aleatorio y el identificador público del cliente web ya configurado en `SOCIAL_GOOGLE_CLIENT_ID`.

El selector de cuentas usa ese nonce. `/api/auth/social/google/native/verify` exige la prueba privada y valida el ID token con las claves públicas de Google, RS256, emisor de Google, destinatario exacto, correo verificado, emisión reciente, vencimiento y nonce del intento. El intento se consume antes de validar el token; una verificación fallida exige iniciar otro intento.

Después se usan las operaciones sociales existentes para consultar y completar el acceso. Las cuentas vinculadas ingresan directamente y conservan sus permisos; la vinculación inicial a una cuenta existente exige su contraseña actual. No se guarda el ID token de Google en SecureStore ni se devuelve en enlaces.

## Comprobaciones

Se verificaron firmas y rechazos de tokens, cancelación, prueba privada, repetición, vencimiento y persistencia contra TiDB de pruebas. El selector nativo, teclado y barra inferior requieren la nueva APK y comprobación en un teléfono Android físico; la exportación de JavaScript y las pruebas del servidor no sustituyen esa prueba.

Fuentes: [autenticación de Google con Expo](https://docs.expo.dev/guides/google-authentication/), [módulo nativo y configuración](https://github.com/react-native-nitro-google-sign-in/google-signin), [barra de navegación de Expo](https://docs.expo.dev/versions/v57.0.0/sdk/navigation-bar/), [manejo de teclado de Expo](https://docs.expo.dev/versions/v57.0.0/sdk/keyboard-controller/).
