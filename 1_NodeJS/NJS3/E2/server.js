import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Mapeamos las carpetas con prefijos para mantener el orden en el HTML
app.use('/pages', express.static(path.join(__dirname, 'pages')));
app.use('/scripts', express.static(path.join(__dirname, 'scripts')));
app.use('/styles', express.static(path.join(__dirname, 'styles')));
app.use('/modules', express.static(path.join(__dirname, 'modules')));

// Array con las rutas de nuestros 6 componentes (index + 5 herramientas)
const pages = ['index', 'calculadora', 'generador', 'reloj', 'tareas', 'conversor'];

// Generador automático de rutas GET
pages.forEach(page => {
    // Si la ruta es '/', carga index.html. Si no, carga el nombre de la página.
    const route = page === 'index' ? '/' : `/${page}`;
    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, 'pages', `${page}.html`));
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor activo en http://localhost:${PORT}`);
});