// server.js

import http from 'http';
import fs from 'fs';
import { URL } from 'url';
import { menu } from './modules/menuModule.js';

const server = http.createServer((req, res) => {

  // usar módulo URL
  const urlCompleta = new URL(req.url, 'http://localhost:3000');
  const path = urlCompleta.pathname;

  console.log('Path:', path);

  let archivo = '';

  // rutas
  if (path === '/') {
    archivo = './pages/index.html';
  } 
  else if (path === '/contacto') {
    archivo = './pages/contacto.html';
  } 
  else if (path === '/nosotros') {
    archivo = './pages/nosotros.html';
  } 
  else if (path === '/menu') {
    archivo = './pages/menu.html';
  } 
  else if (path === '/galeria') {
    archivo = './pages/galeria.html';
  }
  else if (path === '/eventos') {
    archivo = './pages/eventos.html';
  }

  // CSS
  // CSS (cualquier archivo dentro de /styles)
else if (path.startsWith('/styles/')) {
  fs.readFile('.' + path, (err, data) => {
    if (err) {
      console.error(err);
      res.writeHead(404);
      res.end('CSS no encontrado');
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/css' });
    res.end(data);
  });
  return;
}

  // si encontró archivo HTML
  if (archivo !== '') {
    fs.readFile(archivo, (err, data) => {
      if (err) {
        res.end('Error');
        return;
      }

      let html = data.toString();

      // insertar menú
      html = html.replace('<!-- MENU -->', menu);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    });
  } else {
    res.writeHead(404);
    res.end('No encontrado');
  }
});

server.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});