# Revisión del frontend

Modo: completo sobre los componentes compartidos de navegación, botones y campos. React Native/Expo, estilos nativos y hojas CSS web existentes. Referencia aplicada: Expo, de la biblioteca local Awesome Design MD. Se conserva la identidad de Pulso.

## Cobertura

| Categoría | Evidencia inspeccionada | Resultado |
| --- | --- | --- |
| Tipografía | Typography, HomePage y CSS global; escritorio y móvil | Títulos equilibrados en web; Outfit local y jerarquía conservadas. |
| Superficies | Field, AppShell y tamaño de controles | Bordes de validación estables y acción para volver arriba siempre accesible al desplazar. |
| Animaciones | Respuesta a pulsación y cambio de pantalla | No hay animaciones personalizadas; se mantuvo la respuesta inmediata sin añadir dependencias. |
| Iconos | Icon y botones compartidos | Un solo sistema de iconos; peso alineado con el texto de los botones. |
| Rendimiento | Importaciones y grafo de src | Sin ciclos de importación; cuatro pesos de fuente importados por separado. |

## Cambios realizados

| Severidad | Ubicación | Antes | Después | Motivo |
| --- | --- | --- | --- | --- |
| Media | src/components/Field.tsx | El borde crecía al aparecer un error | Borde de ancho fijo; cambia el color | Evita el desplazamiento del contenido al validar. |
| Media | src/components/Field.tsx | Mensajes próximos al input sin relación web explícita | aria-invalid y aria-describedby; foco nativo visible | Expone el problema y su explicación a tecnologías de asistencia. |
| Media | src/components/AppShell.tsx | Roles de pestañas sin su navegación de teclado | Botones dentro de un área de navegación con página actual | Semántica acorde con los controles implementados. |
| Media | src/components/AppShell.tsx | Volver arriba aparecía al final del contenido | Botón flotante tras 520 puntos de desplazamiento | Se puede subir sin recorrer toda la pantalla larga. |
| Baja | src/components/Button.tsx | Estados muy desvanecidos y carga con ancho variable | Opacidad moderada, tamaño mínimo, indicador alineado | Mejora lectura, consistencia y respuesta a pulsación. |
| Baja | src/styles/global.css | Títulos con el ajuste de línea predeterminado | Títulos equilibrados y cursor de campos deshabilitados | Refina composición y comunica el estado del control. |
| Alta | src/pages/tools/MotionTool.tsx | El adaptador web no garantizaba equivalencia con las unidades nativas | Prueba disponible en la aplicación nativa, con explicación visible en web | Evita presentar datos físicamente incorrectos como g o rad/s. |

## Arquitectura verificada con Graphify

Se analizó únicamente src: 39 archivos en el momento de la extracción, 158 nodos y 615 relaciones. No se usaron claves de API ni se añadieron hooks a la aplicación. Las altas y ediciones reutilizan RecordForm y sus validaciones; las operaciones CRUD convergen en la misma persistencia. El tema y la tipografía están centralizados. GPS y sensores comparten el control de segundo plano.

El grafo tiene una referencia colgante y relaciones colapsadas propias de la extracción no dirigida. Algunos archivos cambiaron durante la revisión; el grafo se marcó para actualización. Estas limitaciones no se presentan como errores de ejecución de la app.

## Candidatos descartados

| Ubicación | Candidato | Motivo |
| --- | --- | --- |
| Sistema visual | Adoptar colores o marca de la referencia Expo | La referencia se usa para claridad de interfaz; Pulso conserva su identidad. |
| Navegación | Añadir una biblioteca de navegación o animación | Dos destinos y pantallas de herramientas se resuelven con los componentes existentes. |
| Inicio | Añadir métricas o valores de sensores decorativos | Solo se presentan resultados realmente recibidos del dispositivo. |

## Verificación y límites

TypeScript y ESLint se ejecutaron tras los cambios compartidos. La inspección de escritorio a 1440 × 1000 y móvil a 390 × 844 verifica composición y legibilidad en ambos temas. Se revisaron navegación, historial vacío, estado web de biometría y cambio de tema. La confirmación final y el resultado de la compilación se registran en ESTADO_ENTREGA.md.

La lectura mediante TalkBack/VoiceOver y el funcionamiento físico de cámara, GPS, sensores y biometría requieren un teléfono y permanecen como pruebas de aceptación en PRUEBAS.md. La compilación exitosa por sí sola no verifica hardware.
