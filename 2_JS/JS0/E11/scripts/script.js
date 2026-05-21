// =========================
// ARRAYS
// =========================

let numeros = [3, 8, 12, 15, 7, 20, 5, 30];

let palabras = [
  "casa",
  "computadora",
  "perro",
  "ventana",
  "sol",
  "javascript"
];

let usuarios = [
  { nombre: "Nacho", activo: true },
  { nombre: "Valen", activo: false },
  { nombre: "Alexis", activo: true },
  { nombre: "Tizi", activo: false }
];

// =========================
// RENDER
// =========================

function render(id, arr) {

  const div = document.getElementById(id);

  const contenido = arr
    .map(e =>
      typeof e === "object"
        ? JSON.stringify(e)
        : e
    )
    .join(", ");

  div.textContent = `${id}=[${contenido}]`;

}

function actualizar() {

  render("numeros", numeros);

  render("palabras", palabras);

  render("usuarios", usuarios);

}

// =========================
// FILTER NUMEROS
// =========================

document
  .getElementById("btnNum")
  .addEventListener("click", (e) => {

    const resultado =
      numeros.filter(n => n > 10);

    document.getElementById("resNum").textContent =
      `numeros_filtrados=[${resultado.join(", ")}]`;

    e.target.remove();

  });

// =========================
// FILTER PALABRAS
// =========================

document
  .getElementById("btnPal")
  .addEventListener("click", (e) => {

    const resultado =
      palabras.filter(p => p.length > 5);

    document.getElementById("resPal").textContent =
      `palabras_filtradas=[${resultado.join(", ")}]`;

    e.target.remove();

  });

// =========================
// FILTER USUARIOS
// =========================

document
  .getElementById("btnUsu")
  .addEventListener("click", (e) => {

    const resultado =
      usuarios
        .filter(u => u.activo)
        .map(u => u.nombre);

    document.getElementById("resUsu").textContent =
      `usuarios_activos=[${resultado.join(", ")}]`;

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