// ejercicio2.js
import { createServer } from 'node:http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  
});

// starts a simple http server locally on port 3000
server.listen(3000, '127.0.0.1', () => {
  // Console log para mostrar el resultado de operaciones matemáticas básicas
    console.log("Resultado de la suma de 4 y 5: "+ (4+5));
    console.log("Resultado de la resta de 6 a 3: "+ (3-6));
    console.log("Resultado de la multiplicación de 2 por 7: "+ (2*7));
    console.log("Resultado de la división de 20 entre 4: "+ (20/4));
});

// run with `node ejercicio2.js`





