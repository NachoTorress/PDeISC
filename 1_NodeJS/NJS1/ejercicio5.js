// Importa el modulo HTTP nativo de Node.js para crear el servidor
import { createServer } from 'node:http';

// Importa todas las funciones del modulo calculos.js (ejercicio 4)
import * as calc from './calculos.js';

// =======================
// FUNCIONES (Ejercicio 3)
// =======================

// Funcion que suma dos numeros
function suma(a, b) { return a + b; }

// Funcion que resta dos numeros
function resta(a, b) { return a - b; }

// Funcion que multiplica dos numeros
function multiplicacion(a, b) { return a * b; }

// Funcion que divide dos numeros
function division(a, b) { return a / b; }

// =======================
// CREACION DEL SERVIDOR
// =======================

// Se crea el servidor HTTP
const server = createServer((req, res) => {

  // Se define la cabecera indicando que la respuesta sera HTML
  res.writeHead(200, { 'Content-Type': 'text/html' });

  // Se envia la respuesta al navegador
 res.end(`
  <html>
    <head>
      <title>Ejercicios Node</title>

      <!-- META RESPONSIVE -->
      <meta name="viewport" content="width=device-width, initial-scale=1">

      <!-- Bootstrap CDN -->
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>

    <body class="bg-light">

      <div class="container py-4">

        <!-- Texto -->
        <div class="text-center mb-4">
          <p class="fs-4">Hola mundo desde Node.js</p>
          <p>Fin</p>
        </div>

        <!-- TABLA 1 -->
        <h2 class="text-center">Resultados directos</h2>
        <div class="table-responsive">
          <table class="table table-striped table-bordered text-center">
            <thead class="table-dark">
              <tr>
                <th>Operacion</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>4 + 5</td><td>${4+5}</td></tr>
              <tr><td>3 - 6</td><td>${3-6}</td></tr>
              <tr><td>2 * 7</td><td>${2*7}</td></tr>
              <tr><td>20 / 4</td><td>${20/4}</td></tr>
            </tbody>
          </table>
        </div>

        <!-- TABLA 2 -->
        <h2 class="text-center mt-5">Resultados con funciones</h2>
        <div class="table-responsive">
          <table class="table table-striped table-bordered text-center">
            <thead class="table-dark">
              <tr>
                <th>Operacion</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>4 + 5</td><td>${suma(4,5)}</td></tr>
              <tr><td>3 - 6</td><td>${resta(3,6)}</td></tr>
              <tr><td>2 * 7</td><td>${multiplicacion(2,7)}</td></tr>
              <tr><td>20 / 4</td><td>${division(20,4)}</td></tr>
            </tbody>
          </table>
        </div>

        <!-- TABLA 3 -->
        <h2 class="text-center mt-5">Resultados con modulo</h2>
        <div class="table-responsive">
          <table class="table table-striped table-bordered text-center">
            <thead class="table-dark">
              <tr>
                <th>Operacion</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>5 + 3</td><td>${calc.suma(5,3)}</td></tr>
              <tr><td>8 - 6</td><td>${calc.resta(8,6)}</td></tr>
              <tr><td>3 * 11</td><td>${calc.multiplicacion(3,11)}</td></tr>
              <tr><td>30 / 5</td><td>${calc.division(30,5)}</td></tr>
            </tbody>
          </table>
        </div>

      </div>

    </body>
  </html>
`)});

// =======================
// INICIO DEL SERVIDOR
// =======================

// El servidor escucha en localhost puerto 3000
server.listen(3000, '127.0.0.1', () => {
  console.log('http://127.0.0.1:3000');
});
