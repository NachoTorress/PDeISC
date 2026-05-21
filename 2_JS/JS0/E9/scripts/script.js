// =========================
// ARRAYS
// =========================

// Array de nombres
let nombres = ["Ana", "Luis", "Carlos", "María"];

// Array de números
let numeros = [2, 4, 6, 8, 10];

// Array de objetos
let personas = [
  { nombre: "Nacho", edad: 20 },
  { nombre: "Valen", edad: 21 },
  { nombre: "Alexis", edad: 22 }
];

// =========================
// RENDERIZADO
// =========================

// Muestra un array en pantalla
function render(id, arr) {

  const div = document.getElementById(id);

  // Si el elemento es un objeto, se convierte a texto JSON
  const contenido = arr
    .map(e =>
      typeof e === "object"
        ? JSON.stringify(e)
        : e
    )
    .join(", ");

  div.textContent = `${id}=[${contenido}]`;

}

// Actualiza todos los arrays en pantalla
function actualizar() {

  render("nombres", nombres);
  render("numeros", numeros);
  render("personas", personas);

}

// =========================
// EVENTO - NOMBRES
// =========================

// Recorre el array y genera saludos
document
  .getElementById("btnNombres")
  .addEventListener("dblclick", (e) => {

    let res = "";

    nombres.forEach(nombre => {

      res += `Hola, ${nombre}\n`;

    });

    document.getElementById("resNombres").textContent = res;

    // Elimina el botón luego de usarlo
    e.target.remove();

  });

// =========================
// EVENTO - NUMEROS
// =========================

// Recorre el array mostrando cada número duplicado
document
  .getElementById("btnNumeros")
  .addEventListener("dblclick", (e) => {

    let res = "";

    numeros.forEach(numero => {

      res += `${numero} -> ${numero * 2}\n`;

    });

    document.getElementById("resNumeros").textContent = res;

    // Elimina el botón luego de usarlo
    e.target.remove();

  });

// =========================
// EVENTO - PERSONAS
// =========================

// Recorre el array de objetos mostrando nombre y edad
document
  .getElementById("btnPersonas")
  .addEventListener("dblclick", (e) => {

    let res = "";

    personas.forEach(persona => {

      res += `${persona.nombre} tiene ${persona.edad} años\n`;

    });

    document.getElementById("resPersonas").textContent = res;

    // Elimina el botón luego de usarlo
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

// Carga el tema guardado
const savedTheme = localStorage.getItem("theme") || "light";

html.setAttribute("data-theme", savedTheme);

updateThemeButton(savedTheme);

// Cambia entre modo claro y oscuro
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

// =========================
// INICIO
// =========================

// Renderiza los arrays al cargar
actualizar();