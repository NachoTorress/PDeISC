# Ícono de ExpoTec

Preparado para la próxima APK: versión 0.2.0, Android versionCode 2. La APK inicial con versionCode 1 conserva su ícono anterior.

## Recursos

- `frontend/native/assets/brand/expotec-icon-v1.png`: ícono completo y opaco de 1254 × 1254 píxeles, para el ícono tradicional y la capa del ícono adaptable.
- Fondo adaptable: `#153B2A`. Monograma verde menta con un punto blanco cálido. El lanzador del teléfono aplica la forma exterior; el margen protege el monograma en máscaras circulares y cuadradas.
- Se conserva la composición completa en la capa adaptable. No se declara una capa monocromática: los lanzadores usan el ícono de color.

`frontend/native/app.json` contiene las referencias. Expo genera los tamaños correspondientes al compilar. Los archivos están dentro de `assets`, incluida en la lista permitida de `.easignore`.

No se recompiló la APK por este cambio. Se comprobó la configuración de Expo y la generación de recursos de Android; la apariencia en un teléfono físico queda para la próxima compilación.

## Generación

Modo: herramienta integrada de generación de imágenes, sin CLI ni edición manual. El recurso seleccionado corresponde al siguiente prompt. Se descartaron las pruebas de extracción sobre transparencia porque introducían residuos visibles en los huecos del monograma.

### Diseño

> Use case: logo-brand. Create one finished Android launcher app icon for ExpoTec, a student technology exhibition and project organization app. Square 1024 x 1024 raster asset, completely opaque. Full-bleed uniform deep forest green background #153B2A, with no border and no baked-in rounded-square tile: the operating system will apply its own outer mask. In the center, a striking custom geometric lowercase 'e' monogram, confidently bold, rounded yet precisely engineered, a single connected mint #A9D6B7 ribbon with a clean negative-space counter and a crisp open horizontal cut. Add one small warm-white circular dot at the lower right of the e as the ExpoTec signature, balanced as part of the mark. Mature, distinctive technology brand, sharp flat vector-like rendering with only an exceptionally subtle tonal highlight inside the mint mark. Must look excellent and readable at 48 pixels. Keep the ENTIRE e plus dot strictly inside the central 56% of both width and height, centered as a single composition, with generous uniform background around it so all Android circle/squircle adaptive masks preserve it. Optically balanced, beautiful precise curves and consistent substantial thickness. No words, no ExpoTec label, no mockup, no devices, no extra symbols, no chip outline, no tiny circuit details, no glow, no drop shadow, no texture, no watermark. Deliver just the one square icon artwork.

