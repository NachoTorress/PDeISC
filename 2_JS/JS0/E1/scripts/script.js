// =========================
// ARRAYS
// =========================

let frutas = [];
let amigos = [];
let numeros = [3, 5, 7];

// =========================
// RENDER
// =========================

function renderLista(id, array) {

  const contenedor = document.getElementById(id);

  contenedor.textContent =
    `${id}=[${array.join(', ')}]`;

}

function actualizarPantalla() {

  renderLista("frutas", frutas);
  renderLista("amigos", amigos);
  renderLista("numeros", numeros);

}

// =========================
// FUNCIONES PUSH
// =========================

function agregarFruta() {

  const lista = [
    "Banana",
    "Mandarina",
    "Naranja",
    "Manzana",
    "Pera"
  ];

  const fruta =
    lista[Math.floor(Math.random() * lista.length)];

  frutas.push(fruta);

  actualizarPantalla();

}

function agregarAmigo() {

  const lista = [
    "Tizi",
    "Valen",
    "Alexis",
    "Juan",
    "Pedro"
  ];

  const amigo =
    lista[Math.floor(Math.random() * lista.length)];

  amigos.push(amigo);

  actualizarPantalla();

}

function agregarNumero() {

  let num =
    Math.floor(Math.random() * 10) + 1;

  let ultimo =
    numeros[numeros.length - 1];

  document.getElementById("resultadoNumero")
    .textContent = `Número generado: ${num}`;

  if (num > ultimo) {
    numeros.push(num);
  }

  actualizarPantalla();

}

// =========================
// TEMA
// =========================

const themeToggle =
  document.getElementById("themeToggle");

const html =
  document.documentElement;

function updateThemeButton(theme) {

  if (theme === "dark") {

    themeToggle.textContent =
      "☀️ Modo claro";

    themeToggle.classList.remove("btn-dark");
    themeToggle.classList.add("btn-light");

  } else {

    themeToggle.textContent =
      "🌙 Modo oscuro";

    themeToggle.classList.remove("btn-light");
    themeToggle.classList.add("btn-dark");

  }

}

// Cargar tema
const savedTheme =
  localStorage.getItem("theme") || "light";

html.setAttribute("data-theme", savedTheme);

updateThemeButton(savedTheme);

// Cambiar tema
themeToggle.addEventListener("click", () => {

  const currentTheme =
    html.getAttribute("data-theme");

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

actualizarPantalla();