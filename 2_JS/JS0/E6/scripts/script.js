// =========================
// ARRAYS
// =========================

// Array de números
let numeros = [10, 20, 30, 40, 50];

// Array de películas
let peliculas = [
  "Inception",
  "The Matrix",
  "Interstellar",
  "The Dark Knight",
  "Pulp Fiction"
];

// Array de datos
let datos = [5, 15, 25, 35, 45, 55];

// =========================
// RENDERIZADO
// =========================

// Muestra un array en pantalla
function render(id, arr) {

  const div = document.getElementById(id);

  div.textContent = `${id}=[${arr.join(', ')}]`;

}

// Inicializa las listas
function init() {

  render("numeros", numeros);

  render("peliculas", peliculas);

  render("ultimos", datos);

}

// =========================
// SLICE - NÚMEROS
// =========================

// Copia los primeros 3 números
document.getElementById("btnNumeros")
.addEventListener("dblclick", (e) => {

  const copia = numeros.slice(0, 3);

  document.getElementById("resNumeros").innerHTML =
    `<div class="resultado-array">copia_numeros=[${copia.join(', ')}]</div>`;

  // Elimina el botón luego de usarlo
  e.target.remove();

});

// =========================
// SLICE - PELÍCULAS
// =========================

// Copia desde la posición 2 hasta la 4
document.getElementById("btnPeliculas")
.addEventListener("dblclick", (e) => {

  const copia = peliculas.slice(2, 5);

  document.getElementById("resPeliculas").innerHTML =
    `<div class="resultado-array">copia_peliculas=[${copia.join(', ')}]</div>`;

  // Elimina el botón luego de usarlo
  e.target.remove();

});

// =========================
// SLICE - ÚLTIMOS DATOS
// =========================

// Copia los últimos 3 elementos
document.getElementById("btnUltimos")
.addEventListener("dblclick", (e) => {

  const copia = datos.slice(-3);

  document.getElementById("resUltimos").innerHTML =
    `<div class="resultado-array">copia_datos=[${copia.join(', ')}]</div>`;

  // Elimina el botón luego de usarlo
  e.target.remove();

});

// =========================
// MODO OSCURO
// =========================

const themeToggle = document.getElementById("themeToggle");

const html = document.documentElement;

// Cambia el texto y color del botón
function updateThemeButton(theme) {

  if (theme === "dark") {

    themeToggle.textContent = "☀️ Modo claro";

    themeToggle.classList.remove("btn-dark");

    themeToggle.classList.add("btn-light");

  } else {

    themeToggle.textContent = "🌙 Modo oscuro";

    themeToggle.classList.remove("btn-light");

    themeToggle.classList.add("btn-dark");

  }

}

// Carga el tema guardado
const savedTheme = localStorage.getItem("theme") || "light";

html.setAttribute("data-theme", savedTheme);

updateThemeButton(savedTheme);

// Cambia entre claro y oscuro
themeToggle.addEventListener("click", () => {

  const currentTheme = html.getAttribute("data-theme");

  const newTheme =
    currentTheme === "light"
      ? "dark"
      : "light";

  html.setAttribute("data-theme", newTheme);

  localStorage.setItem("theme", newTheme);

  updateThemeButton(newTheme);

});

// =========================
// INICIO
// =========================

init();