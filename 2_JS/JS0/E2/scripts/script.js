// =========================
// ARRAYS
// =========================

let animales = [
  "Perro",
  "Gato",
  "Pez",
  "Tigre",
  "León"
];

let compras = [
  "Harina",
  "Arroz",
  "Aceite",
  "Galletitas",
  "Papel Higiénico"
];

let numeros = [
  2,
  4,
  6,
  8,
  10
];

// =========================
// RENDER
// =========================

function renderLista(id, array) {

  const contenedor =
    document.getElementById(id);

  contenedor.textContent =
    `${id}=[${array.join(', ')}]`;

}

function controlarBotones() {

  document.getElementById("btnAnimal")
    .style.display =
      animales.length === 0
        ? "none"
        : "block";

  document.getElementById("btnCompra")
    .style.display =
      compras.length === 0
        ? "none"
        : "block";

  document.getElementById("btnNumero")
    .style.display =
      numeros.length === 0
        ? "none"
        : "block";

}

function actualizarPantalla() {

  renderLista("animales", animales);
  renderLista("compras", compras);
  renderLista("numeros", numeros);

  controlarBotones();

}

// =========================
// FUNCIONES POP
// =========================

function eliminarAnimal() {

  if (animales.length > 0) {

    let eliminado =
      animales.pop();

    document.getElementById("resultado")
      .textContent =
        `Elemento eliminado: ${eliminado}`;

  }

  actualizarPantalla();

}

function eliminarProducto() {

  if (compras.length > 0) {

    let eliminado =
      compras.pop();

    document.getElementById("resultado")
      .textContent =
        `Elemento eliminado: ${eliminado}`;

  }

  actualizarPantalla();

}

function vaciarNumeros() {

  let eliminados = [];

  while (numeros.length > 0) {

    eliminados.push(
      numeros.pop()
    );

  }

  document.getElementById("resultado")
    .textContent =
      `Se eliminaron: ${eliminados.join(", ")}`;

  actualizarPantalla();

}

// =========================
// DOBLE TOQUE
// =========================

let ultimoToque = 0;

function dobleToque(funcion) {

  let tiempoActual =
    new Date().getTime();

  let diferencia =
    tiempoActual - ultimoToque;

  if (diferencia < 500 && diferencia > 0) {
    funcion();
  }

  ultimoToque = tiempoActual;

}

// Eventos
document.getElementById("btnAnimal")
  .addEventListener(
    "click",
    () => dobleToque(eliminarAnimal)
  );

document.getElementById("btnCompra")
  .addEventListener(
    "click",
    () => dobleToque(eliminarProducto)
  );

document.getElementById("btnNumero")
  .addEventListener(
    "click",
    () => dobleToque(vaciarNumeros)
  );

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