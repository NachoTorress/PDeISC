// =========================
// ARRAYS PRINCIPALES
// =========================

let colores = [];

let tareas = [
  "Lavar los platos",
  "Hacer la cama",
  "Sacar la basura"
];

let usuarios = [
  "Cheski",
  "Tizi",
  "Valen"
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
 * Controla cuándo ocultar
 * los selects según la lógica del ejercicio
 */
function controlarOpciones() {

  // Oculta el select cuando ya hay 3 colores
  if (colores.length >= 3) {

    document.getElementById("selectColor")
      .style.display = "none";

  }

  // Oculta el select cuando la tarea ya fue agregada
  if (tareas[0] === "Tarea urgente para mañana") {

    document.getElementById("selectTarea")
      .style.display = "none";

  }

  // Oculta el select cuando Alexis ya está primero
  if (usuarios[0] === "Alexis") {

    document.getElementById("selectUsuario")
      .style.display = "none";

  }

}

/**
 * Actualiza todos los arrays en pantalla
 */
function actualizarPantalla() {

  renderLista("colores", colores);
  renderLista("tareas", tareas);
  renderLista("usuarios", usuarios);

  controlarOpciones();

}

// =========================
// FUNCIONES UNSHIFT
// =========================

/**
 * Agrega un color al inicio del array
 */
function agregarColor() {

  const select =
    document.getElementById("selectColor");

  const valor =
    select.value;

  if (valor !== "") {

    // Agrega el elemento al inicio
    colores.unshift(valor);

    document.getElementById("resultado")
      .textContent =
        `Último agregado: ${valor}`;

    // Reinicia el select
    select.value = "";

  }

  actualizarPantalla();

}

/**
 * Agrega una tarea urgente al inicio
 */
function agregarTarea() {

  const select =
    document.getElementById("selectTarea");

  const valor =
    select.value;

  if (valor !== "") {

    tareas.unshift(valor);

    document.getElementById("resultado")
      .textContent =
        `Último agregado: ${valor}`;

    select.value = "";

  }

  actualizarPantalla();

}

/**
 * Agrega un usuario al inicio del array
 */
function agregarUsuario() {

  const select =
    document.getElementById("selectUsuario");

  const valor =
    select.value;

  if (valor !== "") {

    usuarios.unshift(valor);

    document.getElementById("resultado")
      .textContent =
        `Último agregado: ${valor}`;

    select.value = "";

  }

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
 * Cambia el texto y estilo del botón
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