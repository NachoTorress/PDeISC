# Proyecto académico: BomberMan

## Decisiones confirmadas

- La carpeta del proyecto `Proyecto Final - BomberMan` pertenece al repositorio Git de `PDelSC`, conectado a GitHub. Dentro de ella hay carpetas por versión (`BomberMan 0.1`, `BomberMan 0.2`, etc.). Antes de un cambio importante se copia la última versión a una nueva carpeta, preservando las anteriores. `Iniciar BomberMan.bat` abre la versión elegida y `Crear version.bat` prepara la siguiente.

- Una sola aplicación React Native con Expo SDK 57 y TypeScript para web y Android; no usar Vite ni migrar de SDK.
- Desarrollo móvil con `npx expo start --tunnel`. El APK de EAS Build debe funcionar sin servidor de desarrollo.
- Web y API REST como dos proyectos distintos de Vercel conectados al mismo repositorio `PDelSC`: directorios raíz `Proyecto Final - BomberMan/BomberMan 0.x/frontend` y `Proyecto Final - BomberMan/BomberMan 0.x/backend` para la versión publicada. Al publicar una versión nueva, actualizar ambos directorios raíz.
- Cada frontend y backend tiene `.env` local ignorado por Git y `.env.example` versionado. En Expo, solo `EXPO_PUBLIC_API_URL` es público; las credenciales de TiDB y los secretos JWT pertenecen exclusivamente al backend y a las variables de entorno de Vercel.
- TiDB Cloud es la única base de datos persistente. El frontend accede exclusivamente al backend, sin credenciales de base de datos. SQL y conexión compatible con TiDB y Vercel.
- APKs instalables mediante EAS Build para probar hitos.
- Interfaz, mensajes y documentación en español.
- En Android, el juego se orienta horizontalmente; muestra flechas a la izquierda, tablero centrado y bomba a la derecha, y solicita ocultar ambas barras del sistema durante la partida. La web conserva su diseño adaptable. En la 0.5 el tablero usa más espacio y el mando táctil sigue la disposición de `JS3Juegos/Snake_1.2`: arriba en una fila, izquierda/abajo/derecha debajo.
- Web: 1P contra bots y 2P local con el mismo teclado. Android: 1P contra bots con controles táctiles, sin opción 2P. 2P online fuera de alcance.
- Motor compartido y separado de controles e interfaz: tablero, movimiento, colisiones, bloques, bombas, explosiones, daño, eliminación y victoria. IA sencilla que se mueve, evita peligro cuando puede y coloca bombas.
- Registro e inicio de sesión, recuperación de contraseña, Google, Facebook y un tercer proveedor común a web y Android; JWT de acceso y renovación, sesión persistente y cierre de sesión con confirmación estilizada.
- Roles `user`, `creator` y `admin`. Solicitud de creador, moderación por admin y CRUD de mapas propios por creadores. Permisos comprobados en backend y reflejados en UI. Confirmación contextual para eliminar, sin `alert` ni `confirm` nativos.
- Backend Node.js, Express, TypeScript y módulos ES. REST con GET, POST, PATCH/PUT y DELETE según la operación. Variables de entorno para puertos y credenciales. SQL de tablas, índices y datos iniciales en `backend/sql/`, modelo hasta 3FN, contraseñas con hash seguro, validación de entradas, permisos y liberación de recursos.
- README de instalación, entorno, túnel, TiDB, Vercel y EAS. Documentación de API y manual de usuario en APA. Código ordenado, ESLint, temas claro y oscuro, diseño adaptable, accesibilidad y fechas DD/MM/AA.

## Hitos

1. **Partida local jugable:** estructura Expo SDK 57; TypeScript; web/Android; temas; mapa, movimiento, bombas y un bot. Verificar construcción web y lógica del motor.
2. **Juego completo:** bloques destructibles, daño, eliminación, victoria, IA y 2P local web; controles táctiles Android. Verificación de partidas y compilación de APK de prueba.
3. **Backend y cuentas:** TiDB Cloud, API REST, autenticación y roles; configuración Vercel. Verificar endpoints y permisos.
4. **Mapas y publicación:** editor, CRUD, solicitudes y panel admin. Verificar flujos completos.
5. **Entrega:** despliegues, APK instalable, documentación y pruebas finales.

## Próximas mejoras del juego

- Incorporar sprites para personajes, bloques, bombas y explosiones.
- Mejorar la fluidez del movimiento, los controles y las animaciones. El usuario probó la versión 0.1 y señaló que funciona, pero todavía se siente poco fluida.
- Agregar poderes durante la partida. Sus efectos concretos se definirán antes de implementarlos.
- Ampliar y ajustar la IA de los dos bots introducidos en la 0.5, a partir de las pruebas de juego.

Sprites, poderes y más trabajo de fluidez quedan pendientes. Los dos bots sí están implementados desde la 0.5.

## Estado actual

La versión 0.1 contiene una primera partida local 1P contra un bot. En la 0.2 se mejoró la fluidez y se corrigió la velocidad de movimiento tras la prueba del usuario: confirmó que ahora se siente mejor. La 0.4 centró el tablero en Android horizontal, separó flechas y bomba y solicitó ocultar la barra inferior del sistema. La 0.5 toma como referencia el mando del Snake anterior, agranda el tablero, añade un segundo bot en 1P y habilita 2P local con teclado solo en web. Las reglas compartidas, pruebas del motor, comprobación de tipos, ESLint y exportaciones web y Android pasaron. Falta validar la experiencia en un teléfono real y completar una compilación EAS instalable.

La instalación directa en OneDrive tuvo errores de extracción; el lanzador usa dependencias en `%LOCALAPPDATA%\BomberMan\dependencies` enlazadas al frontend. El túnel de Expo presentó `Cannot read properties of undefined (reading 'body')` en el dispositivo del usuario y `remote gone away` en esta máquina, pero un reintento llegó a **Tunnel ready**: el fallo es intermitente. El lanzador conserva `expo start --tunnel` y, si falla, inicia `expo start --lan`; también ofrece LAN directamente. La opción LAN produjo un QR válido y exige celular y computadora en la misma Wi-Fi.

Los cambios nuevos se dejan sin commit para que el usuario pueda confirmarlos en GitHub Desktop, abierto en `PDelSC`, y luego enviarlos a GitHub con **Push origin**. El historial del repositorio anidado creado anteriormente se conserva en una copia local ignorada por Git; el historial principal y su remoto pertenecen a `PDelSC`.

TiDB, autenticación, editor de mapas, despliegues Vercel y APK real requieren hitos posteriores y credenciales externas.

Al retomar el trabajo, leer este archivo antes de cambiar arquitectura o alcance y actualizarlo ante nuevos requisitos del usuario.
