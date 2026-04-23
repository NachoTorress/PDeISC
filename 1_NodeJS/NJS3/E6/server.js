import express from 'express';
import path from 'path';

const app = express();
const PORT = 3005;

// para usar archivos estáticos
app.use(express.static('pages'));
app.use('/styles', express.static('styles'));
app.use('/scripts', express.static('scripts'));

// ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.resolve('pages/index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});