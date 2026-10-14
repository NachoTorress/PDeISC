# ExpoTec — migración nativa

Modo Operate. Expo SDK 57, React Native; APK postergado por el usuario. Mantener la identidad de DESIGN.md y los flujos del prototipo.

Refinamiento solicitado el 14/10/26: fondos claros cálidos y oscuros carbón/grafito. El verde se reserva para la acción principal, selección y ocupación; no tiñe tarjetas, controles secundarios ni el arte de referencia. Iconos SVG coherentes sustituyen signos Unicode usados como iconos.

La paleta de mobiliario queda junto al lienzo. Mantener una pieza y soltarla dentro del plano la crea en el destino; una pulsación simple o soltar fuera no crea nada. Los gestos bloquean el scroll y la selección de texto solo mientras están activos, y cancelan/restauran al terminar, cancelar o desmontarse. Los campos continúan editables y seleccionables.

La densidad usa tarjetas con 16 dp de relleno, páginas con 16/24 dp en teléfono/pantalla amplia y separación de 12/16 dp entre elementos relacionados/bloques. Se mantienen texto de campo de 16 sp, escalado de fuente y controles de 48 dp. El plano mide únicamente el ancho exterior; su altura derivada no depende de su propio onLayout. En Expo Web, scrollbar-gutter estable conserva el ancho cuando se bloquea el scroll durante un gesto.

La interfaz usa componentes nativos, safe areas, navegación de pila con retroceso Android y destinos inferiores en teléfono o laterales en pantallas grandes. Tipografía del sistema (Roboto en Android), controles de 48 dp, paletas semánticas independientes en src/theme/light.ts y dark.ts. Las etiquetas de campos siempre son visibles; validación en vivo y confirmaciones dentro del elemento.

El plano conserva posiciones relativas y geometría, con arrastre y tiradores nativos para reducir o ampliar mesas. Espacios y proyectos de ejemplo rotulados, sin cálculos ni certificación eléctrica. La biblioteca de reglas conserva equipo, revisiones, reservas y préstamos por jornada.

Expo Web permite una revisión de las mismas pantallas y una muestra para TV. Sus capturas no acreditan ejecución en Android: esa comprobación requiere Expo Go SDK 57, un emulador o un dispositivo. No afirmar que se generó o instaló un APK.
