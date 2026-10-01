# Acceso de usuarios · Expo SDK 57

Aplicación React Native y Web con TypeScript y API Node.js/MySQL. La pantalla de bienvenida recibe `user` por props. Las llamadas de la aplicación a la API son `POST`; OAuth requiere rutas `GET` de inicio y retorno porque así funcionan las redirecciones del navegador.

## Requisitos

- Node.js 22.13 o superior.
- MySQL 8 mediante XAMPP, WAMP o LAMP.
- Un servidor SMTP para códigos por correo.
- Credenciales OAuth de Google, Discord y GitHub para habilitar esos botones.
- Para OAuth en el teléfono: una **development build**. Expo Go no permite comprobar confiablemente el retorno a `accesoexpo://auth`.

## Preparación

1. Ejecutá `backend/sql/schema.sql` en MySQL. Crea la base y el administrador `nacho` con contraseña `nacho87` (hash bcrypt). Cambiá esa clave y el correo del administrador antes de usarlo fuera de desarrollo.
   Si ya habías creado la base con la versión anterior, ejecutá una sola vez `backend/sql/migration_web.sql`.
2. Copiá `backend/.env.example` a `backend/.env`. Asigná secretos aleatorios distintos de al menos 32 caracteres a `JWT_SECRET` y `TOKEN_HMAC_SECRET`; por ejemplo, generá cada uno con `node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('hex'))"`. Completá MySQL, SMTP y OAuth.
3. En Google, Discord y GitHub registrá el callback HTTPS de cada proveedor: `APP_BASE_URL/auth/oauth/google/callback`, `APP_BASE_URL/auth/oauth/discord/callback` y `APP_BASE_URL/auth/oauth/github/callback`. `APP_BASE_URL` debe ser accesible desde el móvil; un túnel HTTPS público sirve para desarrollo. Los secretos OAuth quedan solo en el backend.
4. Copiá `frontend/.env.example` a `frontend/.env`. Usá como `EXPO_PUBLIC_API_URL` la dirección pública HTTPS del backend o la IP LAN de la computadora para pruebas locales sin OAuth. `localhost` apunta al teléfono, no a la computadora.

Para usar OAuth en la computadora, configurá también `WEB_BASE_URL` con la dirección HTTPS pública de la versión web. El navegador debe abrirla en ese mismo origen para que la ventana de autorización pueda retornar.

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

`npm run android` necesita Android SDK/Android Studio y genera e instala la development build. Una vez instalada, usá `npm start` para iniciar Metro y abrí la app en el celular. En iOS, la build requiere macOS y `npm run ios` o EAS Build.

Para abrir la misma interfaz en la computadora:

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

`backend/src/localAuth.js` procesa credenciales y códigos; `oauth.js` intercambia códigos OAuth en el servidor y emite tickets de un solo uso para el móvil. `users.js`, `codes.js`, `security.js` y `db.js` separan persistencia y seguridad. La base se organiza en usuarios, roles, identidades OAuth, preguntas, respuestas y códigos; las contraseñas y respuestas usan bcrypt. Las conexiones de transacciones se liberan en `finally`; las consultas comunes usan el pool.

Para producción, configurá HTTPS, un SMTP real, limitación de solicitudes a nivel proxy, respaldos de MySQL y secretos fuera del repositorio. También cambiá la contraseña y el correo iniciales de `nacho`.
