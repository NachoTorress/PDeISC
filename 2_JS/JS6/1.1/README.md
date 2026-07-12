# 🪢 El Ahorcado

Juego del Ahorcado hecho con Node.js (Express, ES Modules), MySQL y front en
JavaScript puro + Bootstrap. Incluye tabla de posiciones editable, modo
claro/oscuro y descarga de comprobante en PDF.

## 📁 Estructura del proyecto

```
hangman-game/
├── server.js               # Punto de entrada (Express + sesiones)
├── modules/                 # Backend: DB, palabras, auth, validaciones, PDF, rutas
│   ├── db.js
│   ├── wordsService.js
│   ├── authService.js
│   ├── validators.js
│   ├── dateUtils.js
│   ├── scoreService.js
│   ├── pdfService.js
│   ├── middleware/
│   │   └── requireAuth.js
│   └── routes/
│       ├── wordRoutes.js
│       ├── scoreRoutes.js
│       ├── pdfRoutes.js
│       ├── authRoutes.js
│       └── adminWordRoutes.js
├── scripts/                  # Front-end (ES Modules, cargados en el navegador)
│   ├── api.js
│   ├── theme.js
│   ├── validation.js
│   ├── hangmanDrawing.js
│   ├── hangmanGame.js
│   ├── ui.js
│   ├── leaderboard.js
│   ├── main.js
│   ├── adminAuth.js
│   ├── adminWords.js
│   ├── adminScores.js
│   └── adminMain.js
├── pages/
│   ├── index.html            # Juego publico
│   └── admin.html            # Panel de administracion
├── styles/
│   ├── base.css
│   ├── light.css
│   ├── dark.css
│   └── admin.css
└── sql/
    └── create_db.sql          # Crea score + palabras + usuarios (con datos iniciales)
```

## 🚀 Como correrlo

1. **Crear la base de datos** (con MySQL corriendo en tu compu). Podes usar
   MySQL Workbench: `File → Open SQL Script...` → abrir `sql/create_db.sql`
   → ejecutar todo con el rayo ⚡. Esto crea las 3 tablas (`score`,
   `palabras`, `usuarios`) y carga datos iniciales, incluido el usuario admin.

2. **Configurar variables de entorno**: copiar `.env.example` como `.env`
   y completar usuario/contraseña de tu MySQL local (y opcionalmente
   `SESSION_SECRET`).
   ```bash
   cp .env.example .env
   ```

3. **Instalar dependencias**:
   ```bash
   npm install
   ```

4. **Levantar el servidor**:
   ```bash
   npm start
   ```

5. Abrir `http://localhost:3000` para jugar, o `http://localhost:3000/admin`
   para el panel de administracion.

## 🔐 Panel de administracion

- Usuario por defecto: **admin**
- Contraseña por defecto: **admin123**

Con esas credenciales podes:
- Agregar, editar o eliminar palabras del banco (las que se usan en el juego).
- Editar o eliminar puntajes de la tabla de posiciones.
- Cerrar sesion con el boton "Salir".

"¿Olvidaste tu contraseña?" no resetea nada automaticamente: solo indica que
hay que contactar a la administracion del sistema (es un solo usuario admin,
no hay autoregistro).

Para cambiar la contraseña del admin, generar un hash nuevo y actualizarlo
en la base:
```bash
node -e "console.log(require('bcryptjs').hashSync('TU_NUEVA_PASSWORD', 10))"
```
```sql
UPDATE usuarios SET password_hash = 'EL_HASH_GENERADO' WHERE usuario = 'admin';
```

## 🎮 Como se juega

- Al entrar, el sistema pide una palabra al azar por su propia API interna
  (`GET /api/palabra`) — el jugador nunca escribe la palabra.
- Se elige una letra por vez (click en el teclado o tecleando en el teclado
  fisico). Hay 6 intentos antes de perder.
- Al terminar la partida (ganada o perdida) se calcula el puntaje segun los
  intentos que te quedaron y el tiempo que tardaste.
- Se puede guardar el resultado en la tabla de posiciones (queda en MySQL) y
  descargar un PDF de comprobante.
- La tabla de posiciones publica es de solo lectura. Editar o eliminar un
  puntaje ahora es exclusivo del panel de administracion.

## 🎨 Temas

El switch de la navbar cambia entre modo claro y oscuro, y la preferencia
queda guardada en el navegador (localStorage).
