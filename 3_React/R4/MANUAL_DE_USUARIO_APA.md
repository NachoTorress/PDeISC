# Manual de Usuario: Sistema Web de Portfolio Interactivo con Persistencia en Base de Datos

**Autor:** Ignacio Torres  
**Institución:** Universidad de Buenos Aires / Colegio Nacional de Buenos Aires  
**Fecha:** Septiembre de 2026  
**Formato de Estilo:** APA 7.ª Edición  

---

## 1. Introducción

El presente sistema de portfolio web personal ha sido desarrollado bajo una arquitectura cliente-servidor de una sola página (Single Page Application, SPA). Utiliza **React**, **Vite** y **TypeScript** en el frontend, y **Node.js** (Express ES Modules) con **SQLite** en el backend. 

El objetivo principal es permitir la visualización interactiva de proyectos, habilidades, logros y formación académica, además de proveer una interfaz de administración segura para la gestión de contenidos mediante operaciones de lectura, creación y eliminación (CRUD).

---

## 2. Requisitos del Sistema y Ejecución

### 2.1 Backend (Servidor REST API)
1. Navegar a la carpeta `backend/`.
2. Instalar las dependencias requeridas mediante el comando:
   ```bash
   npm install
   ```
3. Iniciar el servidor API mediante:
   ```bash
   npm run dev
   ```
   *El servidor se iniciará dinámicamente en el puerto especificado en la variable `PORT` (por defecto `5000`).*

### 2.2 Frontend (Aplicación Web React)
1. Navegar al directorio raíz del proyecto (`frontend`).
2. Instalar las dependencias mediante:
   ```bash
   npm install
   ```
3. Ejecutar la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```

---

## 3. Guía de Uso del Usuario Final

### 3.1 Navegación y Secciones
- **Inicio (Hero):** Presentación principal con resumen y botones de navegación rápida.
- **Sobre Mí:** Visualización de formación académica y participación en competencias u olimpíadas.
- **Proyectos:** Catálogo de desarrollos realizados. Incluye botones de detalle con comportamiento de uso único.
- **Tecnologías e Intereses:** Matriz interactiva de habilidades clasificadas por categoría.
- **Contacto y Descargas:** Formulario de contacto y botón de descarga del CV con registro automático en base de datos.

### 3.2 Alternancia de Temas (Modo Claro / Modo Oscuro)
El sistema incluye soporte dinámico para modo claro y modo oscuro. El tema claro utiliza tonos suaves y sutiles para prevenir el agotamiento visual, asegurando contraste legible en la tipografía.

---

## 4. Guía del Administrador (Gestión de Contenido y CRUD)

### 4.1 Autenticación de Administrador
1. Hacer clic en el icono del candado (<kbd>🔒</kbd>) ubicado en la barra superior de navegación.
2. Ingrese la contraseña de administrador (`admin123`).
3. Al autenticarse correctamente, el sistema habilitará los botones de edición y eliminación en cada sección.

### 4.2 Validaciones de Entrada en Tiempo Real
Todas las interfaces de carga de datos ejecutan validaciones instantáneas (`on real time`):
- **Campos de Texto:** No admiten caracteres numéricos ni símbolos especiales (excepto el apostrofe `'`). En caso de error, el borde del campo se resalta en rojo y muestra una advertencia descriptiva.
- **Cálculo Automático de Edad:** Al seleccionar una fecha de nacimiento, el sistema calcula la edad automáticamente y verifica que no supere los 120 años.

### 4.3 Confirmación Inline para Eliminación
Al presionar el botón de eliminación (<kbd>🗑️</kbd>), se despliega una tarjeta de confirmación dentro del mismo contenedor (`¿Estás seguro que querés eliminar?`), evitando el uso de modales nativos del navegador.

---

## Referencias (Estilo APA 7)

- American Psychological Association. (2020). *Publication manual of the American Psychological Association* (7th ed.). https://doi.org/10.1037/0000165-000
- React Open Source Project. (2026). *React documentation and hooks reference*. Meta Platforms, Inc. https://react.dev
- Node.js Contributors. (2026). *Node.js v20.x ES modules and HTTP server specifications*. OpenJS Foundation. https://nodejs.org
