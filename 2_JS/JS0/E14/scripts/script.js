let letras = ["A", "B", "C", "D", "E"];
let numeros = [10, 20, 30, 40, 50];
let texto = "JavaScript";

function render(id, arr) {
  const div = document.getElementById(id);

  let html = "<ul class='lista'>";
  arr.forEach(e => html += `<li>${e}</li>`);
  html += "</ul>";

  div.innerHTML = html;
}

function actualizar() {
  render("letras", letras);
  render("numeros", numeros);
}

/* LETRAS */
document.getElementById("btnLet").addEventListener("click", (e) => {
  const res = [...letras].reverse();

  document.getElementById("resLet").textContent =
    `Invertido: ${res.join(" - ")}`;

  e.target.remove();
});

/* NUMEROS */
document.getElementById("btnNum").addEventListener("click", (e) => {
  const res = [...numeros].reverse();

  document.getElementById("resNum").textContent =
    `Invertido: ${res.join(" - ")}`;

  e.target.remove();
});

/* TEXTO */
document.getElementById("btnTxt").addEventListener("click", (e) => {
  const res = texto.split("").reverse().join("");

  document.getElementById("resTxt").textContent =
    `Invertido: ${res}`;

  e.target.remove();
});

actualizar();