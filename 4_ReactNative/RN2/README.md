# Pulso · Laboratorio del dispositivo

Aplicación React Native con **Expo SDK 57**, TypeScript estricto y ESLint. Permite probar cámara, códigos QR y de barras, ubicación GPS, acelerómetro, giroscopio y biometría. Incluye temas claro y oscuro persistentes y un historial local con altas, lectura, edición y baja confirmada dentro de cada tarjeta.

## Instalar y ejecutar

Requisito: Node.js 22.13 o posterior, compatible con React Native 0.86. Se recomienda Node 24 LTS.

```sh
npm install
npm start
```

Escaneá el QR con una versión de Expo Go compatible con SDK 57. Para la vista de navegador:

```sh
npm run web
```

Las herramientas dependen del hardware y de los permisos del dispositivo. **La prueba completa debe hacerse en un teléfono físico con la APK.** Acelerómetro, giroscopio y biometría se habilitan en la aplicación nativa; en web se explica cómo probarlos en un teléfono. Face ID requiere una compilación propia en iOS. El navegador exige localhost o HTTPS para las capacidades protegidas de cámara y ubicación. No se generan datos simulados cuando falta hardware.

## Generar la APK con Expo EAS

El perfil `preview` de `eas.json` genera un **APK**, instalable directamente y sin Metro. El perfil `production` genera un AAB para Play Store.

```sh
npx eas-cli@latest login --browser
npx eas-cli@latest init
npm run build:apk
```

Si este proyecto está dentro de otro repositorio, limitá el paquete a esta carpeta. En PowerShell, desde RN2, ejecutá antes de compilar:

```powershell
$env:EAS_NO_VCS = '1'
$env:EAS_PROJECT_ROOT = (Get-Location).Path
npm run build:apk
```

`eas init` vincula esta carpeta con tu cuenta y escribe el identificador real del proyecto. Al compilar por primera vez, EAS puede crear las credenciales de firma de Android. No se incluyen credenciales ni identificadores inventados. Al finalizar, EAS devuelve el enlace de descarga del APK; también se puede consultar con:

```sh
npx eas-cli@latest build:list --platform android --status finished
```

El inicio de sesión abre el navegador y admite la cuenta creada con Google. Este proyecto ya está vinculado a la cuenta con la que se generó la entrega; para usar otra cuenta debe vincularse a un proyecto propio. La compilación en la nube requiere una cuenta de Expo, conexión y disponibilidad de EAS. No se debe confundir el ZIP del código fuente con un APK compilado.

## Verificar

```sh
npm run check
npm run doctor
npm run build:web
```

Las pruebas automáticas verifican límites y tipos de los datos persistidos, coordenadas negativas válidas, valores no finitos, límites de texto, fechas y rutas de fotos. El archivo `docs/PRUEBAS.md` contiene las pruebas manuales de dispositivo; no se presentan como ejecutadas si no hay un teléfono disponible.

## Organización y recorrido de los datos

```text
index.ts                    Entrada de Expo
src/main.tsx                Registra la raíz nativa y web
src/app.tsx                 Proveedores y navegación
src/components/             Controles, formularios y tarjetas reutilizables
src/pages/                  Inicio, historial y pantalla de cada herramienta
src/contexts/               Preferencias y operaciones CRUD
src/hooks/                  GPS, sensores y ciclo de vida
src/services/               Persistencia, archivos privados y tema web
src/styles/                 Paletas nativas y CSS claro/oscuro web
src/types/                  Contratos de registros y mediciones
src/utils/                  Validación y presentación de fechas
tests/                      Pruebas de validación
docs/                       Manual y matriz de pruebas
```

Flujo: **herramienta del dispositivo → resultado validado → formulario reutilizable → RecordsContext → almacenamiento local → Mis registros**. Las escrituras se serializan; un error de escritura conserva el estado anterior. Los datos recuperados se validan antes de aceptarse. Si la lectura falla, se bloquean las modificaciones y se ofrece reintentar sin sobrescribir los datos.

Las fotografías se copian de la caché de la cámara al directorio privado permanente de Pulso al guardar. En web, Expo entrega una imagen `data:` guardada con el registro; el cupo de almacenamiento del navegador es menor y se informa si se agota. Solo se borran archivos dentro del directorio propio de fotos. La fecha original no cambia al editar.

## Decisiones de plataforma

- **React Native usa Metro y estilos nativos**, no Vite o Bootstrap, que corresponden al DOM de React web. La misma aplicación se adapta a móvil, tableta y escritorio mediante medidas flexibles. En web Expo crea el contenedor raíz; `main.tsx` lo renderiza y se añade la clase `root`.
- `src/styles/light.css` y `src/styles/dark.css` contienen ambos temas del navegador. `palettes.ts` aplica los mismos colores a Android e iOS, donde CSS no existe. El control de tema está implementado y la preferencia persiste.
- No hay servidor, API, cuentas ni base de datos relacional: no son necesarios para probar hardware y guardar registros locales. Por eso no se agregan backend, puertos, SQL, inicio de sesión o recuperación de contraseñas. No se realizan peticiones HTTP GET desde el código de la aplicación; los métodos de lectura de los SDK son APIs locales.
- Los únicos campos de texto son títulos y notas, con validación inmediata. Un título puede contener números; no representa un nombre personal. No se piden edades, fechas de nacimiento ni datos personales ajenos a la consigna.
- Se usa navegación inferior en móvil y lateral en escritorio, sin un menú hamburguesa innecesario. El botón «Volver arriba» aparece en las pantallas desplazadas más de 520 puntos.
- No se usan `alert`, `confirm`, `require`, enlaces de descarga, exportaciones, borrados masivos o casillas de selección en la aplicación. La ventana biométrica y los permisos son diálogos del sistema operativo.
- Las lecturas GPS y de movimiento se detienen al salir de la pantalla o minimizar la aplicación. No se solicita ubicación en segundo plano ni permiso de micrófono.
- Los datos locales se eliminan al desinstalar la app o borrar sus datos. La demostración biométrica no cifra ni bloquea el historial: únicamente muestra la autenticación del sistema, sin acceso a huellas o rostros.

## Documentación

El manual breve está en `docs/MANUAL_USUARIO.md`, con estructura y referencias APA 7. La descripción técnica, la matriz de pruebas y `docs/REVISION_FRONTEND.md` completan la documentación del proyecto.

Las correcciones de cámara web, cancelación inicial de GPS Android y altura/desplazamiento del historial están documentadas en `docs/CORRECCIONES_1.0.1.md`. La versión 1.0.1 se instala sobre la anterior con la misma firma y conserva los registros existentes.

## Fuentes oficiales

- Expo. (2026). *Expo SDK 57*. https://expo.dev/changelog/sdk-57
- Expo. (s. f.). *Camera*. https://docs.expo.dev/versions/v57.0.0/sdk/camera/
- Expo. (s. f.). *Location*. https://docs.expo.dev/versions/v57.0.0/sdk/location/
- Expo. (s. f.). *Sensors*. https://docs.expo.dev/versions/v57.0.0/sdk/sensors/
- Expo. (s. f.). *LocalAuthentication*. https://docs.expo.dev/versions/v57.0.0/sdk/local-authentication/
- Expo. (s. f.). *Build APKs for Android Emulators and devices*. https://docs.expo.dev/build-reference/apk/
