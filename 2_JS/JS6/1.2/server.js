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
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { verificarConexion } from './modules/db.js';
import wordRoutes from './modules/routes/wordRoutes.js';
import scoreRoutes from './modules/routes/scoreRoutes.js';
import pdfRoutes from './modules/routes/pdfRoutes.js';
import authRoutes from './modules/routes/authRoutes.js';
import adminWordRoutes from './modules/routes/adminWordRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// El puerto se define por variable de entorno, nunca hardcodeado.
const PUERTO = process.env.PORT || 3000;

const app = express();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Sesion (cookie) para el login del panel de administracion.
app.use(session({
    name: 'ahorcado.sid',
    secret: process.env.SESSION_SECRET || 'cambiar-este-secreto-en-produccion',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 2, // 2 horas
        sameSite: 'lax',
    },
}));

// Archivos estaticos del front
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));

// Paginas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'admin.html'));
});

// Rutas de la API
app.use('/api', wordRoutes);
app.use('/api', scoreRoutes);
app.use('/api', pdfRoutes);
app.use('/api', authRoutes);
app.use('/api', adminWordRoutes);

// Manejo de rutas inexistentes
app.use((req, res) => {
    res.status(404).json({ error: 'Recurso no encontrado.' });
});

app.listen(PUERTO, async () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PUERTO}`);
    console.log(`🔐 Panel de administracion en http://localhost:${PUERTO}/admin`);
    await verificarConexion();
});
