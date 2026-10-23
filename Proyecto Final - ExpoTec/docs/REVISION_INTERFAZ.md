# Revisión de la interfaz · 22/10/2026

Resultado del alcance visual: **PASS**. [Contrato de diseño y referencias](DISENO_INTERFAZ.md).

Revisión posterior a las capturas del usuario: grillas sin columnas perdidas por redondeo, usuarios en filas de ancho completo, fichas más compactas y modo oscuro carbón y grafito. Los proyectos sin foto usan un icono de 40 puntos. Se conservan la paleta clara azul/naranja y los selectores con filas completas.

Se revisaron las superficies de Expo Web modificadas, con Edge aislado y datos de prueba derivados de la demostración existente. El ensayo no conecta con TiDB. Las capturas y el registro JSON se generan localmente en `artifacts/design-review/`, una carpeta excluida de Git.

## Comprobaciones ejecutadas

- PASS · TypeScript: `npm run typecheck`.
- PASS · ESLint: `npm run lint`.
- PASS · Modelo, servicios y distribución de selectores y grillas: `npm test`, 98 pruebas. Incluye anchos fraccionales y cambio de columnas.
- PASS · Exportación web: `npm run export:web`.
- PASS · Empaquetado Android con Hermes: `npm run export:android`. Esto no constituye una prueba en teléfono ni genera un APK.
- PASS · Revisión de navegador: `scripts/check-design.cjs`, 58 comprobaciones, 47 capturas, 0 errores de JavaScript; controles, textos largos, ingreso, registro, navegación, consulta y guardado simulado. Los dos grupos de préstamos se comprueban en siete anchos.
- PASS · Adaptación: teléfonos desde 320, tabletas y escritorio hasta 1691 píxeles, además de zoom al 125 %. Las filas se comparan con todo el ancho útil y se verifica la cantidad de columnas, no sólo la ausencia de desbordes. Los fixtures incluyen seis usuarios, seis recursos y seis proyectos, con fotos y sin ellas.
- PASS · Densidad: las filas de usuarios miden unos 103 píxeles en escritorio y 197 en móvil; los proyectos sin foto, entre 233 y 257. Las capturas conservan la lectura y las acciones de las fichas.
- PASS · Tema oscuro: se comprueba en tokens y DOM que fondo, tarjetas, controles secundarios y navegación son neutrales. Se usan acentos en acciones y estados.
- PASS · Contraste: 38 combinaciones de color de texto/fondo en ambos temas, todas con relación mínima 4,5:1. Los valores exactos se guardan en `evidence.json`.
- PASS · Registro ECC: `check-evidence.js artifacts/design-review/evidence.json`, además de inspección visual de los archivos.
- PASS · Producción: despliegue `dpl_DP6P2aokeoV9CcpTJf6oLAWxhAsF`, desde `fca3dbcf`, publicado en la web habitual. La revisión pública añadió 16 comprobaciones y ocho capturas de proyectos e inventario en claro y oscuro, a 390 y 1536 píxeles: cuatro columnas en escritorio, una en móvil, sin desbordes ni errores de JavaScript. Sólo se consultaron datos públicos y se usó la demostración local; no hubo escrituras externas. Evidencia en `artifacts/design-review/production-handoff-evidence.json`.
- PASS · APK 0.3.0/3 generada con el mismo frontend: integridad, manifiesto, versión y firma verificados; certificado idéntico al de la APK anterior. [Descarga, identificación y alcance](APK_PRUEBA.md). La prueba en teléfono físico sigue pendiente.

## Delivery Gate de Anti Slop

Cada entrada corresponde al cambio visual de esta entrega y a los recorridos indicados arriba. No sustituye las pruebas de integración de producción ni de Android físico.

- R-01 PASS: fondos de sección sólidos con roles escritos; no se agregaron degradados ni brillos.
- R-02 PASS: el texto nuevo de la aplicación usa frases y puntuación simples.
- R-03 PASS: anchos móviles, intermedios, amplios y zoom al 125 % comprobados; controles y página dentro del área disponible.
- R-04 PASS: iconos existentes para espacios, proyectos, recursos y fotos; las ilustraciones de categorías representan el contenido de cada proyecto.
- R-05 PASS: plano con detalle lateral, listas de fichas y formulario de cuenta responden a tareas diferentes.
- R-06 PASS: tipografía del sistema por lectura y compatibilidad entre web y Android; escala y pesos compartidos.
- R-07 PASS: no se agregaron patrones decorativos; el plano existente representa la distribución de puestos.
- R-08 PASS: flechas existentes acompañan retorno, avance o apertura de una ficha; no se agregaron como decoración general.
- R-09 PASS: etiquetas de estado conservan información de la propuesta, la foto o el préstamo.
- R-10 PASS: no se agregó desenfoque de superficies.
- R-11 PASS: radios de controles y tarjetas diferenciados en tokens; botones y selectores dejaron de ser píldoras.
- R-12 PASS: tarjetas separadas por superficie y borde; no se añadieron sombras ambientales.
- R-13 PASS: no se añadieron efectos de brillo.
- R-14 PASS: las fichas comparables tienen igual altura por pedido del usuario; pies alineados comprobados con nombres de distinta longitud.
- R-15 PASS: etiquetas concretas, como Ver proyecto, Guardar elemento, Editar y Dar de baja.
- R-16 PASS: no se añadió texto promocional genérico.
- R-17 PASS: los conteos conservan el modelo existente; el ensayo usa fixtures identificados como prueba.
- R-18 PASS: no se agregaron testimonios ni personas presentadas como usuarios reales.
- R-19 PASS: no se añadieron animaciones decorativas; menús y desplazamiento respetan movimiento reducido.
- R-20 PASS: azul profundo en navegación clara; carbón y grafito en el tema oscuro, con acentos de color limitados a acciones y estados.
- R-21 PASS: se probaron el cambio a oscuro y el regreso a claro en escritorio y teléfono.
- R-22 PASS: se reutilizan recursos gráficos del repositorio; las imágenes de prueba se interceptan localmente.
- R-23 PASS: se reutilizó el icono existente y se conservaron los destinos de navegación.
- R-24 PASS: espacios, proyectos, galería, inventario, préstamos, usuarios y demostración se abren en el ensayo.
- R-25 PASS: los pares semánticos de texto y fondo superan 4,5:1 en ambos temas.
- R-26 PASS: se conservaron los handlers existentes; selección de espacio, ingreso, detalle, actualización, historial y confirmación responden en el ensayo.
- R-27 PASS: consulta retenida, respuesta vacía, error 503, imagen 404, recuperación y guardado simulado comprobados.
- R-28 PASS: no se agregó una sección de preguntas frecuentes.
- R-29 PASS: roles cromáticos documentados; rojo se reserva a errores y acciones destructivas.
- R-30 PASS: referencias de Linear y Notion del catálogo Awesome Design MD usadas para densidad y superficies neutrales; se conservan componentes y contenidos de ExpoTec.
- R-31 PASS: cada decisión principal tiene un motivo en el contrato de diseño.
- R-32 PASS: foco visible de 3 px, activación con Enter, cierre de menú con Escape y etiquetas de accesibilidad conservadas.
- R-33 PASS: cambios implementados en archivos fuente; no se modifica el DOM para presentar las capturas base. El ensayo de regresión aplica zoom CSS al 125 % y luego lo retira.
- R-34 PASS: capturas claras y oscuras revisadas; mismos componentes y tokens semánticos.
- R-35 PASS: aplicación ejecutada, compilada y recorrida en navegador; resultados y límites registrados.
- R-36 PASS: no se agregaron afirmaciones de seguridad, rendimiento ni cumplimiento.
- R-37 PASS: dirección derivada del pedido explícito de color y estandarización, declarada antes de implementar.
- R-38 PASS: los datos de prueba no se incorporan a la aplicación compartida ni se publican como registros reales.

## Vitalidad y oficio

- ENERGY 2 PASS: cabeceras con color en claro y superficies neutrales en oscuro mantienen jerarquía sin competir con los datos.
- RHYTHM 2 PASS: las listas son predecibles; plano, cuenta y presentación conservan composiciones propias.
- MOTION 1 PASS: feedback de interacción y apertura; preferencia de movimiento reducido aplicada.
- Foco principal PASS: el título y el contenido de trabajo definen cada pantalla.
- Espaciado PASS: tokens para controles, tarjetas y grillas; el pie utiliza el espacio libre para alinear acciones.
- Acento PASS: naranja para orientación y secciones; azul en los controles y verde sólo para estados exitosos.
- Motivo de identidad PASS: cabeceras cromáticas y navegación estable se repiten entre las secciones.
- C-1 PASS: decisiones justificadas en el contrato.
- C-2 PASS: no se agregaron controles decorativos sin acción.
- C-3 PASS: no se añadieron secciones ajenas al trabajo de la exposición.
- C-4 PASS: temas, anchos móviles y de escritorio, zoom, teclado y estados de datos comprobados en Expo Web.
- C-5 PASS: evidencia local verificable, fixtures identificados y límites explícitos.

## Repetir la revisión

Exportar la web y abrir `npm run preview` en un puerto local. Con Playwright disponible en el entorno de automatización:

```powershell
$env:DESIGN_BASE_URL = "http://127.0.0.1:5173"
$env:PLAYWRIGHT_MODULE = "RUTA_AL_MODULO_PLAYWRIGHT"
$env:BROWSER_EXECUTABLE = "RUTA_AL_NAVEGADOR"
node scripts/check-design.cjs
```

Ejecutar desde `frontend/native`. Las últimas dos variables son opcionales cuando Playwright y su navegador ya están configurados. El script rechaza destinos externos y simula los endpoints de la API.
