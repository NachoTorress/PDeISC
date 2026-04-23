const express = require('express');
const path = require('path');
const app = express();
const PORT = 3004;

/**
 * CONFIGURACIÓN DE CARPETAS ESTÁTICAS
 * Esto permite que el HTML acceda a /scripts/script.js y /styles/reloj.css
 */
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));

// Ruta principal que entrega el index del Punto 5
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`-----------------------------------------------`);
    console.log(`🚀 Servidor Punto 5 (innerHTML) activo`);
    console.log(`🌍 URL: http://localhost:${PORT}`);
    console.log(`-----------------------------------------------`);
});