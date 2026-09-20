# Portfolio personal

Portfolio personal basado en la plantilla original de `simpleC0de/portfolio-01`, adaptado con contenido real de la consigna y sin reconstruir el diseño desde cero.

## Descripción

El sitio presenta formación, participación en competencias, proyectos e intereses técnicos relacionados con informática, programación competitiva, inteligencia artificial y hardware.

No se agregan datos personales no provistos, como nombre completo, correo, redes sociales o URLs públicas específicas.

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm run dev
```

## Comprobaciones

```bash
npm run lint
npm run build
```

## Tecnologías

- React
- Vite
- TypeScript
- ESLint
- Bootstrap
- Emotion
- Framer Motion
- React Icons

## Estructura

```text
src/
  main.tsx
  App.tsx
  components/
    layout/
    navigation/
    sections/
  contexts/
  data/
  hooks/
  pages/
  styles/
    dark.css
    light.css
```

## Funcionalidades

- Modo oscuro y modo claro completos.
- Navegación fija con menú hamburguesa en pantallas chicas.
- Navegación por secciones y progreso de lectura.
- Botón funcional para volver arriba.
- Animaciones suaves con Framer Motion.
- Layout responsive con Bootstrap.
- Tarjetas de proyectos con detalle expandible.
- Acción de copiar resumen al portapapeles sin usar `alert`.
- Contenido centralizado en `src/data/portfolio.ts`.
- Datos editables desde `src/data/portfolio.json`.

## Editar contenido

Para agregar o modificar información del portfolio, editar `src/data/portfolio.json`.

Secciones disponibles:

- `profile`: email, titular y resumen.
- `education`: formaciones o estudios.
- `achievements`: competencias, participaciones o reconocimientos.
- `projects`: proyectos, etiquetas y enlaces.
- `skillCategories`: categorías de skills y skills internas.
- `navSections`: textos de navegación.

Íconos disponibles para skills: `brain`, `code`, `cplusplus`, `docker`, `git`, `linux`, `microchip`, `node`, `python`, `react`, `sql`, `typescript`.

## Hosting

El build de producción se genera con:

```bash
npm run build
```

La carpeta resultante `dist/` queda lista para subirse a un host estático compatible con aplicaciones React/Vite. La configuración usa rutas relativas (`base: './'`) para facilitar despliegues en subcarpetas o servicios de hosting estático. Antes de publicar en una plataforma concreta, revisar sus pasos actuales de despliegue.
