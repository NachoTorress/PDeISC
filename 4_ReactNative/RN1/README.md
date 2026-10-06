# Acceso de usuarios · v1.1.0 · Expo SDK 57

Aplicación React Native y Web con TypeScript y API Node.js/MySQL. La pantalla de bienvenida recibe `user` por props. Las llamadas de la aplicación a la API son `POST`; OAuth requiere rutas `GET` de inicio y retorno porque así funcionan las redirecciones del navegador.

**Esta carpeta es la única versión activa para Expo Go.** Los entornos locales `backend/.env` y `frontend/.env` ya están configurados para la URL fija de la API. Los comandos de inicio están en [COMANDOS.md](COMANDOS.md).

## Requisitos

- Node.js 22.13 o superior.
- MySQL 8 mediante XAMPP, WAMP o LAMP.
- Un servidor SMTP para códigos por correo.
- Credenciales OAuth de Google, Discord y GitHub para habilitar esos botones.
- Expo Go instalado en Android para probar la app sin generar un APK.

## Preparación en otra computadora

En esta computadora ya están instaladas las dependencias y configurados los `.env` locales. Estos pasos sirven si se mueve el proyecto o se vuelve a configurar desde cero.

1. Ejecutá `backend/sql/schema.sql` en MySQL. Crea la base y la cuenta administradora `nacho@admin.local` sin contraseña inicial. Definila desde esta computadora con `CAMBIAR_CLAVE_ADMIN.bat`. El acceso local acepta solo direcciones de correo.
   Si ya habías creado la base con la versión anterior, ejecutá las migraciones que te falten: `backend/sql/migration_web.sql` para el retorno web y `backend/sql/migration_expo_go.sql` para Expo Go. Cada una se aplica una sola vez.
2. Copiá `backend/.env.example` a `backend/.env`. Asigná secretos aleatorios distintos de al menos 32 caracteres a `JWT_SECRET` y `TOKEN_HMAC_SECRET`; por ejemplo, generá cada uno con `node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('hex'))"`. Completá MySQL, SMTP y OAuth. En la configuración local actual faltan SMTP y Discord.
3. En Google, Discord y GitHub registrá el callback HTTPS de cada proveedor: `APP_BASE_URL/auth/oauth/google/callback`, `APP_BASE_URL/auth/oauth/discord/callback` y `APP_BASE_URL/auth/oauth/github/callback`. Los secretos OAuth quedan solo en el backend.
4. Copiá `frontend/.env.example` a `frontend/.env`. Configurá `EXPO_PUBLIC_API_URL` con la URL HTTPS pública de la API. Tanto la app instalada como la web usan esa URL; ninguna llama a `localhost` desde el celular.

## API pública y app instalada en el celular

El frontend corre en Expo Go. El backend escucha solo en `127.0.0.1:4000`; ngrok publica ese puerto como una URL HTTPS fija. La app llama a esa URL y la API consulta MySQL local. Cambiar de Wi-Fi puede cortar momentáneamente el túnel, pero no cambia la URL configurada en Google. Esta URL abre un JSON de estado en el navegador: no sirve la página.

1. Obtené una URL de desarrollo asignada a tu cuenta de ngrok, o un dominio propio con un túnel de Cloudflare. Guardá el token del túnel en tu computadora; no lo copies al repositorio ni lo envíes por chat.
2. En `backend/.env`, poné `APP_BASE_URL` igual a esa URL y dejá `WEB_BASE_URL` vacío. Configurá MySQL y las credenciales OAuth. En `frontend/.env`, poné la misma URL en `EXPO_PUBLIC_API_URL`.
3. En Google Cloud Console, mantené un cliente OAuth de tipo **Aplicación web**. Registrá como **URI de redirección autorizada** la URL exacta `https://tu-dominio-asignado.ngrok-free.dev/auth/oauth/google/callback`, reemplazando el dominio de ejemplo por el tuyo. Si la pantalla de consentimiento está en modo de prueba, agregá tu correo como usuario de prueba. El cliente OAuth se registra para la API, aunque el usuario empiece el acceso en la app.
4. Iniciá el backend desde la carpeta del proyecto:

```powershell
cd backend
npm start
```

5. Abrí otra terminal e iniciá ngrok hacia **4000**:

```powershell
$publicUrl = 'https://tu-dominio-asignado.ngrok-free.dev'
ngrok http 4000 --url $publicUrl
```

6. Probá `$publicUrl` desde el navegador del celular: debe mostrar `{"service":"api","status":"ok"}`. Después, desde `frontend`, ejecutá `npm start -- --tunnel` en una tercera terminal y escaneá el QR con Expo Go. Metro entrega el código de la app; ngrok del paso 5 entrega solamente la API. El túnel de Metro puede tener otra URL: Google solo necesita la URL fija de la API.

Al tocar Google en Expo Go se abre el navegador. Google redirige al callback HTTPS de la API; la API guarda el resultado temporal y muestra un mensaje corto. Volvé manualmente a Expo Go: la app consulta la API con un secreto de un solo uso y completa la sesión. No se usa un redireccionamiento a `localhost` ni un esquema propio que Expo Go no pueda abrir. Si cambiás la URL pública, actualizá `APP_BASE_URL`, `EXPO_PUBLIC_API_URL` y la URI en Google, y reiniciá los procesos. Si cambiás solo de Wi-Fi, reiniciá ngrok si se desconecta; no cambies las URLs.

## Web separada, si la necesitás

La web puede correr localmente sin publicarse por ngrok:

```powershell
cd frontend
npm run web:local
```

Abrí `http://localhost:8084` en la computadora. Usá `EXPO_PUBLIC_API_URL` para llamar a la API pública. Para que el inicio de sesión con Google vuelva a esa web, configurá `WEB_BASE_URL=http://localhost:8084` en el backend y reinicialo. Si publicás la web en otro dominio, reemplazá `WEB_BASE_URL` con ese origen HTTPS; de lo contrario, dejalo vacío y usá el flujo nativo. La web no se abre desde la URL de la API.

## Development build de Android (opcional)

```powershell
cd backend
npm install
npm run dev
```

En otra terminal:

```powershell
cd frontend
npm install
npx expo install --fix
npm run android
```

`npm run android` necesita Android SDK/Android Studio y genera e instala la development build. Una vez instalada, usá `npm run start:dev-client -- --tunnel` para iniciar Metro y abrí la app en el celular. El flujo de Google también usa la consulta a la API. En iOS, la build requiere macOS y `npm run ios` o EAS Build.

Si más adelante querés un APK y no tenés Android SDK, `frontend/eas.json` ya define una development build instalable. Con una cuenta de Expo, desde `frontend` ejecutá `npm install -g eas-cli`, `eas login` y `eas build --platform android --profile development`. Instalá el APK que entrega EAS en el teléfono. Después iniciá Metro con `npm run start:dev-client -- --tunnel` y abrí su enlace desde la app instalada. La compilación en EAS requiere tu propia sesión de Expo.

Para abrir la misma interfaz web en desarrollo en la computadora:

```powershell
cd frontend
npm run web -- --port 8084
```

Abrí `http://localhost:8084` en el navegador. `frontend/src/services/tokenStore.ts` guarda la sesión de la pestaña en `sessionStorage`; en Android/iOS se usa SecureStore.

## Recorridos

- **Registro local:** correo, nombre, contraseña y dos preguntas diferentes; se envía un código de seis dígitos y la cuenta ingresa después de verificarlo.
- **Ingreso social:** el backend valida el correo confirmado por el proveedor. Las identidades con el mismo correo verificado comparten un usuario.
- **Activar contraseña:** una cuenta creada primero con Google, Discord o GitHub recibe un código en su correo y define contraseña y preguntas.
- **Recuperación:** requiere código por correo y las dos respuestas configuradas.
- **Sesión:** JWT de siete días en SecureStore. La app valida la sesión guardada al abrirse. El cierre pide confirmación.

## Estructura y seguridad

`frontend/src/app.tsx` coordina las rutas; `AuthPage` reúne los formularios, `WelcomePage` recibe el usuario por props, `SessionContext` restaura la sesión y `services/api.ts` envía las solicitudes. Los colores están en `styles/light.ts` y `styles/dark.ts`: las vistas comparten `StyleSheet` en móvil y web.

`backend/src/localAuth.js` procesa credenciales y códigos; `oauth.js` intercambia códigos OAuth en el servidor y guarda temporalmente el resultado que consulta Expo Go. `users.js`, `codes.js`, `security.js` y `db.js` separan persistencia y seguridad. La base se organiza en usuarios, roles, identidades OAuth, preguntas, respuestas y códigos; las contraseñas y respuestas usan bcrypt. Las conexiones de transacciones se liberan en `finally`; las consultas comunes usan el pool. En una base ya existente, ejecutá una sola vez `backend/sql/migration_expo_go.sql`.

Para producción, configurá alojamiento permanente para la API y MySQL, HTTPS, un SMTP real, limitación de solicitudes a nivel proxy, respaldos de MySQL y secretos fuera del repositorio. También cambiá el correo administrador `nacho@admin.local` por uno propio.

## Logs del backend

La API escribe eventos JSON en la terminal y en `backend/logs/AAAA-MM-DD.jsonl`, con fecha y hora UTC. Crea un archivo nuevo cada día. `LOG_LEVEL=info` es el valor normal; `debug` incluye también las consultas repetidas de Expo Go, y `warn` o `error` muestran menos eventos. Podés cambiar la carpeta con `LOG_DIR` en `backend/.env` y reiniciar la API. La carpeta de logs está excluida de Git.

Cada solicitud tiene un `requestId` en el log y en la cabecera `X-Request-ID`. El manejador general también lo incluye en sus respuestas JSON de error. Para revisar lo más reciente en PowerShell, desde la raíz del proyecto:

```powershell
Get-Content (Get-ChildItem backend/logs/*.jsonl | Sort-Object Name | Select-Object -Last 1).FullName -Tail 50
```

Los registros incluyen ruta sin parámetros de consulta, método, estado, duración y fallos de OAuth. No guardan cuerpos de solicitudes, contraseñas, encabezados de autorización, códigos de Google ni tokens. Los archivos se conservan hasta que los borres o hagas una política de rotación externa.
