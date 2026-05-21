// =========================
// PUERTO
// =========================

const APP_PORT = 3000;

// =========================
// ARRAYS
// =========================

let numeros = [1, 2, 3, 4, 5];

let numeros2 = [2, 3, 4];

let productos = [
  { precio: 100 },
  { precio: 250 },
  { precio: 400 }
];

// =========================
// RENDER
// =========================

function render(id, arr) {

  const div =
    document.getElementById(id);

  const contenido =
    arr
      .map(e =>
        typeof e === "object"
          ? JSON.stringify(e)
          : e
      )
      .join(", ");

  div.textContent =
    `${id}=[${contenido}]`;

}

function actualizar() {

  render("suma", numeros);

  render("mult", numeros2);

  render("precios", productos);

}

// =========================
// REDUCE - SUMA
// =========================

document
  .getElementById("btnSuma")
  .addEventListener("dblclick", (e) => {

    const resultado =
      numeros.reduce(
        (acc, n) => acc + n,
        0
      );

    document
      .getElementById("resSuma")
      .textContent =
        `suma_total=${resultado}`;

    e.target.remove();

  });

// =========================
// REDUCE - MULTIPLICACION
// =========================

document
  .getElementById("btnMult")
  .addEventListener("dblclick", (e) => {

    const resultado =
      numeros2.reduce(
        (acc, n) => acc * n,
        1
      );

    document
      .getElementById("resMult")
      .textContent =
        `producto_total=${resultado}`;

    e.target.remove();

  });

// =========================
// REDUCE - OBJETOS
// =========================

document
  .getElementById("btnPrecios")
  .addEventListener("dblclick", (e) => {

    const resultado =
      productos.reduce(
        (acc, obj) => acc + obj.precio,
        0
      );

    document
      .getElementById("resPrecios")
      .textContent =
        `total_precios=${resultado}`;

    e.target.remove();

  });

// =========================
// MODO OSCURO
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

const savedTheme =
  localStorage.getItem("theme") || "light";

html.setAttribute("data-theme", savedTheme);

updateThemeButton(savedTheme);

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

actualizar();

console.log(
  `Aplicación inicializada en el puerto: ${APP_PORT}`
);