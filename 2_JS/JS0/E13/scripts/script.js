// =========================
// ARRAYS
// =========================

let numeros = [25, 8, 42, 3, 17, 10];

let palabras = [
  "banana",
  "manzana",
  "pera",
  "uva",
  "naranja"
];

let personas = [

  { nombre: "Nacho", edad: 20 },

  { nombre: "Valen", edad: 18 },

  { nombre: "Alexis", edad: 22 },

  { nombre: "Tizi", edad: 19 }

];

// =========================
// RENDER
// =========================

function render(id, arr) {

  const div = document.getElementById(id);

  const contenido = arr
    .map(e =>
      typeof e === "object"
        ? `${e.nombre}(${e.edad})`
        : e
    )
    .join(", ");

  div.textContent = `${id}=[${contenido}]`;

}

function actualizar() {

  render("numeros", numeros);

  render("palabras", palabras);

  render("personas", personas);

}

// =========================
// NUMEROS
// =========================

document
  .getElementById("selNum")
  .addEventListener("change", () => {

    const sorted = [...numeros]
      .sort((a, b) => a - b);

    document.getElementById("resNum").textContent =
      `numeros_ordenados=[${sorted.join(", ")}]`;

    document.getElementById("wrapperNum").remove();

  });

// =========================
// PALABRAS
// =========================

document
  .getElementById("selPal")
  .addEventListener("change", () => {

    const sorted = [...palabras]
      .sort();

    document.getElementById("resPal").textContent =
      `palabras_ordenadas=[${sorted.join(", ")}]`;

    document.getElementById("wrapperPal").remove();

  });

// =========================
// PERSONAS
// =========================

document
  .getElementById("selPer")
  .addEventListener("change", () => {

    const sorted = [...personas]
      .sort((a, b) => a.edad - b.edad);

    const resultado = sorted
      .map(p => `${p.nombre}(${p.edad})`)
      .join(", ");

    document.getElementById("resPer").textContent =
      `personas_ordenadas=[${resultado}]`;

    document.getElementById("wrapperPer").remove();

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

  }

  else {

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