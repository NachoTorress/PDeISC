import * as calc from '../modules/calculos.js';

function suma(a, b) { return a + b; }
function resta(a, b) { return a - b; }
function multiplicacion(a, b) { return a * b; }
function division(a, b) { return a / b; }

export function renderHomePage() {

  return `
  <!DOCTYPE html>
  <html lang="es">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Ejercicios Node</title>

    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
      rel="stylesheet"
    >

    <link rel="stylesheet" href="/styles/styles.css">
  </head>

  <body>

    <div class="container py-4">

      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="m-0">Ejercicios Node.js</h1>

        <button
          id="themeButton"
          class="btn btn-outline-primary"
        >
          🌙 Modo oscuro
        </button>
      </div>

      <!-- EJERCICIO 1 -->

      <div class="card custom-card mb-4">
        <div class="card-body text-center">
          <p class="fs-4">
            (Ejercicio 1) Hola mundo desde Node.js
          </p>

          <p>Fin</p>
        </div>
      </div>

      <!-- TABLA 1 -->

      <div class="card custom-card mb-4">
        <div class="card-body">

          <h2 class="text-center mb-4">
            Resultados directos (Ejercicio 2)
          </h2>

          <div class="table-responsive">

            <table class="table table-bordered text-center align-middle">

              <thead>
                <tr>
                  <th>Operacion</th>
                  <th>Resultado</th>
                </tr>
              </thead>

              <tbody>
                <tr><td>4 + 5</td><td>${4 + 5}</td></tr>
                <tr><td>3 - 6</td><td>${3 - 6}</td></tr>
                <tr><td>2 * 7</td><td>${2 * 7}</td></tr>
                <tr><td>20 / 4</td><td>${20 / 4}</td></tr>
              </tbody>

            </table>

          </div>
        </div>
      </div>

      <!-- TABLA 2 -->

      <div class="card custom-card mb-4">
        <div class="card-body">

          <h2 class="text-center mb-4">
            Resultados con funciones (Ejercicio 3)
          </h2>

          <div class="table-responsive">

            <table class="table table-bordered text-center align-middle">

              <thead>
                <tr>
                  <th>Operacion</th>
                  <th>Resultado</th>
                </tr>
              </thead>

              <tbody>
                <tr><td>4 + 5</td><td>${suma(4, 5)}</td></tr>
                <tr><td>3 - 6</td><td>${resta(3, 6)}</td></tr>
                <tr><td>2 * 7</td><td>${multiplicacion(2, 7)}</td></tr>
                <tr><td>20 / 4</td><td>${division(20, 4)}</td></tr>
              </tbody>

            </table>

          </div>
        </div>
      </div>

      <!-- TABLA 3 -->

      <div class="card custom-card">
        <div class="card-body">

          <h2 class="text-center mb-4">
            Resultados con módulo (Ejercicio 4)
          </h2>

          <div class="table-responsive">

            <table class="table table-bordered text-center align-middle">

              <thead>
                <tr>
                  <th>Operacion</th>
                  <th>Resultado</th>
                </tr>
              </thead>

              <tbody>
                <tr><td>5 + 3</td><td>${calc.suma(5, 3)}</td></tr>
                <tr><td>8 - 6</td><td>${calc.resta(8, 6)}</td></tr>
                <tr><td>3 * 11</td><td>${calc.multiplicacion(3, 11)}</td></tr>
                <tr><td>30 / 5</td><td>${calc.division(30, 5)}</td></tr>
              </tbody>

            </table>

          </div>
        </div>
      </div>

    </div>

    <script src="/scripts/theme.js"></script>

  </body>
  </html>
  `;
}