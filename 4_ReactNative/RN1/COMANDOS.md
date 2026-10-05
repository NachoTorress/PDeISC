# Arrancar la versión Expo Go

Abrí **tres terminales PowerShell** en la raíz de este proyecto. MySQL debe estar iniciado. Las dependencias ya están instaladas; los `.env` locales ya apuntan a la URL fija de la API.

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

El acceso con Google y GitHub tiene credenciales locales. Discord y el envío de códigos por correo necesitan completar sus credenciales en `backend/.env`; hasta entonces esas funciones no pueden operar. Los archivos `.env` contienen secretos y están excluidos de Git.
