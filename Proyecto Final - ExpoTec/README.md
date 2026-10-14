# ExpoTec

Prototipo de organización escolar migrado a **React Native con Expo SDK 57**. El código activo está en `frontend/native`; la versión anterior de Vite queda en `frontend/web` como referencia. La generación del APK quedó para una etapa posterior, como indicó el usuario.

Los datos y perfiles de las pantallas son de ejemplo y todavía no se sincronizan entre dispositivos. El primer bloque del backend ya implementa cuentas, sesiones y permisos; la aplicación aún no se conecta a esa API.

La [web pública](https://expotec-web-gn19.vercel.app) ya está en Vercel. La API está publicada por separado en `https://expotec-api-gn19.vercel.app` y conectada a TiDB. Los pasos para probarla y actualizar los despliegues están en [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md).

## Instalar y abrir

Requisitos: Node.js 24.3 o posterior y npm.

```powershell
cd "frontend/native"
npm install
npx expo start
```

`npm start` ejecuta el mismo comando, porque el script `start` de `package.json` es `expo start`.

Escanear el QR con Expo Go compatible con SDK 57 en Android. El teléfono y la computadora deben poder comunicarse por la misma red. Para un emulador ya configurado, usar `npm run android`.

Para revisar las mismas pantallas en el navegador:

```powershell
npm run web
```

La dirección y el QR aparecen en la terminal. No abrir `index.html` directamente. El puerto puede indicarse con `npm start -- --port 8082`.

## Comprobar

```powershell
npm run typecheck
npm run lint
npm test
npm run export:android
npm run export:web
```

La exportación Android comprueba el empaquetado JavaScript y los recursos; no genera ni prueba un APK. Para abrir la exportación web:

```powershell
$env:PORT = "5173"
npm run preview
```

La configuración de `eas.json` incluye el perfil `preview` para un APK futuro. Su generación e instalación se realizarán después; requieren preparar EAS y probar en Android.

## Funciones de esta etapa

- Mapa de aulas y patio, con consulta del proyecto que ocupa cada mesa.
- Organización: crear, modificar y eliminar espacios sin referencias; agregar mesas, bancos, puntos eléctricos y etiquetas; arrastrar, girar y cambiar el tamaño de las mesas con tiradores. Guardar o cancelar la edición.
- Estudiante de ejemplo: presentar y editar propuestas con varios integrantes, imagen, profesores, materias, mesa y recursos. Video opcional.
- Proyectos informáticos: enlaces opcionales al repositorio de GitHub y a la página del proyecto, validados mientras se escriben.
- Profesor asignado: confirmar o solicitar cambios. La confirmación comprueba mesa y stock y ocupa el lugar automáticamente.
- Inventario: alta, modificación y eliminación con protección de reservas, préstamos e historial.
- Préstamos: entrega y devolución parcial o completa en cada una de las tres jornadas. Un elemento no devuelto continúa prestado al cambiar de día.
- Invitado: muestra pública de los proyectos confirmados, sin edición.
- Presentación en TV: avance automático de fichas, reproducción de videos y paso al siguiente cuando terminan.
- Temas claro y oscuro separados, navegación adaptable, retroceso nativo, validación inmediata y confirmaciones dentro de la interfaz.

## Guía breve de uso

**Probar vista como** permite cambiar entre perfiles ficticios. Es una herramienta de demostración y no un inicio de sesión. El estudiante de ejemplo es Lucía Fernández; el profesor es Martín García.

En **Espacios → Acomodar espacio**, mantener una pieza de la paleta (Mesa, Banco, Toma o Zona) y arrastrarla al plano. Se crea únicamente al soltarla dentro; tocarla o soltarla fuera no agrega elementos. Seleccionar un objeto existente y arrastrarlo lo mueve; los tiradores achican o agrandan las mesas. **Girar** cambia su orientación. Arrastrar **Zona** agrega una etiqueta cuyo texto se edita en el inspector. **Guardar plano** conserva los cambios; **Cancelar** descarta el borrador. La eliminación requiere confirmación dentro del editor. Con teclado, Enter o Espacio sobre una pieza de la paleta la coloca en el centro; los lectores de pantalla ofrecen la misma acción. Escape cancela un gesto activo. Los campos de texto continúan editables y seleccionables.

En **Proyectos → Presentar proyecto**, completar los campos rotulados. **Agregar integrante** añade compañeros; quitar uno pide confirmación. El creador y el alumno que edita permanecen incluidos. Al marcar **Proyecto informático**, aparecen GitHub y página; son opcionales. Desmarcar con enlaces cargados solicita confirmación antes de quitarlos.

El profesor revisa su propuesta desde **Ver proyecto**. Una confirmación reserva mesa y elementos; una devolución indica qué debe corregir el equipo. Organización puede reabrir una propuesta cuando no hay préstamos pendientes.

En **Préstamos**, elegir la jornada y entregar elementos a los proyectos confirmados. Registrar devoluciones en la tarjeta de cada entrega, indicando la cantidad; se conserva el saldo pendiente.

## Datos y migración

El esquema local conserva equipos, mesas, tamaños, etiquetas, recursos, revisiones y préstamos del prototipo anterior. Los proyectos antiguos sin equipo se convierten en equipos de un integrante. El almacenamiento utiliza la misma clave `expotec-design-v1`. En la vista web, los datos anteriores se conservan al abrir desde el mismo origen (por ejemplo `http://127.0.0.1:5173`). Otra dirección o puerto tiene almacenamiento independiente.

Cada teléfono guarda sus propios datos en un archivo local con respaldo, para que las fotos no excedan el límite por registro de AsyncStorage. AsyncStorage conserva la preferencia del tema y los datos de la vista web. Los datos de una computadora no se transfieren automáticamente al teléfono. Si la lectura de datos guardados falla, la app muestra un aviso y evita sobrescribirlos. Una futura API reemplazará esta persistencia local.

No ingresar información privada ni usar la demostración para organizar la exposición real. Los puntos eléctricos son referencias de ejemplo: no calculan cargas ni certifican la seguridad de la instalación.

## Estructura

```text
frontend/native/
  index.ts             Entrada Expo
  app.json             Configuración SDK y permisos
  eas.json             Perfiles para compilaciones futuras
  src/
    main.tsx           Registro de la aplicación
    app.tsx            Navegación y composición
    components/        Controles, plano y formularios modulares
    pages/             Espacios, proyectos, inventario, préstamos y muestra
    contexts/          Datos locales y tema
    hooks/             Acceso al estado compartido
    lib/               Tipos, reglas, validaciones y pruebas
    theme/             Paletas claras y oscuras independientes
frontend/web/          Prototipo anterior, conservado como referencia
backend/               API Express, cuentas, sesiones, permisos y SQL para TiDB
```

## Backend y despliegue — hito 7A

Por decisión del 14/10/2026, la base se aloja en **TiDB** y hay **dos proyectos en Vercel**: `expotec-web` para `frontend/native` (exportación web de Expo) y `expotec-api` para `backend` (Express). Android utilizará la misma API. TiDB tiene `expotec`, sus migraciones y un usuario limitado de aplicación. Ambos proyectos están publicados; la API confirma su conexión a la base y acepta el origen de la web.

El backend incluye registro como alumno, ingreso con correo y contraseña, JWT de acceso, renovación rotativa, revocación y cierre de sesión. Comprueba los permisos en la base y permite a un administrador asignar responsabilidades sin que una cuenta nueva pueda concedérselas. El SQL normaliza usuarios, roles y sesiones, y las migraciones tienen un registro de aplicación.

Para preparar el backend:

```powershell
cd backend
npm ci
Copy-Item .env.example .env
```

Esos pasos corresponden a una instalación nueva: no reemplazar el `.env` existente de esta computadora. Para crear otra base, seguir la guía de `.env.setup` y `db:setup` en backend/README.md. `npm test` comprueba la API localmente con almacenamiento controlado; las 18 pruebas pasaron. `npm run test:database` requiere una base vacía exclusiva de pruebas y comprueba SQL y concurrencia reales; pasó contra TiDB el 14/10/2026 en `expotec_test_01`. También se comprobaron los endpoints públicos de salud, conexión, sesión sin token y CORS desde Vercel.

La [documentación de la API](backend/README.md) detalla todos los métodos, rutas, permisos, cuerpos, respuestas y errores. Las consultas usan POST mientras se confirma la restricción sobre GET de la consigna. La [guía de TiDB y Vercel](docs/DESPLIEGUE.md) explica raíces de los dos proyectos, variables y orden de configuración. Las credenciales de base y `JWT_SECRET` se guardan exclusivamente en el backend.

El frontend conserva sus perfiles ficticios hasta implementar las pantallas de acceso y conectar los datos de proyectos, espacios e inventario al servidor. La API de cuentas todavía no equivale a una aplicación completa lista para datos reales.

## Entrega final pendiente

Integración de pantallas con el backend, entidades y transacciones de ExpoTec en TiDB, persistencia segura de sesión, tres proveedores sociales, recuperación de contraseña, permisos de proyectos/préstamos en servidor, pruebas contra los servicios reales, manual final en APA y APK probado. El alcance está en [docs/REQUISITOS.md](docs/REQUISITOS.md).

Las fechas, el plano real, el relevamiento eléctrico, los proveedores externos y el almacenamiento de videos requieren definición antes de reemplazar los ejemplos. El prototipo usa enlaces directos MP4/WebM; su reproducción final depende del formato compatible con cada dispositivo.

[PRODUCT.md](PRODUCT.md) documenta el producto y [DESIGN.md](DESIGN.md) sus decisiones visuales. El repositorio Git está en la carpeta superior `PDelSC`; las credenciales se excluyen mediante el `.gitignore` de ExpoTec.

La conservación de datos y las comprobaciones de esta migración están en [docs/MIGRACION_EXPO.md](docs/MIGRACION_EXPO.md).

