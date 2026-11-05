# Diagramas de ExpoTec

## Carpetas, archivos y compilación

Abrir [mapa-codigo.html](mapa-codigo.html) con doble clic. Tiene cinco diagramas seleccionables (general, frontend, backend, compilación y documentación), explorador de archivos, buscador y fichas de función. Incluye código actual, prototipo anterior, ubicaciones privadas sin valores y salidas locales.

- [Guía de carpetas y puntos de cambio](../MAPA_DEL_CODIGO.md).
- [Original editable draw.io de cinco páginas](Mapa-del-codigo-ExpoTec.drawio).
- [Inventario de rutas y roles en JSON](mapa-codigo.json).
- SVG: [general](mapa-general.svg), [frontend](mapa-frontend.svg), [backend](mapa-backend.svg), [compilación](mapa-compilacion.svg) y [documentación](mapa-documentacion.svg).

Se regenera con `node docs/scripts/build_code_map.mjs`, usando la misma dependencia Graphviz/WASM indicada abajo.

## DFD y DER

Abrir [modelos-datos.html](modelos-datos.html) con doble clic. El visor incluye los dibujos, permite ampliar y desplazar, y funciona sin conexión. Los accesos anteriores `flujo-completo.html` y `docs/scripts/system_flow_fragment.html` llevan al visor actualizado.

## Diagrama de flujo de datos

Original editable: [DFD-ExpoTec.drawio](DFD-ExpoTec.drawio).

| Vista | Archivo vectorial | Alcance |
| --- | --- | --- |
| Contexto / nivel 0 | [dfd-contexto.svg](dfd-contexto.svg) | Frontera de ExpoTec y siete entidades externas. |
| Nivel 1 | [dfd-nivel-1.svg](dfd-nivel-1.svg) | Siete procesos, siete almacenes y datos intercambiados. |
| Nivel 2: propuestas y revisiones | [dfd-proyectos.svg](dfd-proyectos.svg) | Descomposición de 3.0 con balance respecto del nivel 1. |

El [diccionario DFD](DICCIONARIO_DFD.md) identifica cada flujo y almacén. El modelo editable como datos está en [dfd-modelo.json](dfd-modelo.json).

## Diagrama entidad–relación

Original editable: [DER-ExpoTec.drawio](DER-ExpoTec.drawio).

| Vista | Archivo vectorial |
| --- | --- |
| General: PK, FK y cardinalidades | [der-general.svg](der-general.svg) |
| Físico completo: todos los atributos | [der-completo.svg](der-completo.svg) |
| Identidad y sesiones | [der-identidad.svg](der-identidad.svg) |
| Espacios, proyectos y equipos | [der-proyectos.svg](der-proyectos.svg) |
| Inventario, reservas y préstamos | [der-prestamos.svg](der-prestamos.svg) |
| Galería y cargas | [der-galeria.svg](der-galeria.svg) |

El modelo contiene 32 tablas, 169 atributos y 40 restricciones FK. El [diccionario DER](DICCIONARIO_DER.md) documenta las claves, multiplicidades y fuentes. La extracción estructurada está en [der-esquema.json](der-esquema.json).

La [explicación de notación y restricciones](../DFD_Y_DER.md) distingue las FK declaradas de las reglas que aplica el backend. Los diagramas se basan en las migraciones del repositorio, incluido el ALTER de 008 y la tabla técnica del motor; no incluyen datos privados de la base.

## Regeneración

Desde ExpoTec, con Node.js:

```powershell
npm install --prefix artifacts/system-map/model-tools --no-save --package-lock=false @viz-js/viz@3.31.0
node docs/scripts/build_data_models.mjs
```

Graphviz calcula la distribución y las conexiones. Los SVG se renderizan con su motor; los originales draw.io conservan tablas, filas, símbolos y conexiones editables. No se necesita draw.io instalado para usar el visor.

Los once recorridos explicativos anteriores y `sistema-expotec.drawio` quedan como material histórico. Los DFD y DER enlazados arriba son los modelos técnicos actuales.
