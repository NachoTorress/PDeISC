import http from 'http';
import { upperCase } from 'upper-case';

const server = http.createServer((req, res) => {
  console.log("URL en mayúsculas:", upperCase(req.url));
    res.end('Mira la consola');
});

server.listen(3000, () => {
  console.log('Servidor en http://localhost:3000');
});

  


