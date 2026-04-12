//Creación de funciones para realizar operaciones matemáticas básicas
function suma(a, b) {
    return a + b;
}
function resta(a, b) {
    return a - b;
}
function multiplicacion(a, b) {
    return a * b;
}
function division(a, b) {
    return a / b;
}
// ejercicio3.js
import { createServer } from 'node:http';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World!\n');
});

// starts a simple http server locally on port 3000
server.listen(3000, '127.0.0.1', () => {
    // Console log para mostrar el resultado de operaciones matemáticas utilizando las funciones creadas
    console.log("Resultado de la suma 4 y 5: "+ suma(4,5));
    console.log("Resultado de la resta de 6 a 3: "+ resta(3,6));
    console.log("Resultado de la multiplicación de 2 por 7: "+ multiplicacion(2,7));
    console.log("Resultado de la división de 20 entre 4: "+ division(20,4));
});

// run with `node ejercicio3.js`
