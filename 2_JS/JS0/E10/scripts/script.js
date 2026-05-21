// =========================
// ARRAYS
// =========================

// Array de números
let numeros = [1, 2, 3, 4, 5];

// Array de nombres
let nombres = ["ana", "luis", "carlos", "maria"];

// Array de precios
let precios = [100, 250, 500, 1000];

// =========================
// RENDERIZADO
// =========================

// Muestra un array en pantalla
function render(id, arr) {

  const div = document.getElementById(id);

  div.textContent = `${id}=[${arr.join(", ")}]`;

}

// Actualiza todos los arrays
function actualizar() {

  render("numeros", numeros);

  render("nombres", nombres);

  render("precios", precios);

}

// =========================
// EVENTO - NUMEROS
// =========================

// Multiplica todos los números por 3
document
  .getElementById("rangeNum")
  .addEventListener("input", (e) => {

    // map() crea un nuevo array
    const resultado = numeros.map(numero => numero * 3);

    // Muestra el array transformado
    document.getElementById("resNumero").textContent =
      `resultado_numeros=[${resultado.join(", ")}]`;

    // Elimina texto y range después de ejecutar
    document.getElementById("txtNum").remove();

    e.target.remove();

  });

// =========================
// EVENTO - NOMBRES
// =========================

// Convierte nombres a mayúsculas
document
  .getElementById("rangeNombre")
  .addEventListener("input", (e) => {

    // map() transforma cada nombre
    const resultado = nombres.map(nombre =>
      nombre.toUpperCase()
    );

    // Muestra el nuevo array
    document.getElementById("resNombre").textContent =
      `resultado_nombres=[${resultado.join(", ")}]`;

    // Elimina texto y range después de ejecutar
    document.getElementById("txtNom").remove();

    e.target.remove();

  });

// =========================
// EVENTO - PRECIOS
// =========================

// Agrega IVA del 21%
document
  .getElementById("rangePrecio")
  .addEventListener("input", (e) => {

    // map() genera nuevos precios
    const resultado = precios.map(precio =>
      (precio * 1.21).toFixed(2)
    );

    // Muestra el nuevo array
    document.getElementById("resPrecio").textContent =
      `resultado_precios=[${resultado.join(", ")}]`;

    // Elimina texto y range después de ejecutar
    document.getElementById("txtPre").remove();

    e.target.remove();

  });

// =========================
// MODO OSCURO
// =========================

const themeToggle = document.getElementById("themeToggle");

const html = document.documentElement;

// Cambia el texto y estilo del botón
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

// Obtiene el tema guardado
const savedTheme =
  localStorage.getItem("theme") || "light";

// Aplica tema guardado
html.setAttribute("data-theme", savedTheme);

updateThemeButton(savedTheme);

// Cambia entre claro y oscuro
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

// Muestra los arrays al cargar
actualizar();