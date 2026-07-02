/**
 * server.js
 * Punto de entrada del proyecto 2: sirve la página que consume
 * la API REST del proyecto 1 y muestra los alumnos en pantalla.
 * De dónde viene: usa SERVER_PORT de config.js.
 * A dónde va: escucha en SERVER_PORT y entrega pages/, styles/ y scripts/.
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { SERVER_PORT } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.listen(SERVER_PORT, () => {
  console.log(`Servidor de alumnos-consumidor corriendo en http://localhost:${SERVER_PORT}`);
});
