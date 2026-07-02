# alumnos-api

1. Crear la base de datos: `mysql -u root -p < sql/schema.sql`
2. Ajustar credenciales si hace falta en `modules/config.js` (o con variables de entorno `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `PORT`).
3. Instalar dependencias: `npm install`
4. Iniciar: `npm start`
5. Abrir `http://localhost:3001`

API REST expuesta en `http://localhost:3001/api/alumnos` (GET, POST, PUT/:id, DELETE/:id).
