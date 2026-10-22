# Recuperación de contraseña con Gmail

Se configura únicamente en el backend `expotec-api` de Vercel, para Production.

Estado al 22/10/2026: configuración de producción habilitada y recepción real del correo confirmada por el usuario. Las pruebas con TiDB exclusivo verifican el cambio de contraseña, uso único, caducidad, concurrencia y revocación de sesiones. La contraseña personal la elige el usuario desde el enlace recibido.

1. Activar la verificación en dos pasos de la cuenta remitente.
2. Entrar en https://myaccount.google.com/apppasswords y crear una contraseña de aplicación llamada ExpoTec. Usar esa clave, nunca la contraseña principal de Google. La cuenta puede no ofrecer esta opción por sus políticas de seguridad; consultar https://support.google.com/accounts/answer/185833?hl=es.
3. En Settings → Environment Variables de `expotec-api`, cargar:

| Variable | Valor |
| --- | --- |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | Dirección completa de la cuenta Gmail remitente |
| `SMTP_PASSWORD` | Contraseña de aplicación; marcar Sensitive |
| `PASSWORD_RESET_WEB_ORIGIN` | `https://expotec-web-gn19.vercel.app` |

No copiar la clave al chat, GitHub, al frontend ni a variables `EXPO_PUBLIC_`. Los espacios de separación de la contraseña de aplicación se eliminan al leer la configuración. El envío utiliza TLS con validación de certificado; también se admite el puerto 587 con STARTTLS obligatorio.

4. Aplicar `npm run db:migrate` antes de publicar el backend. La migración aditiva `010_password_recovery.sql` crea los enlaces de recuperación sin modificar cuentas existentes.
5. Volver a desplegar el backend tras guardar las variables. POST `/api/auth/recovery/query` con `{}` devuelve `{ "enabled": true }` cuando la configuración está completa. Esto confirma configuración, no entrega de correos.
6. Abrir Mi cuenta → Olvidé mi contraseña e ingresar el correo de una cuenta propia existente. Revisar Recibidos y Spam. Abrir el enlace del correo, elegir y repetir una contraseña de 12–128 caracteres, guardar e iniciar sesión de nuevo. Comprobar que la contraseña anterior y el enlace ya utilizado no funcionen.

## Comportamiento

- La solicitud siempre responde el mismo mensaje para cuentas existentes, inexistentes o inactivas. No entrega el enlace por la API ni expone errores de Gmail al visitante.
- El enlace contiene 32 bytes aleatorios, vence en 20 minutos y se usa una sola vez. Solo se guarda su hash SHA-256. Al pedir otro, el anterior deja de servir.
- El secreto viaja en el fragmento del enlace y se retira de la dirección del navegador al abrir la pantalla. No se conserva en almacenamiento web. Si se recarga esa pantalla antes de terminar, volver a abrir el enlace del correo.
- La contraseña se guarda con el mismo hash scrypt que el registro. La actualización, el consumo de los enlaces y la revocación de todas las sesiones del usuario son una transacción. No se inicia sesión automáticamente.
- Se envía una notificación de contraseña modificada sin incluir la contraseña. El envío queda asociado a la ejecución de Vercel con `waitUntil`, evitando que el tiempo de SMTP permita distinguir cuentas.
- Límites: 15 pedidos por IP/hora, 3 por correo/hora y 10 intentos de cambio por IP/15 minutos. Las claves de límites se guardan como HMAC.
- Un fallo de envío invalida ese enlace y deja únicamente el código `RESET_MAIL_FAILED` en el registro del servidor. Nunca registrar el destinatario, la contraseña o el token. La notificación posterior usa `RESET_NOTICE_FAILED` si falla.
- `npm run db:prune` elimina los enlaces vencidos. Las pruebas `npm test` y `npm run test:recovery` usan correo simulado; no sustituyen la recepción real con Gmail.

El backend y la contraseña son comunes a web y Android. El enlace del correo abre la web para completar el cambio; la APK aún requiere su verificación independiente.
