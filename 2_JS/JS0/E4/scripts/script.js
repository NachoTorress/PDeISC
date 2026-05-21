// =========================
// ARRAYS PRINCIPALES
// =========================

let enteros = [1, 2, 3, 4, 5];

let mensajes = [
  "Hola",
  "¿Cómo estás?",
  "Adiós"
];

let cola = [
  "Primero",
  "Segundo",
  "Tercero"
];

// =========================
// FUNCIONES DE RENDERIZADO
// =========================

/**
 * Muestra un array en pantalla
 * con formato: nombre=[dato, dato]
 */
function renderLista(id, array) {

  const contenedor =
    document.getElementById(id);

  contenedor.textContent =
    `${id}=[${array.join(', ')}]`;

}

/**
 * Oculta los controles cuando
 * los arrays quedan vacíos
 */
function controlarInputs() {

  if (enteros.length === 0) {

    document.getElementById("rangoEnteros")
      .style.display = "none";

    document.getElementById("textoEnteros")
      .style.display = "none";

  }

  if (mensajes.length === 0) {

    document.getElementById("rangoMensajes")
      .style.display = "none";

    document.getElementById("textoMensajes")
      .style.display = "none";

  }

  if (cola.length === 0) {

    document.getElementById("rangoCola")
      .style.display = "none";

    document.getElementById("textoCola")
      .style.display = "none";

  }

}

/**
 * Actualiza todos los arrays
 * en pantalla
 */
function actualizarPantalla() {

  renderLista("enteros", enteros);
  renderLista("mensajes", mensajes);
  renderLista("cola", cola);

  controlarInputs();

}

// =========================
// FUNCIONES AUXILIARES
// =========================

/**
 * Reinicia un input range
 * a su valor inicial
 */
function resetRange(id) {

  document.getElementById(id).value = 0;

}

// =========================
// FUNCIONES SHIFT
// =========================

/**
 * Elimina el primer entero
 * del array
 */
function eliminarEntero() {

  if (enteros.length > 0) {

    const eliminado =
      enteros.shift();

    document.getElementById("resultado")
      .textContent =
        `Elemento eliminado: ${eliminado}`;

  }

  resetRange("rangoEnteros");

  actualizarPantalla();

}

/**
 * Elimina el primer mensaje
 * del array
 */
function eliminarMensaje() {

  if (mensajes.length > 0) {

    const eliminado =
      mensajes.shift();

    document.getElementById("resultado")
      .textContent =
        `Elemento eliminado: ${eliminado}`;

  }

  resetRange("rangoMensajes");

  actualizarPantalla();

}

/**
 * Atiende al primer cliente
 * de la cola
 */
function atenderCliente() {

  if (cola.length > 0) {

    const eliminado =
      cola.shift();

    document.getElementById("resultado")
      .textContent =
        `Cliente atendido: ${eliminado}`;

  }

  resetRange("rangoCola");

  actualizarPantalla();

}

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

// Muestra el contenido inicial
actualizarPantalla();