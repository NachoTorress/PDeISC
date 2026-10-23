---
name: ExpoTec — interfaz nativa
description: Interfaz operativa de Expo SDK 57; navegación azul profundo, acciones azules y acentos naranja con controles compartidos.
colors:
  page: "#f3f1ed"
  surface: "#faf9f6"
  surface-muted: "#eae7e1"
  sidebar: "#faf9f6"
  text: "#272b28"
  muted: "#646963"
  line: "#d1d3cc"
  primary: "#316d4c"
  primary-hover: "#316d4c"
  on-primary: "#ffffff"
  accent-soft: "#e5e8e2"
  accent-text: "#2d3d32"
  success-soft: "#e1ece3"
  warning-soft: "#f1e5c5"
  warning-text: "#745610"
  danger: "#9e3734"
  danger-soft: "#f5e5e1"
  canvas: "#e9e9e3"
  canvas-dot: "#d1d3cc"
  table: "#faf9f6"
  table-edge: "#828b83"
  table-occupied: "#dce7de"
  table-pending: "#f1e5c5"
  overlay: "#17291f70"
  focus: "#316d4c"
  page-dark: "#17191b"
  surface-dark: "#202326"
  surface-muted-dark: "#2a2d31"
  sidebar-dark: "#202326"
  text-dark: "#eef0ed"
  muted-dark: "#b1b5b0"
  line-dark: "#464c4e"
  primary-dark: "#91c3a0"
  primary-hover-dark: "#91c3a0"
  on-primary-dark: "#182c20"
  accent-soft-dark: "#363d3a"
  accent-text-dark: "#e1ebe3"
  success-soft-dark: "#2c3c32"
  warning-soft-dark: "#433b29"
  warning-text-dark: "#dfc78b"
  danger-dark: "#f0a49a"
  danger-soft-dark: "#4b2e2d"
  canvas-dark: "#25292b"
  canvas-dot-dark: "#464c4e"
  table-dark: "#31363a"
  table-edge-dark: "#737b78"
  table-occupied-dark: "#34473c"
  table-pending-dark: "#433b29"
  overlay-dark: "#07100ba8"
  focus-dark: "#91c3a0"
typography:
  headline:
    fontFamily: '"Segoe UI", system-ui, sans-serif'
    fontSize: "34px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: '"Segoe UI", system-ui, sans-serif'
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  subtitle:
    fontFamily: '"Segoe UI", system-ui, sans-serif'
    fontSize: "16px"
    fontWeight: 650
    lineHeight: 1.4
  body:
    fontFamily: '"Segoe UI", system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: '"Segoe UI", system-ui, sans-serif'
    fontSize: "12px"
    fontWeight: 600
  button:
    fontFamily: '"Segoe UI", system-ui, sans-serif'
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.45
rounded:
  small: "5px"
  field: "7px"
  control: "8px"
  panel: "12px"
  dialog: "14px"
spacing:
  compact: "6px"
  control-gap: "8px"
  control-padding: "10px"
  medium: "16px"
  panel-padding: "21px"
  section: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.on-primary}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.field}"
    padding: "9px 11px"
  navigation-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-text}"
    rounded: "{rounded.control}"
    padding: "13px"
  status-approved:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.accent-text}"
    rounded: "{rounded.small}"
    padding: "4px 8px"
  project-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.panel}"
    padding: "21px"
  booth:
    backgroundColor: "{colors.table}"
    textColor: "{colors.text}"
    rounded: "{rounded.small}"
    padding: "5px 8px"
---

# Design System: ExpoTec — prototipo

La dirección activa de Expo se actualizó el 22/10/2026: [contrato y referencias](docs/DISENO_INTERFAZ.md). Los valores de `frontend/native/src/theme/light.ts`, `dark.ts` y `tokens.ts` son la fuente actual para la aplicación. El frontmatter y las especificaciones web siguientes documentan el prototipo anterior.

## Overview

**Creative North Star: "Todo en su lugar"**

Descripción provisional tomada del prototipo construido y de su frase de marca. No constituye una identidad aprobada. El panel de organización usa superficies verde grisáceo, acciones verde bosque y un plano geométrico que permite reconocer puestos y proyectos por su ubicación.

La interfaz conserva densidad de herramienta escolar: navegación estable, etiquetas explícitas, fichas compactas y estados legibles. El modo oscuro cambia todas las variables semánticas. Segoe UI y las familias del sistema responden a este contexto operativo; no existe una fuente descargada ni autocontenida. El mobiliario y las ilustraciones de ejemplo son geometría y SVG, no fotografías de la escuela.

**Key Characteristics:**

- Claros suaves y verdes contenidos, con equivalentes oscuros.
- Plano superior como patrón propio de organización.
- Estados comunicados con texto e iconos además del color.
- Controles etiquetados, foco visible y confirmaciones dentro del contexto.
- Dirección visual provisional; datos y planos rotulados como ejemplos.

Evidencia: `frontend/web/src/styles/base.css`, `light.css`, `dark.css`, `src/app.tsx` y `src/components/Floorplan.tsx`. El contrato de superficie está en `.impeccable/surfaces/prototype.md`: el motor de Impeccable no pudo ejecutarse; se aplicaron sus referencias directamente. No hubo seed, comp aprobado ni selección de identidad final.

## Colors

Los valores normativos están en el frontmatter. Las claves sin sufijo corresponden al modo claro; `-dark` identifica su equivalente exacto en `dark.css`. En el código ambos temas utilizan el mismo nombre de variable CSS, seleccionado mediante `data-theme`.

### Primary

`primary` es el verde bosque de botones principales y acciones. `primary-hover` refuerza el estado interactivo y `on-primary` mantiene el texto legible. `accent-soft`, `accent-text` y `success-soft` marcan navegación activa y proyectos confirmados. En oscuro el acento pasa a verde claro y su texto interior se vuelve oscuro.

### Neutral

`page` forma el fondo suave; `surface` separa tarjetas y formularios; `surface-muted` y `sidebar` ordenan zonas secundarias. `text`, `muted` y `line` sostienen jerarquía y divisiones. `canvas`, `canvas-dot`, `table` y `table-edge` son los materiales del plano.

`warning-soft` y `warning-text` acompañan solicitudes pendientes. `danger` y `danger-soft` muestran correcciones, validación y acciones destructivas. `table-occupied` y `table-pending` trasladan estos estados a los puestos. `overlay` oscurece el fondo de los diálogos y del menú móvil; `focus` identifica el control que recibe el teclado.

No se define una paleta secundaria de marca ni una rampa cromática: el prototipo no implementa esas escalas. Los cuatro fondos de ilustraciones de ejemplo permanecen en sus hojas de tema y no se convierten en colores de identidad.

**The Estado explícito Rule.** Un estado conserva su texto o icono; el color acompaña la información y no la reemplaza.

## Typography

Una sola familia familiar de interfaz: Segoe UI, con `system-ui` y `sans-serif` como alternativas disponibles en cada dispositivo. Los pesos dependen de la fuente instalada; no se afirma una distribución tipográfica propia.

### Hierarchy

- **Headline:** título principal de pantalla; pasa a 30 px en escritorio compacto.
- **Title:** encabezados de secciones y paneles.
- **Subtitle:** nombres de secciones menores.
- **Body:** lectura y explicaciones; los párrafos se limitan a 72 caracteres de ancho aproximado (`72ch`).
- **Label:** etiqueta del dato situada fuera del campo.
- **Button:** texto de acción con peso medio.

Los valores de estos roles son los extraídos arriba. El prototipo también contiene metadatos más pequeños; no se convierten en una escala mínima recomendada para futuras pantallas. La vista de televisión tiene tamaños propios adaptados a la presentación, sin imponerlos al panel.

## Layout

El escritorio usa una columna de navegación de 236 px y un área flexible que aprovecha el ancho disponible. El contenido tiene un máximo de 1920 px; su margen interior habitual es 37 px arriba y 38 px a los lados. El mapa distribuye el plano flexible y un resumen lateral de 276 px, con separación de 21 px. Las tarjetas de proyectos usan tres columnas.

A partir de 1700 px crecen la navegación, el resumen y los márgenes. Hasta 1250 px se compactan las columnas y las tarjetas pasan a dos. Hasta 1000 px el resumen se coloca debajo del plano. Hasta 767 px la navegación pasa a un panel móvil de 260 px, los formularios y fichas se apilan y la apertura se controla desde el botón de menú.

El plano guarda posiciones relativas y tiene proporción adaptable; su trama tiene paso de 17 px. No expresa dimensiones reales ni capacidad física de la escuela. Las áreas táctiles de los muebles alcanzan al menos 44 px en móvil. El editor permite seleccionar y arrastrar directamente el mobiliario; en táctil se mantiene pulsado para moverlo. Los tiradores de bordes y esquinas cambian el tamaño de la mesa con arrastre inmediato, también en táctil. Las flechas del teclado mueven un elemento enfocado o ajustan el tamaño desde un tirador. La interfaz no solicita coordenadas ni porcentajes.

## Elevation & Depth

La separación habitual procede de tonos de superficie y bordes finos. Tarjetas y resúmenes no tienen sombra ambiental. Los diálogos y avisos flotantes emplean la variable `shadow`, cuyo valor cambia entre temas y se conserva en el sidecar; los diálogos usan además un fondo de cobertura.

Los puestos no usan sombra: el estado se transmite mediante borde, relleno, texto e icono.

## Shapes

Rectángulos con esquinas moderadas: campos, acciones y navegación son compactos; paneles y diálogos tienen radios mayores. El círculo se reserva a avatares y puntos de leyenda. Los muebles del plano tienen siluetas propias: mesa rectangular con patas esquemáticas, banco estrecho y punto eléctrico con icono.

Los bordes de superficie tienen 1 px; las mesas, 1,5 px. La selección utiliza un contorno exterior. El mobiliario conserva su geometría; las fotografías que aporte un alumno pertenecen a su proyecto, no representan un plano técnico.

## Components

### Buttons

El botón principal usa el acento y su color de texto complementario. El secundario usa superficie con borde; la acción discreta usa fondo transparente. El hover cambia tono sin mover el control; los principales y secundarios conservan ese cambio al pulsar. La transición dura 150 ms. El foco visible tiene contorno de 3 px. Un botón deshabilitado reduce opacidad y cambia el cursor.

### Inputs / Fields

Etiqueta superior separada, fondo de superficie, borde fino y altura mínima de 40 px. El foco utiliza contorno de 2 px con separación de 1 px. `aria-invalid` activa borde de error y fondo suave; el mensaje se ubica bajo el campo. Un placeholder no sustituye la etiqueta.

### Navigation

Filas con icono, texto y contador opcional; altura mínima de 44 px. El estado activo se acompaña de `aria-current`. El menú móvil bloquea el fondo mientras está abierto, conserva el foco dentro y admite Escape. Su desplazamiento dura 200 ms con salida suave.

### Chips / Status

Las materias usan etiquetas neutras. Los estados tienen texto, icono, relleno semántico y radio pequeño. Confirmado, pendiente y con correcciones utilizan los pares de colores definidos para cada tema. Un estado estático no recibe hover de botón.

### Cards / Containers

Las fichas combinan ilustración o imagen, nombre, estado, materias, ubicación y fecha. Su cuerpo tiene 21 px de margen interior y el pie se separa con un borde. Resúmenes y herramientas comparten superficie, borde y esquinas. La confirmación de borrado aparece dentro de la ficha sobre una superficie secundaria.

### Puesto del plano

Botón geométrico con código y nombre o disponibilidad. Confirmado muestra un visto; solicitado, un reloj; libre, su texto y un punto. La selección usa `aria-pressed` y contorno exterior de 3 px. El arrastre cambia el cursor y el contorno; las coordenadas se guardan al soltar. En móvil el nombre admite dos líneas y la mesa mantiene un área táctil mínima.

El sidecar contiene seis muestras autónomas de los patrones existentes. Los ejemplos de HTML y CSS representan su apariencia; el comportamiento sigue implementado en React.

El tamaño inicial de las mesas ocupa 14% del ancho y 9% del alto del plano. Estos valores y sus límites (ancho 6–30%, alto 4–25%) pertenecen al modelo interno. La mesa seleccionada muestra tiradores en bordes y esquinas; el usuario ajusta su silueta sobre el plano sin controles de porcentaje en el panel. La silueta conserva estas proporciones también en móvil; el área táctil invisible mantiene 44 px sin agrandar el dibujo. En mesas pequeñas se muestra el código y el detalle queda disponible al seleccionarlas. Las etiquetas de zona usan texto de 2–60 caracteres, superficie del tema y color de acento; se mueven directamente como el mobiliario y su texto se edita desde el panel. Guardar conserva la distribución y cancelar descarta los cambios del modo de edición.

**The Movimiento funcional Rule.** El movimiento acompaña cambios de estado o apertura; `prefers-reduced-motion` desactiva animaciones, transiciones y desplazamiento suave.

## Do's and Don'ts

### Do:

- **Do** usar los pares semánticos del tema para fondo y texto.
- **Do** mantener etiquetas visibles, errores junto al campo y foco perceptible.
- **Do** conservar código y estado textual al mostrar un puesto.
- **Do** rotular como ejemplo los datos y planos del prototipo.
- **Do** preservar la amplitud del escritorio y la navegación operable en móvil.

### Don't:

- **Don't** reemplazar etiquetas de campos por placeholders.
- **Don't** usar alerts o confirmaciones nativas para flujos de la interfaz.
- **Don't** interpretar una ilustración del plano como relevamiento real o validación eléctrica.
- **Don't** presentar esta extracción como identidad final aprobada.
- **Don't** convertir los metadatos diminutos del prototipo en una escala mínima para nuevos componentes.

## Adaptación nativa — SDK 57

La implementación activa está en `frontend/native`. Conserva la dirección cromática y el plano geométrico, con paletas TypeScript independientes en `src/theme/light.ts` y `dark.ts`. Las muestras HTML y CSS anteriores describen el prototipo de referencia.

Refinamiento del 14/10/26: el fondo claro es cálido y suave; el oscuro usa carbón y grafito. Las superficies, controles secundarios y arte de referencia son neutros. El verde identifica la acción principal, selección y ocupación. Los iconos SVG comparten trazo y escala y acompañan las acciones sin sustituir sus etiquetas.

La versión nativa utiliza tipografía del sistema (Roboto en Android), títulos de 28 dp, texto de formulario de 16 dp y etiquetas de 14 dp. Campos y acciones de al menos 48 dp con 8 dp de separación. Las tarjetas tienen 16 dp de margen interior y las páginas 16 dp en teléfono o 24 dp en pantallas grandes. La separación entre bloques es de 16 dp, y entre elementos relacionados de 12 dp. Los modos claro y oscuro aplican colores semánticos a cada texto y superficie.

Los destinos principales aparecen abajo en teléfono y a la izquierda en pantallas amplias. Una pila nativa gestiona formulario, ficha y presentación, con el retroceso del sistema. Safe areas protegen el contenido de barras y recortes; los formularios permiten desplazamiento con el teclado visible. El editor del plano usa gestos y tiradores nativos de 48 dp, conserva el dibujo proporcional de las mesas y evita superponer sus controles táctiles.

La paleta junto al plano permite mantener y arrastrar mesas, bancos, tomas y etiquetas. Solo un arrastre que termina dentro del plano crea una pieza; pulsar o soltar fuera conserva el borrador. Los tiradores permiten ampliar y reducir mesas. Durante un gesto se detienen el scroll y la selección de texto; al finalizar o cancelar se restauran. Los campos siguen siendo editables y seleccionables. Enter o Espacio permiten colocar una pieza en el centro con teclado, y Escape cancela el gesto en Expo Web.

El plano deriva su tamaño del ancho exterior y la ventana, sin realimentar su altura medida. Expo Web reserva el espacio de la barra de scroll al bloquearla durante un gesto; mover una pieza no altera el ancho ni el alto del lienzo. La adaptación conserva los tiradores táctiles de 48 dp incluso en orientación horizontal. La cabecera, las tarjetas y la paleta usan una densidad moderadamente compacta para reducir el desplazamiento sin desactivar el escalado de texto del sistema.

Las comprobaciones en Expo Web revisan los mismos componentes, recorridos y adaptación visual. No sustituyen las pruebas de ejecución, teclado y gestos en Android. El APK quedó postergado por el usuario.

La galería de la experiencia (7I) comparte tarjetas, campos, botones y paletas con la aplicación. Distingue consulta pública, aportes propios y moderación sin mezclarla con la muestra de proyectos. Las fotos conservan su proporción dentro de una vista contenida; un error de imagen mantiene la descripción. Estados de revisión en texto, confirmación de publicación/retiro y motivo visible al autor. El formulario de aporte muestra antes del envío qué nombre y descripción serán públicos. Las tarjetas se organizan en una, dos o tres columnas según el ancho.
## Navegación general (21/10/2026)

Los accesos a espacios, proyectos, galería, TV, cuenta y demostración se reúnen en filas uniformes de un panel lateral. Inventario, préstamos y usuarios se agregan según los permisos reales. Desde 1200 px el panel permanece visible; en ventanas menores se abre con el botón hamburguesa y se cierra al elegir destino, tocar fuera, usar la cruz o Escape. El menú móvil utiliza el foco contenido y su restauración de Modal; los controles tienen etiquetas y un mínimo de 44 px. Las pantallas compartidas conservan únicamente sus acciones de trabajo y los accesos contextuales necesarios para ingresar o volver de una ficha.

## Accesos sociales web — preparación 7J

Los botones de Google, Discord y GitHub aparecen en Mi cuenta únicamente para proveedores configurados. El retorno abre esa pantalla en la misma pestaña, muestra el correo verificado y pide completar registro, autorizar vinculación con contraseña o confirmar ingreso. El alta conserva etiquetas y validación de nombres, selección alumno/invitado, contraseña propia y repetición. No se muestran botones sociales operativos en Android hasta implementar su retorno nativo. La activación real sigue pendiente de las aplicaciones externas.
