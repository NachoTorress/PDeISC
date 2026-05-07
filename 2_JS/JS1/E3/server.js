import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Puerto configurado en 3002 mediante variable
const PORT = process.env.PORT || 3002;

app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Registro Civil Activo: http://localhost:${PORT}`);
});