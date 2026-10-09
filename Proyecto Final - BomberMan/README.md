# BomberMan: versiones del proyecto

Cada cambio importante se desarrolla en una carpeta nueva: `BomberMan 0.1`, luego `BomberMan 0.2`, y así sucesivamente. Las versiones anteriores quedan como referencia. Git conserva además el historial de cambios del repositorio completo.

## Abrir el proyecto

Hacé doble clic en **`Iniciar BomberMan.bat`**. Elegí una versión y después una acción:

1. Abrir la app en web.
2. Abrirla en Android mediante túnel de Expo.
3. Ejecutar las pruebas del motor.
4. Instalar o actualizar dependencias.

Si pulsás Enter al elegir versión, se usa la más reciente. La primera vez que abras web o Android, el lanzador instalará las dependencias si faltan en `%LOCALAPPDATA%\BomberMan\dependencies` y enlazará `node_modules` con la versión elegida. Así se evita extraer cientos de archivos dentro de OneDrive; el código que editás sigue en `BomberMan 0.x`. Se necesita Node.js, npm y conexión a internet para esa instalación. El servidor de desarrollo se detiene con `Ctrl+C`.

## Crear la siguiente versión

Antes de un cambio importante, ejecutá **`Crear version.bat`**. Propone el siguiente número y copia la última versión sin `node_modules`, resultados de compilación ni secretos de archivos `.env`. Crea `.env` nuevos desde los ejemplos, sin copiar credenciales anteriores. También actualiza el número de versión de Expo y el código de versión de Android. Revisá y confirmá los cambios con un commit de Git al cerrar el hito.

Las decisiones vigentes están en [docs/PROJECT_BRIEF.md](docs/PROJECT_BRIEF.md). Cada versión guarda una copia de ese documento y su propio README. La versión actual está en [BomberMan 0.3](BomberMan%200.3/README.md); las versiones anteriores permanecen como referencia.

Abrí en GitHub Desktop el repositorio `PDelSC`. La carpeta `Proyecto Final - BomberMan` forma parte de ese repositorio y sus archivos aparecerán en **Changes** hasta que los confirmes. Después del commit, usá **Push origin** para enviarlos a GitHub. El historial del repositorio local que se había creado por error dentro de BomberMan se conservó en `.git-local-backup` y `.local-history.bundle`, ambos excluidos de Git.
