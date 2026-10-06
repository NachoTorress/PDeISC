# Arrancar la versión Expo Go

Con MySQL iniciado, hacé doble clic en [INICIAR.bat](INICIAR.bat). Abre tres ventanas: API, ngrok y Expo Go. Escaneá el QR que aparece en la ventana de Expo Go. El lanzador lee el puerto y la URL pública desde `backend/.env`.

Si preferís iniciarlos a mano, abrí **tres terminales PowerShell** en la raíz de este proyecto. Las dependencias ya están instaladas; los `.env` locales ya apuntan a la URL fija de la API.

**Terminal 1 — API**

```powershell
cd backend
npm start
```

**Terminal 2 — API pública para el celular**

```powershell
ngrok http 4000 --url https://unseated-nutlike-squishy.ngrok-free.dev
```

**Terminal 3 — Expo Go**

```powershell
cd frontend
npx expo start --go --tunnel --port 8090
```

Escaneá el QR con Expo Go. El túnel de Expo entrega la app; ngrok entrega la API. Si cambia la red Wi-Fi, reiniciá los túneles y volvé a abrir la app.

Para comprobar la API, abrí `https://unseated-nutlike-squishy.ngrok-free.dev` en el navegador del celular. Debe responder `{"service":"api","status":"ok"}`.

Las credenciales de SMTP, Google, Discord y GitHub están en los `.env` locales, que contienen secretos y están excluidos de Git. Si cambiás la URL pública, actualizá también `frontend/.env` y las redirecciones OAuth de cada proveedor.

## Cambiar la contraseña administradora

Hacé doble clic en [CAMBIAR_CLAVE_ADMIN.bat](CAMBIAR_CLAVE_ADMIN.bat). Escribí la nueva contraseña dos veces en la ventana; la entrada queda oculta. También podés ejecutar `npm run reset:admin` desde `backend`. El cambio afecta solo a `nacho@admin.local` y cierra el acceso de las sesiones anteriores al reiniciar la API.
