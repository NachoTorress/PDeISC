// =========================
// DATOS
// =========================

let letras = ["A", "B", "C", "D", "E"];

let numeros = [10, 20, 30, 40, 50];

let texto = "JavaScript";

// =========================
// RENDER
// =========================

function render(id, arr) {

  const div = document.getElementById(id);

  div.textContent =
    `${id}=[${arr.join(", ")}]`;

}

function actualizar() {

  render("letras", letras);

  render("numeros", numeros);

}

// =========================
// LETRAS
// =========================

document
  .getElementById("btnLet")
  .addEventListener("click", () => {

    const res = [...letras].reverse();

    document.getElementById("resLet").textContent =
      `letras_invertidas=[${res.join(", ")}]`;

    document
      .getElementById("wrapperLet")
      .remove();

  });

// =========================
// NUMEROS
// =========================

document
  .getElementById("btnNum")
  .addEventListener("click", () => {

    const res = [...numeros].reverse();

    document.getElementById("resNum").textContent =
      `numeros_invertidos=[${res.join(", ")}]`;

    document
      .getElementById("wrapperNum")
      .remove();

  });

// =========================
// TEXTO
// =========================

document
  .getElementById("btnTxt")
  .addEventListener("click", () => {

    const res =
      texto
        .split("")
        .reverse()
        .join("");

    document.getElementById("resTxt").textContent =
      `texto_invertido=[${res}]`;

    document
      .getElementById("wrapperTxt")
      .remove();

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