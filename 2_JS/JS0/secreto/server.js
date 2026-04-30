const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    // 1. Limpiamos la URL y manejamos la ruta raíz
    let url = req.url === '/' ? '/html/index.html' : req.url;
    
    // 2. Construimos la ruta absoluta usando __dirname
    const filePath = path.join(__dirname, url);

    const extname = path.extname(filePath);
    let contentType = 'text/html';

    switch (extname) {
        case '.js': contentType = 'text/javascript'; break;
        case '.css': contentType = 'text/css'; break;
        case '.html': contentType = 'text/html'; break;
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            console.error(`Error buscando: ${filePath}`); // Esto te dirá en consola qué falló
            res.writeHead(404);
            res.end(`Archivo no encontrado en: ${filePath}`);
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(3014, () => {
    console.log('Servidor corriendo en http://localhost:3014');
    console.log('Presiona Ctrl+C para detenerlo');
});