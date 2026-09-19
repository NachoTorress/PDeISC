# Sistema de usuarios SQL + API + React

Proyecto completo con dos sistemas equivalentes de usuarios:

- Frontend con React Router.
- Frontend con navegacion manejada por `useState`.
- API en Node + Express usando ES modules (`import`).
- Base de datos SQL relacional normalizada, separada en cuentas, perfiles, roles y tipos de documento.
- Contraseñas protegidas con hash `bcrypt`.
- CRUD de usuarios con proteccion por token JWT.
- Persistencia en `localStorage` para sesion y tema visual.
- Validaciones en tiempo real en el frontend y validaciones repetidas en el backend.
- CSS separado para modo claro y modo oscuro.

## Estructura

```txt
sistema-usuarios-sql-react/
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
  frontend/
    src/
      components/
      contexts/
      hooks/
      pages/
      services/
      styles/
      types/
```

## Instalacion del backend

Desde la carpeta `backend` ejecutar:

```bash
npm install
```

Si tenes que instalar dependencia por dependencia, estos son los comandos:

```bash
npm install express cors dotenv helmet morgan bcryptjs jsonwebtoken mysql2 express-rate-limit
npm install -D nodemon
```

Despues crear el archivo `.env` copiando `.env.example` y completar los datos de MySQL:

```bash
cp .env.example .env
```

En Windows tambien podes copiarlo manualmente desde el explorador.

Crear la base con el archivo:

```txt
backend/src/database/schema.sql
```

Ejemplo con MySQL CLI:

```bash
mysql -u root -p < src/database/schema.sql
```

Levantar la API:

```bash
npm run dev
```

La API queda por defecto en:

```txt
http://localhost:3001/api
```

## Instalacion del frontend

Desde la carpeta `frontend` ejecutar:

```bash
npm install
```

Si tenes que instalar dependencia por dependencia, estos son los comandos:

```bash
npm install react react-dom react-router-dom react-hook-form bootstrap lucide-react
npm install -D vite typescript @vitejs/plugin-react eslint @eslint/js typescript-eslint @types/react @types/react-dom
```

Crear `.env.local` copiando `.env.example` si queres cambiar la URL de la API:

```txt
VITE_API_URL=http://localhost:3001/api
```

Levantar React:

```bash
npm run dev
```

El frontend queda por defecto en:

```txt
http://localhost:5173
```

## Uso recomendado

1. Crear la base de datos con `schema.sql`.
2. Levantar el backend.
3. Levantar el frontend.
4. Registrar el primer usuario.
5. El primer usuario queda como administrador automaticamente.
6. Desde ese usuario administrador se pueden crear, editar y eliminar usuarios.

## Seguridad y datos

- Las contraseñas nunca se guardan en texto plano.
- El backend nunca devuelve `password_hash`.
- Las rutas de usuarios requieren token JWT.
- Las validaciones del frontend se repiten en el backend para evitar confiar solo en el navegador.
- La API cierra el pool de conexiones de MySQL al recibir una senal de apagado.
- No hay funcionalidades de descarga en esta version; por eso no se generan logs locales de descargas.

## Validaciones incluidas

- Nombres y apellidos: letras, espacios y apostrofes; sin numeros.
- Fechas de nacimiento: no futuras y edad maxima de 120 anios.
- Edad: calculada automaticamente, no se guarda como dato duplicado.
- Email: formato valido.
- Documento: solo numeros positivos, entre 6 y 12 digitos.
- Telefono: opcional, solo numeros y `+` al inicio.
- Password: minimo 8 caracteres con mayuscula, minuscula, numero y simbolo.

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

