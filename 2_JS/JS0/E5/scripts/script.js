// =========================
// ARRAYS PRINCIPALES
// =========================

let letras = [
  "A",
  "B",
  "C",
  "D",
  "E"
];

let nombres = [
  "Ana",
  "Luis",
  "Carlos",
  "María",
  "Sofía"
];

let cosas = [
  "Display",
  "Teclado",
  "Mouse",
  "Parlantes"
];

// =========================
// FUNCIONES DE RENDERIZADO
// =========================

/**
 * Muestra un array en pantalla
 * con formato: nombre=[dato, dato]
 */
function render(id, arr) {

  const div =
    document.getElementById(id);

  div.textContent =
    `${id}=[${arr.join(', ')}]`;

}

/**
 * Actualiza todos los arrays
 * en pantalla
 */
function actualizar() {

  render("letras", letras);
  render("nombres", nombres);
  render("cosas", cosas);

}

// =========================
// LETRAS
// =========================

/**
 * Elimina 2 elementos
 * desde la posición 1
 */
document.getElementById("btnLetras")
  .addEventListener("click", (e) => {

    letras.splice(1, 2);

    document.getElementById("resultado")
      .textContent =
        "Se eliminaron elementos de letras";

    // Elimina el botón luego de usarlo
    e.target.remove();

    actualizar();

  });

// =========================
// NOMBRES
// =========================

/**
 * Inserta "Nacho"
 * en la posición 2
 */
document.getElementById("btnNombres")
  .addEventListener("click", (e) => {

    nombres.splice(2, 0, "Nacho");

    document.getElementById("resultado")
      .textContent =
        "Se insertó Nacho en nombres";

    // Elimina el botón luego de usarlo
    e.target.remove();

    actualizar();

  });

// =========================
// COSAS
// =========================

/**
 * Reemplaza elementos dinámicamente
 * usando datos ingresados por el usuario
 */
document.getElementById("btnCosas")
  .addEventListener("click", () => {

    const posInput =
      document.getElementById("pos");

    const pos =
      parseInt(posInput.value);

    const n1 =
      document.getElementById("n1").value;

    const n2 =
      document.getElementById("n2").value;

    const errorMsg =
      document.getElementById("errorMsg");

    // Valida que la posición exista
    if (
      !isNaN(pos) &&
      pos >= 0 &&
      pos < cosas.length
    ) {

      cosas.splice(pos, 2, n1, n2);

      document.getElementById("resultado")
        .textContent =
          `Se reemplazó desde posición ${pos}`;

      // Oculta el mensaje de error
      errorMsg.classList.add("d-none");

      // Elimina el bloque de inputs
      document.getElementById("inputsCosas")
        .remove();

      actualizar();

    } else {

      // Muestra error visual
      errorMsg.classList.remove("d-none");

      posInput.classList.add("is-invalid");

    }

  });

// =========================
// MODO OSCURO / CLARO
// =========================

const themeToggle =
  document.getElementById("themeToggle");

const html =
  document.documentElement;

/**
 * Actualiza el botón
 * según el tema actual
 */
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

// Carga el tema guardado
const savedTheme =
  localStorage.getItem("theme") || "light";

html.setAttribute("data-theme", savedTheme);

updateThemeButton(savedTheme);

// Evento para cambiar tema
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

// Renderiza arrays iniciales
actualizar();