// Código JavaScript para manejar la lógica de la página
let numeros = [10, 20, 30, 40, 50];
let peliculas = [
  "Inception",
  "The Matrix",
  "Interstellar",
  "The Dark Knight",
  "Pulp Fiction"
];
let datos = [5, 15, 25, 35, 45, 55];

// Función que renderiza un array en la página HTML
function render(id, arr) {
  const div = document.getElementById(id);

  let html = "<ul class='lista'>";
  arr.forEach(e => html += `<li>${e}</li>`);
  html += "</ul>";

  div.innerHTML = html;
}

// Función que realiza una acción de la interfaz
function init() {
  render("numeros", numeros);
  render("peliculas", peliculas);
  render("ultimos", datos);
}

/* DOBLE CLICK - NUMEROS */
document.getElementById("btnNumeros").addEventListener("dblclick", (e) => {
  const copia = numeros.slice(0, 3);

  document.getElementById("resNumeros").innerHTML =
    `<div class="resultado">Copia: ${JSON.stringify(copia)}</div>`;

  e.target.remove();
});

/* DOBLE CLICK - PELICULAS */
document.getElementById("btnPeliculas").addEventListener("dblclick", (e) => {
  const copia = peliculas.slice(2, 4);

  document.getElementById("resPeliculas").innerHTML =
    `<div class="resultado">Copia: ${JSON.stringify(copia)}</div>`;

  e.target.remove();
});

/* DOBLE CLICK - ULTIMOS */
document.getElementById("btnUltimos").addEventListener("dblclick", (e) => {
  const copia = datos.slice(datos.length - 3);

  document.getElementById("resUltimos").innerHTML =
    `<div class="resultado">Copia: ${JSON.stringify(copia)}</div>`;

  e.target.remove();
});

init();