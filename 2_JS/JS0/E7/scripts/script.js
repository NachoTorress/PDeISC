// ========================================
// ARRAYS PRINCIPALES
// ========================================

let animales = ["gato", "perro", "loro", "pez"];

let numeros = [10, 20, 50, 80, 100];

let ciudades = ["Buenos Aires", "Lima", "Madrid", "Bogotá"];


// ========================================
// RENDERIZA UN ARRAY EN PANTALLA
// ========================================

function render(id, arr) {

  const div = document.getElementById(id);

  div.textContent = `${id}=[${arr.join(', ')}]`;

}


// ========================================
// LLENA UN SELECT CON OPCIONES
// ========================================

function poblarSelect(selectId, arrayOriginal, label) {

  const select = document.getElementById(selectId);

  // Mezcla una copia para no alterar el array original
  let mezclado = [...arrayOriginal]
    .sort(() => Math.random() - 0.5);

  mezclado.forEach(item => {

    const option = document.createElement("option");

    option.value = item;

    option.textContent = `${label}: ${item}`;

    select.appendChild(option);

  });

}


// ========================================
// MUESTRA RESULTADOS DE BÚSQUEDA
// ========================================

function mostrarResultado(element, mensaje, exito) {

  element.textContent = mensaje;

  if (exito) {

    element.classList.add("encontrado");

  } else {

    element.classList.remove("encontrado");

  }

}


// ========================================
// CONFIGURA LOS EVENTOS DE LOS SELECTS
// ========================================

function configurarEventos() {

  // =====================
  // ANIMALES
  // =====================

  document.getElementById("selectAnimales")
    .addEventListener("change", (e) => {

      const valor = e.target.value;

      const pos = animales.indexOf(valor);

      mostrarResultado(
        document.getElementById("resPerro"),
        `"${valor}" está en el índice ${pos}`,
        true
      );

    });


  // =====================
  // NÚMEROS
  // =====================

  document.getElementById("selectNumero")
    .addEventListener("change", (e) => {

      const valor = Number(e.target.value);

      const pos = numeros.indexOf(valor);

      mostrarResultado(
        document.getElementById("resNumero"),
        `Número ${valor} encontrado en la posición ${pos}`,
        true
      );

    });


  // =====================
  // CIUDADES
  // =====================

  document.getElementById("selectCiudades")
    .addEventListener("change", (e) => {

      const valor = e.target.value;

      const pos = ciudades.indexOf(valor);

      mostrarResultado(
        document.getElementById("resCiudad"),
        `"${valor}" se ubica en el índice ${pos}`,
        true
      );

    });

}


// ========================================
// CAMBIA EL TEXTO DEL BOTÓN DE TEMA
// ========================================

const themeToggle = document.getElementById("themeToggle");

const html = document.documentElement;

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

  render("animales", animales);

  render("numeros", numeros);

  render("ciudades", ciudades);

  poblarSelect("selectAnimales", animales, "Animal");

  poblarSelect("selectNumero", numeros, "Valor");

  poblarSelect("selectCiudades", ciudades, "Ciudad");

  configurarEventos();

}

init();