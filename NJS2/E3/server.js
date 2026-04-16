import http from 'http';
import { URL } from 'url';

const server = http.createServer((req, res) => {

  // Crear URL completa
  const urlCompleta = new URL(req.url, 'http://localhost:3000');

  // Mostrar datos en consola   
  console.log('Host:', urlCompleta.host);
  console.log('Path:', urlCompleta.pathname);
  console.log('Query:', urlCompleta.search);

  res.end('Mira la consola');
});

server.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});