import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manejo de puerto mediante variable de entorno o valor por defecto
const PORT = 3001;

app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor Ejercicio 2 activo en: http://localhost:${PORT}`);
});