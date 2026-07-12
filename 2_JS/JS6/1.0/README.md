# 🪢 El Ahorcado

Juego del Ahorcado hecho con Node.js (Express, ES Modules), MySQL y front en
JavaScript puro + Bootstrap. Incluye tabla de posiciones editable, modo
claro/oscuro y descarga de comprobante en PDF.

## 📁 Estructura del proyecto

```
hangman-game/
├── server.js              # Punto de entrada (Express)
├── modules/                # Backend: DB, palabras, validaciones, PDF, rutas
│   ├── db.js
│   ├── words.js
│   ├── validators.js
│   ├── dateUtils.js
│   ├── scoreService.js
│   ├── pdfService.js
│   └── routes/
│       ├── wordRoutes.js
│       ├── scoreRoutes.js
│       └── pdfRoutes.js
├── scripts/                 # Front-end (ES Modules, cargados en el navegador)
│   ├── api.js
│   ├── theme.js
│   ├── validation.js
│   ├── hangmanDrawing.js
│   ├── hangmanGame.js
│   ├── ui.js
│   ├── leaderboard.js
│   └── main.js
├── pages/
│   └── index.html
├── styles/
│   ├── base.css
│   ├── light.css
│   └── dark.css
└── sql/
    └── create_db.sql
```

## 🚀 Como correrlo

1. **Crear la base de datos** (con MySQL corriendo en tu compu):
   ```bash
   mysql -u root -p < sql/create_db.sql
   ```

2. **Configurar variables de entorno**: copiar `.env.example` como `.env`
   y completar usuario/contraseña de tu MySQL local.
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
   (o `npm run dev` si tenes nodemon instalado, para reiniciar solo)

5. Abrir el navegador en `http://localhost:3000` (o el puerto que hayas
   configurado en `.env`).

## 🎮 Como se juega

- Al entrar, el sistema pide una palabra al azar por su propia API interna
  (`GET /api/palabra`) — el jugador nunca escribe la palabra.
- Se elige una letra por vez (click en el teclado o tecleando en el teclado
  fisico). Hay 6 intentos antes de perder.
- Al terminar la partida (ganada o perdida) se calcula el puntaje segun los
  intentos que te quedaron y el tiempo que tardaste.
- Se puede guardar el resultado en la tabla de posiciones (queda en MySQL) y
  descargar un PDF de comprobante.
- Desde la tabla de posiciones se puede editar el nombre/puntaje o eliminar
  un registro (con confirmacion dentro de la misma tarjeta).

## 🎨 Temas

El switch de la navbar cambia entre modo claro y oscuro, y la preferencia
queda guardada en el navegador (localStorage).
