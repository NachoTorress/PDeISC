# Convenciones de documentación del código

ExpoTec combina Python, TypeScript, JavaScript, SQL y CSS. La documentación
se escribe en español y describe responsabilidades, contratos y reglas que
ayudan a modificar el sistema sin alterar su comportamiento.

## Python: PEP 8 y PEP 257

Los scripts de `docs/scripts` usan cuatro espacios de sangría, separación
entre definiciones e importaciones agrupadas según PEP 8. Las líneas tienen
como máximo 79 caracteres. Los nombres impuestos por ReportLab, como
`beforeDocument`, `afterFlowable` y los parámetros de `wrap`, conservan la
forma de la biblioteca para respetar su interfaz.

Los módulos, clases y funciones, incluidas las funciones internas, tienen
docstrings con comillas dobles triples. La primera línea resume la operación;
una línea vacía separa la explicación adicional. Se detallan entradas,
resultados, efectos sobre archivos o estado y errores cuando el contrato
necesita esa información. Las anotaciones existentes indican los tipos.

Las cadenas extensas de SVG, XML y rutas se dividen en literales adyacentes:
Python los concatena sin agregar espacios ni saltos al valor resultante.

## TypeScript y JavaScript: JSDoc

PEP 8 y PEP 257 corresponden a Python. Los módulos de la aplicación y del
servidor usan comentarios `/** ... */` compatibles con JSDoc y el editor.
Las funciones y contratos definidos a nivel de módulo describen su propósito.
Los tipos de TypeScript siguen siendo la fuente de las firmas: los comentarios
explican significado, unidades, permisos y efectos sin duplicar cada tipo.

Los callbacks y cierres internos se explican mediante el contrato de la
operación que los contiene y comentarios locales cuando hace falta aclarar
una decisión. La documentación de pruebas describe sus dependencias simuladas
y la condición que verifican.

Las adaptaciones `.web` y `.native` deben indicar su plataforma. Las operaciones
de demostración deben distinguir sus datos ficticios de las cuentas y los
datos compartidos de la API. Una descripción de interfaz no sustituye las
comprobaciones de permisos y validaciones del backend.

## SQL y CSS

Las migraciones SQL comienzan con un comentario `--` que describe las entidades
o capacidades incorporadas. Los estilos explican la responsabilidad de cada
archivo con comentarios de bloque. Se conservan los comentarios existentes
que aclaran restricciones y decisiones de presentación.

## Mantenimiento y comprobación

Actualizar la documentación junto con el contrato o la regla que cambie.
Evitar comentarios que solo repitan una instrucción, credenciales de ejemplo
reales o afirmaciones sobre comportamientos que el código no garantiza.

Para revisar Python, con `pycodestyle` instalado:

```text
python -m pycodestyle docs/scripts/export_manuals.py docs/scripts/build_system_flow.py
```

Para revisar la aplicación actual, desde `frontend/native`:

```text
npm run typecheck
npm run lint
```

El backend dispone de `npm test`; el prototipo `frontend/web` dispone de
`npm run lint` y `npm run build`. Las pruebas HTTP del backend necesitan
permitir conexiones al servidor local de prueba.

El [mapa del código](MAPA_DEL_CODIGO.md) explica la distribución de módulos y
la diferencia entre la aplicación actual y el prototipo web.
