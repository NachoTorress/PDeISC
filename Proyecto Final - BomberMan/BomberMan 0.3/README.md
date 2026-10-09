# BomberMan Académico

Proyecto académico en desarrollo. **BomberMan 0.3** conserva la partida de la 0.2 y coloca el juego de Android en horizontal. El tablero y los controles táctiles quedan lado a lado. Consultá [las decisiones y el avance](docs/PROJECT_BRIEF.md) antes de continuar el desarrollo.

## Requisitos

- Node.js 22.13 o superior (se usó Node.js 24 para las pruebas del motor).
- npm.
- Para Android: Expo Go compatible con SDK 57 durante desarrollo, o una cuenta de Expo para EAS Build.

## Instalación y ejecución

Hay un `.env` local en `frontend/` y otro en `backend/`. Los ejemplos versionados (`.env.example`) muestran las variables esperadas. La partida local del hito 1 no necesita API; por eso `EXPO_PUBLIC_API_URL` está vacío. Al conectar la API, configuraremos su URL pública para Android y Vercel. Nunca coloques contraseñas ni claves JWT en variables `EXPO_PUBLIC_*`.

En esta carpeta sincronizada con OneDrive, npm produjo errores al extraer paquetes. Para abrir la app normalmente, usá `Iniciar BomberMan.bat` desde la raíz: instala las dependencias en una caché local y enlaza `node_modules` a esta versión.

```sh
cd frontend
npm install
npm run web
```

En web, movete con **flechas o WASD** y colocá una bomba con **espacio o X**. Para empezar de nuevo, usá **Nueva partida**. El botón del encabezado alterna los temas claro y oscuro.

Para comprobar el cambio de la 0.2, tocá brevemente una flecha: debe avanzar una sola casilla. Si la mantenés pulsada, la repetición empieza después de una pausa y continúa a un ritmo más lento. Soltá la dirección y verificá que se detenga. Probá también cambiar de dirección y colocar una bomba mientras escapás. En Android, comprobá el mismo comportamiento con las flechas táctiles.

En la 0.3, abrí la app en Android con el teléfono horizontal. El tablero debe aparecer a la izquierda y las flechas y la bomba a la derecha, sin tener que desplazarte para jugar. **Nueva partida** queda en la barra superior. El resumen de la partida se puede consultar desplazando la pantalla. La versión web conserva el diseño anterior.

Para probar en Android en la misma red o a distancia, iniciá el túnel desde `frontend/`:

```sh
npm run tunnel
```

Ese script ejecuta `expo start --tunnel`. Abrí la URL o el código QR en Expo Go. En Android aparecen los controles táctiles de movimiento y bomba. El túnel **solo se usa en desarrollo**; una compilación EAS incluye el código de la aplicación y se inicia sin Metro.

`@expo/ngrok` está incluido como dependencia de desarrollo local. Si el túnel tarda en conectar, esperá el mensaje **Tunnel ready** antes de escanear el QR. El QR que aparece al iniciar web también puede abrir la app en Expo Go por red local; **Android con túnel** sirve cuando esa conexión directa no funciona.

## Verificación del hito 1

Desde `frontend/`:

```sh
npm run test:engine
npm run typecheck
npm run lint
npm run export:web
```

Prueba manual: desplazate por el mapa, verificá que paredes y cajas bloquean el paso, colocá una bomba, escapá de su fila o columna, observá la destrucción de cajas y el movimiento del bot. Una explosión puede terminar la partida; **Nueva partida** reinicia el estado.

## APK de prueba

Desde `frontend/`, con una cuenta de Expo autenticada:

```sh
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

`frontend/eas.json` configura el perfil `preview` como APK instalable. El servicio EAS devuelve un enlace al archivo cuando termina la compilación. Aún no se generó ni verificó un APK en este hito; requiere acceso a una cuenta EAS.

## Arquitectura prevista

- `frontend/`: aplicación única Expo, motor en `src/game/`, controles en `src/hooks/`, interfaz en `src/components/` y `src/pages/`.
- `backend/`: reservado para API REST Express/TypeScript y SQL de TiDB Cloud en el hito de backend.
- Web: se exportará con `npm run export:web` y se desplegará en Vercel.
- API: se desplegará como proyecto de Vercel separado de la web.
- En Vercel se importará el mismo repositorio dos veces: un proyecto con raíz `BomberMan 0.x/frontend` y otro con raíz `BomberMan 0.x/backend`, apuntando ambos a la versión publicada.
- TiDB Cloud: será la única base persistente. Ningún secreto irá en el frontend. La conexión SQL y las variables de entorno se documentarán e implementarán con la API.

Las cuentas, roles, mapas administrables, 2P local web, despliegues Vercel y manual APA siguen pendientes. TiDB es compatible con gran parte de MySQL, pero **no es el producto MySQL**; si la evaluación exige MySQL literalmente, será necesario aclararlo con la cátedra.
