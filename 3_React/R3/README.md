# Sistema de usuarios SQL + API + React

Proyecto completo con un backend unificado y dos frontends independientes:

- **Frontend React Router** (`frontend-router/`): Manejo de pantallas y protección de rutas con `react-router-dom`. (Puerto `5173`)
- **Frontend useState** (`frontend-state/`): Navegación mediante estado local de React sin router. (Puerto `5174`)
- **Backend API** (`backend/`): Node + Express con MySQL, JWT y Bcrypt. (Puerto `3001`)

## Estructura

```txt
R3/
  backend/
    src/
      config/
      controllers/
      database/schema.sql
      middlewares/
      routes/
      services/
      utils/
      validators/
  frontend-router/
    src/
      components/
      contexts/
      pages/
      services/
      styles/
      types/
  frontend-state/
    src/
      components/
      contexts/
      pages/
      services/
      styles/
      types/
```

## Instalación del backend

Desde la carpeta `backend` ejecutar:

```bash
npm install
```

Si tenés que instalar dependencia por dependencia, estos son los comandos:

```bash
npm install express cors dotenv helmet morgan bcryptjs jsonwebtoken mysql2 express-rate-limit
npm install -D nodemon
```

Después crear el archivo `.env` copiando `.env.example` y completar los datos de MySQL:

```bash
cp .env.example .env
```

Levantar la API:

```bash
npm run dev
```

La API queda por defecto en: `http://localhost:3001/api`

---

## Instalación del Frontend con React Router (`frontend-router`)

Desde la carpeta `frontend-router` ejecutar:

```bash
npm install
npm run dev
```

El frontend React Router queda disponible en: `http://localhost:5173`

---

## Instalación del Frontend con useState (`frontend-state`)

Desde la carpeta `frontend-state` ejecutar:

```bash
npm install
npm run dev
```

El frontend useState queda disponible en: `http://localhost:5174`

---

## Uso recomendado

1. Crear la base de datos con `schema.sql`.
2. Levantar el backend (`cd backend && npm run dev`).
3. Levantar cualquiera de los dos frontends (o ambos en paralelo en distintas pestañas).
4. Registrar el primer usuario (queda como administrador automáticamente).
5. Administrar usuarios desde el panel de control de cualquiera de los dos frontends.

## Rutas principales de la API

```txt
GET    /api/health
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
GET    /api/users
GET    /api/users/:id
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id
```
