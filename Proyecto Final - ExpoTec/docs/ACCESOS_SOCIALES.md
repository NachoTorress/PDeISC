# Google, Discord y GitHub — preparación del hito 7J

Actualización del 25/10/2026: la [revisión funcional del 22/10](PRUEBAS_FINALES.md) registra los tres proveedores habilitados en producción y la confirmación previa del usuario de acceso real en web. Android ya tiene Google nativo y retorno por navegador para Discord y GitHub; el usuario confirmó expresamente Google nativo el 25/10. Consultar [Google Android](ANDROID_GOOGLE.md), [APK](APK_PRUEBA.md) y los [manuales actuales](README.md). Los párrafos de preparación fechados el 21/10 que siguen conservan el estado histórico del hito y no indican que hoy falte su implementación.

Estado al 21/10/2026: integración web implementada y comprobada con respuestas controladas de los proveedores. El usuario confirmó que todavía no creó las aplicaciones OAuth. **La activación y las pruebas con cuentas reales siguen pendientes.** Cada botón aparece únicamente cuando su proveedor está configurado en el backend. El correo y la contraseña de ExpoTec siguen disponibles.

## Crear las aplicaciones

Usar el nombre **ExpoTec** y la página principal [ExpoTec](https://expotec-web-gn19.vercel.app). Registrar estas direcciones de retorno exactas, sin barra adicional al final:

| Proveedor | Dirección de retorno autorizada |
| --- | --- |
| Google | `https://expotec-web-gn19.vercel.app/api/auth/social/google/callback` |
| Discord | `https://expotec-web-gn19.vercel.app/api/auth/social/discord/callback` |
| GitHub | `https://expotec-web-gn19.vercel.app/api/auth/social/github/callback` |

### Google

1. Entrar en [Google Cloud Console](https://console.cloud.google.com/) y crear o elegir un proyecto propio para ExpoTec.
2. Configurar Google Auth Platform: nombre de la aplicación, correo de soporte, contacto y audiencia. En modo de prueba agregar las cuentas autorizadas como usuarios de prueba. Completar las verificaciones que indique Google antes de abrir el acceso al público.
3. En **Clients**, crear un cliente OAuth de tipo **Web application**. Agregar la dirección de retorno de Google indicada arriba en los URI de redirección autorizados.
4. Conservar el identificador y el secreto del cliente en la configuración privada del backend. El flujo redirige a Google desde el servidor; no utiliza un widget JavaScript ni necesita exponer el secreto al navegador.

La integración solicita `openid email profile` y consulta el perfil con el token recibido por el backend. Exige correo verificado y usa el identificador estable `sub`. No consume un ID token como credencial ni guarda tokens de Google. Referencias: [crear credenciales](https://developers.google.com/workspace/guides/create-credentials), [flujo de servidor](https://developers.google.com/identity/protocols/oauth2/web-server), [UserInfo e identidad estable](https://developers.google.com/identity/openid-connect/openid-connect).

### Discord

1. Entrar en [Discord Developer Portal](https://discord.com/developers/applications), crear una aplicación ExpoTec y completar sus datos.
2. En **OAuth2**, agregar la dirección de retorno de Discord de la tabla y guardar.
3. Conservar el Client ID y Client Secret para el backend. Se usa un cliente confidencial de servidor; no habilitarlo como cliente público para este flujo.

Se solicitan únicamente `identify email`; no se requiere un bot ni permisos de servidores. El correo debe estar verificado. Referencia: [OAuth2 de Discord](https://docs.discord.com/developers/topics/oauth2).

### GitHub

1. Entrar en [Developer settings → OAuth Apps](https://github.com/settings/developers) y crear una **OAuth App** ExpoTec.
2. Usar la página principal indicada y completar **Authorization callback URL** con el retorno de GitHub de la tabla.
3. Generar el Client Secret y conservarlo, junto con el Client ID, en el backend.

Se solicita `user:email`, sin acceso a repositorios. Se consulta el identificador estable de GitHub y se exige un correo principal verificado, aunque el perfil público no muestre el correo. Referencias: [crear una OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app), [autorización web](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps), [correos del usuario](https://docs.github.com/en/rest/users/emails).

## Configurar ExpoTec

En el proyecto **expotec-api** de Vercel, agregar para Production:

```text
SOCIAL_WEB_ORIGIN=https://expotec-web-gn19.vercel.app
SOCIAL_GOOGLE_CLIENT_ID=<identificador de Google>
SOCIAL_GOOGLE_CLIENT_SECRET=<secreto de Google>
SOCIAL_DISCORD_CLIENT_ID=<identificador de Discord>
SOCIAL_DISCORD_CLIENT_SECRET=<secreto de Discord>
SOCIAL_GITHUB_CLIENT_ID=<identificador de GitHub>
SOCIAL_GITHUB_CLIENT_SECRET=<secreto de GitHub>
```

Configurar únicamente los pares de proveedores ya creados; omitir ambos valores de los demás. Un par incompleto impide iniciar el backend para evitar una configuración ambigua. El origen de la web debe ser exacto y figurar en `CORS_ORIGINS`. No usar `EXPO_PUBLIC_`, no copiar secretos a la web, al repositorio ni al chat. Después de cambiar las variables, volver a desplegar la API.

Aplicar las migraciones `007_social.sql` y `008_social_browser.sql` con `npm run db:migrate` antes de publicar. Agrega identidades y accesos temporales; conserva las cuentas, contraseñas y permisos existentes. El usuario de aplicación necesita sus permisos habituales SELECT/INSERT/UPDATE/DELETE sobre las nuevas tablas. `npm run db:prune` retira accesos temporales vencidos; programar o ejecutar esta limpieza periódicamente. No borra identidades vinculadas.

Para desarrollo, usar aplicaciones separadas con retornos registrados hacia `http://localhost:5173/api/auth/social/<proveedor>/callback` y `SOCIAL_WEB_ORIGIN=http://localhost:5173`. Mantener la API a través del proxy `/api` del frontend para las cookies. El backend permite HTTP únicamente con localhost o 127.0.0.1 fuera de producción. Los despliegues Preview requieren sus propias aplicaciones y orígenes; no reutilizar retornos arbitrarios.

## Comportamiento implementado

1. **Ingresar → Continuar con…**, desde la barra superior, abre la autorización del proveedor en la misma pestaña.
2. Una cuenta nueva elige nombre, apellido, invitado/alumno y una contraseña propia de ExpoTec de 12–128 caracteres, con repetición en pantalla. No se asignan permisos de organización.
3. Si el correo verificado ya existe en ExpoTec, el usuario debe introducir su contraseña de ExpoTec y pulsar **Vincular e ingresar**. Nunca se vinculan cuentas solamente porque coinciden sus correos.
4. Una identidad ya vinculada entra automáticamente al volver del proveedor, sin un segundo botón de ingreso ni otra contraseña. Vuelve a la misma cuenta mediante su identificador estable. No cambia el correo ni los permisos de ExpoTec si cambia el perfil externo. Cada usuario puede vincular como máximo una identidad por proveedor; una identidad externa pertenece a un único usuario.
5. La sesión conserva la cookie HttpOnly y el acceso en memoria del hito 7B. Se restaura al abrir la aplicación, se comprueba al volver a ella y se renueva al realizar solicitudes, sin pedir una actualización manual. Si falla la conexión, Mi cuenta ofrece reintentar. Cerrar sesión revoca la sesión actual de ExpoTec; no cierra sesiones del proveedor. No hay desvinculación desde la interfaz en este hito.

La autorización requiere estado aleatorio, retorno fijo, una cookie temporal HttpOnly del navegador y prueba de posesión de la pestaña. El callback pasa por el proxy `/api` de la web para recibir esa cookie; no se registra la URL directa del backend como retorno. La cookie temporal es SameSite=Lax para permitir el GET de retorno desde el proveedor, y en producción usa Secure y el prefijo `__Host-`. La cookie de sesión sigue siendo SameSite=Strict. Una autorización iniciada desde otro navegador no puede reclamarse, aunque se copie el enlace del proveedor. Google y GitHub usan además PKCE S256. Discord usa el intercambio confidencial con Client Secret y estado; no se presupone soporte PKCE. Los tokens del proveedor se usan en el servidor para consultar la identidad y se descartan. La URL de retorno solo incluye un identificador temporal; no contiene sesión de ExpoTec, contraseña, prueba de pestaña ni tokens del proveedor.

Cada flujo vence a los diez minutos y solo permite una sesión final. El código se reclama una vez antes del intercambio. La prueba temporal vive en sessionStorage de la pestaña, se elimina al completar/cancelar y no es un token de sesión. Si se cierra la pestaña, se niega el consentimiento, no hay correo verificado, falta conexión o vence el plazo, reiniciar desde Mi cuenta. Las cuentas inactivas no ingresan. El alta, vínculo y sesión se confirman en la misma transacción; los conflictos no dejan cuentas o vínculos parciales.

## Verificación y tareas de activación

`npm test` en backend cubre configuración, autorización, intercambio de los tres proveedores con respuestas controladas, correo verificado, ocultación de secretos, estado de un uso y origen de las solicitudes. `npm run test:social` usa exclusivamente `expotec_test_*`: alta con contraseña, ingreso por correo, vínculo con prueba de contraseña, mismo UUID, rechazo de segundo vínculo del mismo proveedor, reintentos, simultaneidad, cuenta inactiva, cancelación, mezcla de proveedores y vencimiento. Limpia solo sus datos. Las pruebas de frontend cubren adopción de sesión sin persistir tokens y la prueba temporal de pestaña.

Antes de declarar terminado 7J, comprobar con **cada proveedor real**: consentimiento, cancelación, correo no verificado/no disponible, registro nuevo con contraseña, ingreso posterior por correo, vínculo con cuenta existente, rechazo de contraseña incorrecta, ingreso posterior con proveedor, recarga, cierre, vencimiento y segunda pestaña. Comprobar qué usuarios pueden entrar según el estado de publicación de la aplicación externa. Las pruebas simuladas no sustituyen estos pasos.

Al preparar este hito el 21/10, el alcance era **web** y Android, recuperación y carga de archivos quedaban para después. Esas funciones ya se incorporaron; sus detalles y verificaciones posteriores están enlazados en la actualización al inicio de este documento.
