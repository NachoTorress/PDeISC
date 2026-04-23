const express = require('express');
const path = require('path');
const app = express();
const PORT = 3003;

/**
 * IMPORTANTE: Servimos cada carpeta para que el navegador 
 * pueda acceder a los estilos y los scripts.
 */
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// Ruta principal para servir el index.html desde la carpeta /pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`🚀 Servidor E4 corriendo en: http://localhost:${PORT}`);
    console.log(`-------------------------------------------`);
});