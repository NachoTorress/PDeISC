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

        <!-- Estilos CSS para dar formato a la pagina -->
        <style>
          body {
            font-family: Arial;
            padding: 20px;
          }
          h2 {
            text-align: center;
          }
          table {
            border-collapse: collapse;
            width: 60%;
            margin: 20px auto;
          }
          th {
            background-color: #333;
            color: white;
            padding: 10px;
          }
          td {
            padding: 8px;
            border: 1px solid #ccc;
            text-align: center;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .texto {
            text-align: center;
            margin-top: 20px;
            font-size: 18px;
          }
        </style>
      </head>

      <body>

        <!-- Ejercicio 1: Mostrar mensajes -->
        <div class="texto">
          <p>Hola mundo desde Node.js</p>
          <p>Fin</p>
        </div>

        <!-- Ejercicio 2: Resultados directos -->
        <h2>Resultados directos</h2>
        <table>
          <tr>
            <th>Operacion</th>
            <th>Resultado</th>
          </tr>
          <!-- Operaciones realizadas directamente -->
          <tr><td>4 + 5</td><td>${4+5}</td></tr>
          <tr><td>3 - 6</td><td>${3-6}</td></tr>
          <tr><td>2 * 7</td><td>${2*7}</td></tr>
          <tr><td>20 / 4</td><td>${20/4}</td></tr>
        </table>

        <!-- Ejercicio 3: Resultados usando funciones -->
        <h2>Resultados con funciones</h2>
        <table>
          <tr>
            <th>Operacion</th>
            <th>Resultado</th>
          </tr>
          <!-- Uso de funciones definidas en este archivo -->
          <tr><td>4 + 5</td><td>${suma(4,5)}</td></tr>
          <tr><td>3 - 6</td><td>${resta(3,6)}</td></tr>
          <tr><td>2 * 7</td><td>${multiplicacion(2,7)}</td></tr>
          <tr><td>20 / 4</td><td>${division(20,4)}</td></tr>
        </table>

        <!-- Ejercicio 4: Resultados usando modulo -->
        <h2>Resultados con modulo</h2>
        <table>
          <tr>
            <th>Operacion</th>
            <th>Resultado</th>
          </tr>
          <!-- Uso de funciones importadas desde calculos.js -->
          <tr><td>5 + 3</td><td>${calc.suma(5,3)}</td></tr>
          <tr><td>8 - 6</td><td>${calc.resta(8,6)}</td></tr>
          <tr><td>3 * 11</td><td>${calc.multiplicacion(3,11)}</td></tr>
          <tr><td>30 / 5</td><td>${calc.division(30,5)}</td></tr>
        </table>

      </body>
    </html>
  `);
});

// =======================
// INICIO DEL SERVIDOR
// =======================

// El servidor escucha en localhost puerto 3000
server.listen(3000, '127.0.0.1', () => {
  console.log('http://127.0.0.1:3000');
});
