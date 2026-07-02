/**
 * server.js
 * Punto de entrada del proyecto 1: expone la API REST de alumnos
 * y sirve la interfaz web para cargarlos/editarlos/eliminarlos.
 * De dónde viene: usa config.js (puerto) y alumnosRoutes.js (endpoints).
 * A dónde va: escucha en SERVER_PORT y responde a los pedidos del navegador
 * y del proyecto 2 (alumnos-consumidor), que consume esta API vía CORS.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { SERVER_PORT } from './modules/config.js';
import { router as alumnosRoutes } from './routes/alumnosRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Archivos estáticos del front-end
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

// API REST
app.use('/api/alumnos', alumnosRoutes);

// Página principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.listen(SERVER_PORT, () => {
  console.log(`Servidor de alumnos-api corriendo en http://localhost:${SERVER_PORT}`);
});
