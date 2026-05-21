// ========================================
// ARRAYS PRINCIPALES
// ========================================

let usuarios = ["usuario", "moderador", "admin", "editor"];

let colores = ["rojo", "azul", "amarillo", "verde"];

let numeros = [10, 20, 30, 40];


// ========================================
// OPCIONES EXTRA
// Sirven para probar casos false
// ========================================

let opcionesExtra = {

  usuarios: ["visitante", "root", "invitado"],

  colores: ["violeta", "naranja", "rosa"],

  numeros: [50, 100, 5]

};


// ========================================
// RENDERIZA UN ARRAY EN PANTALLA
// ========================================

function render(id, arr) {

  const div = document.getElementById(id);

  div.textContent = `${id}=[${arr.join(', ')}]`;

}


// ========================================
// LLENA LOS SELECTS CON OPCIONES
// ========================================

function poblarSelect(selectId, arrayOriginal, extras) {

  const select = document.getElementById(selectId);

  // Mezcla elementos reales con extras
  let combinados = [...arrayOriginal, ...extras]
    .sort(() => Math.random() - 0.5);

  combinados.forEach(item => {

    const option = document.createElement("option");

    option.value = item;

    option.textContent = item;

    select.appendChild(option);

  });

}


// ========================================
// VERIFICA SI UN ELEMENTO EXISTE
// EN UN ARRAY CON includes()
// ========================================

function verificarExistencia(element, array, valor) {

  // Convierte a número si el array contiene números
  const valorABuscar =
    typeof array[0] === 'number'
      ? Number(valor)
      : valor;

  const existe = array.includes(valorABuscar);

  // Caso verdadero
  if (existe) {

    element.textContent =
      `✔ '${valor}' existe en el array`;

    element.className =
      "resultado-verificacion existe";

  }

  // Caso falso
  else {

    element.textContent =
      `✖ '${valor}' no existe en el array`;

    element.className =
      "resultado-verificacion no-existe";

  }

}


// ========================================
// CONFIGURA LOS EVENTOS
// ========================================

function configurarEventos() {

  // =====================
  // USUARIOS
  // =====================

  document.getElementById("selectUsuarios")
    .addEventListener("change", (e) => {

      verificarExistencia(
        document.getElementById("resAdmin"),
        usuarios,
        e.target.value
      );

    });


  // =====================
  // COLORES
  // =====================

  document.getElementById("selectColores")
    .addEventListener("change", (e) => {

      verificarExistencia(
        document.getElementById("resColor"),
        colores,
        e.target.value
      );

    });


  // =====================
  // NÚMEROS
  // =====================

  document.getElementById("selectNumeros")
    .addEventListener("change", (e) => {

      verificarExistencia(
        document.getElementById("resNumero"),
        numeros,
        e.target.value
      );

    });

}


// ========================================
// BOTÓN DE TEMA
// ========================================

const themeToggle = document.getElementById("themeToggle");

const html = document.documentElement;


// ========================================
// ACTUALIZA EL BOTÓN SEGÚN EL TEMA
// ========================================

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


// ========================================
// CARGA EL TEMA GUARDADO
// ========================================

const savedTheme = localStorage.getItem("theme") || "light";

html.setAttribute("data-theme", savedTheme);

updateThemeButton(savedTheme);


// ========================================
// CAMBIO DE TEMA
// ========================================

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


// ========================================
// INICIALIZACIÓN GENERAL
// ========================================

function init() {

  render("usuarios", usuarios);

  render("colores", colores);

  render("numeros", numeros);

  poblarSelect(
    "selectUsuarios",
    usuarios,
    opcionesExtra.usuarios
  );

  poblarSelect(
    "selectColores",
    colores,
    opcionesExtra.colores
  );

  poblarSelect(
    "selectNumeros",
    numeros,
    opcionesExtra.numeros
  );

  configurarEventos();

}

init();