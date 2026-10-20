# BomberMan Académico

Proyecto académico en desarrollo. **BomberMan 0.5** amplía el tablero, adopta el mando del Snake anterior y suma dos bots en 1P y un duelo 2P local en web. Android mantiene el juego horizontal con flechas a la izquierda, tablero al centro y bomba a la derecha. Consultá [las decisiones y el avance](docs/PROJECT_BRIEF.md) antes de continuar el desarrollo.

## Requisitos

- Node.js 22.13 o superior (se usó Node.js 24 para las pruebas del motor).
- npm.
- Para Android: Expo Go compatible con SDK 57 durante desarrollo, o una cuenta de Expo para EAS Build.

## Instalación y ejecución

Hay un `.env` local en `frontend/` y otro en `backend/`. Los ejemplos versionados (`.env.example`) muestran las variables esperadas. La partida local del hito 2 no necesita API; por eso `EXPO_PUBLIC_API_URL` está vacío. Al conectar la API, configuraremos su URL pública para Android y Vercel. Nunca coloques contraseñas ni claves JWT en variables `EXPO_PUBLIC_*`.

En esta carpeta sincronizada con OneDrive, npm produjo errores al extraer paquetes. Para abrir la app normalmente, usá `Iniciar BomberMan.bat` desde la raíz: instala las dependencias en una caché local y enlaza `node_modules` a esta versión.

```sh
cd frontend
npm install
npm run web
```

En web, elegí **1P contra bots** o **2P local**. J1 se mueve con **flechas o WASD** y coloca una bomba con **espacio o X**; J2 se mueve con **IJKL** y coloca una bomba con **O**. Ambos pueden jugar a la vez en el mismo teclado. En 1P hay dos bots y la victoria requiere eliminar a ambos. **Nueva partida** reinicia el modo elegido. El botón de tema alterna los modos claro y oscuro.

Para comprobar el cambio de la 0.2, tocá brevemente una flecha: debe avanzar una sola casilla. Si la mantenés pulsada, la repetición empieza después de una pausa y continúa a un ritmo más lento. Soltá la dirección y verificá que se detenga. Probá también cambiar de dirección y colocar una bomba mientras escapás. En Android, comprobá el mismo comportamiento con las flechas táctiles.

En Android, abrí la app con el teléfono horizontal. El tablero debe quedar centrado y ocupar el espacio libre entre el mando a la izquierda y la bomba a la derecha. El mando tiene arriba en una fila e izquierda, abajo y derecha debajo, como el Snake anterior. Hay controles de **Nueva partida** y tema junto a la bomba. El resumen se puede consultar desplazando la pantalla. La opción 2P aparece solo en web. La aplicación solicita ocultar ambas barras del sistema; un gesto desde el borde puede mostrar una barra temporalmente. En Expo Go, el resultado depende de la versión de Android y de la navegación por gestos.

Para probar en Android en la misma red o a distancia, iniciá el túnel desde `frontend/`:

```sh
npm run tunnel
```

Ese script ejecuta `expo start --tunnel`. Abrí la URL o el código QR en Expo Go. En Android aparecen los controles táctiles de movimiento y bomba. El túnel **solo se usa en desarrollo**; una compilación EAS incluye el código de la aplicación y se inicia sin Metro.

`@expo/ngrok` está incluido como dependencia de desarrollo local. Si el túnel tarda en conectar, esperá el mensaje **Tunnel ready** antes de escanear el QR. El QR que aparece al iniciar web también puede abrir la app en Expo Go por red local; **Android con túnel** sirve cuando esa conexión directa no funciona.

Si Expo muestra `Cannot read properties of undefined (reading 'body')` o `remote gone away`, el túnel puede estar temporalmente indisponible aunque ngrok informe que sus sistemas están operativos. En `Iniciar BomberMan.bat`, la opción 2 intenta automáticamente la red local cuando falla el túnel. También podés elegir la opción 5 para ir directo a la red local. En ambos casos, celular y computadora deben estar en la misma Wi-Fi; esperá el QR de Expo Go. La opción 5 inicia `expo start --lan` desde la instalación local de esta versión y no requiere instalar paquetes nuevos.

## Verificación del hito 2

Desde `frontend/`:

```sh
npm run test:engine
npm run typecheck
npm run lint
npm run export:web
npm run export:android
```

Prueba manual web: desplazate por el mapa, verificá que paredes y cajas bloquean el paso, colocá una bomba, escapá de su fila o columna y observá destrucción, daño y condiciones de victoria. Confirmá que los dos bots se mueven, evitan peligro cuando pueden y colocan bombas. Elegí 2P local y comprobá movimiento y bombas simultáneas con los dos esquemas del teclado, victoria de J1/J2 y empate. Probá **Nueva partida** y ambos temas.

Prueba manual Android: comprobá el diseño horizontal en tu teléfono, una casilla por toque breve, repetición lenta al mantener pulsado, colocación de bomba, daño y reinicio. La compilación automática y las pruebas del motor pasaron; la prueba visual y táctil en el dispositivo todavía está pendiente.

## APK de prueba

Desde `frontend/`, con una cuenta de Expo autenticada:

```sh
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

`frontend/eas.json` configura el perfil `preview` como APK instalable e independiente del servidor de desarrollo. El servicio EAS devuelve un enlace al archivo cuando termina la compilación. Hasta generar e instalar ese archivo, la verificación del APK sigue pendiente; requiere una sesión de Expo autorizada.

## Arquitectura prevista

- `frontend/`: aplicación única Expo, motor en `src/game/`, controles en `src/hooks/`, interfaz en `src/components/` y `src/pages/`.
- `backend/`: reservado para API REST Express/TypeScript y SQL de TiDB Cloud en el hito de backend.
- Web: se exportará con `npm run export:web` y se desplegará en Vercel.
- API: se desplegará como proyecto de Vercel separado de la web.
- En Vercel se importará el mismo repositorio dos veces: un proyecto con raíz `Proyecto Final - BomberMan/BomberMan 0.x/frontend` y otro con raíz `Proyecto Final - BomberMan/BomberMan 0.x/backend`, apuntando ambos a la versión publicada.
- TiDB Cloud: será la única base persistente. Ningún secreto irá en el frontend. La conexión SQL y las variables de entorno se documentarán e implementarán con la API.

Las cuentas, roles, mapas administrables, despliegues Vercel y manual APA siguen pendientes. TiDB es compatible con gran parte de MySQL, pero **no es el producto MySQL**; si la evaluación exige MySQL literalmente, será necesario aclararlo con la cátedra.
