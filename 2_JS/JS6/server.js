/**
 * server.js
 * -------------------------------------------------------
 * De donde viene: es el punto de entrada de la aplicacion
 *                  (se ejecuta con "npm start").
 * A donde va:     sirve el front (pages, styles, scripts) y
 *                  monta las rutas de la API bajo /api,
 *                  delegando la logica a los modulos
 *                  correspondientes dentro de /modules.
 * -------------------------------------------------------
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { verificarConexion } from './modules/db.js';
import wordRoutes from './modules/routes/wordRoutes.js';
import scoreRoutes from './modules/routes/scoreRoutes.js';
import pdfRoutes from './modules/routes/pdfRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// El puerto se define por variable de entorno, nunca hardcodeado.
const PUERTO = process.env.PORT || 3000;

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Archivos estaticos del front
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

// Pagina principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

// Rutas de la API
app.use('/api', wordRoutes);
app.use('/api', scoreRoutes);
app.use('/api', pdfRoutes);

// Manejo de rutas inexistentes
app.use((req, res) => {
    res.status(404).json({ error: 'Recurso no encontrado.' });
});

app.listen(PUERTO, async () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PUERTO}`);
    await verificarConexion();
});
