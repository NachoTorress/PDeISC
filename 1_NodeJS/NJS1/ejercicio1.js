// ejercicio1.js
import { createServer } from 'node:http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  
});
server.listen(3000, '127.0.0.1', () => {
  console.log("Hola Mundo");
  console.log("Fin");
});

// run with `node ejercicio1.js`
