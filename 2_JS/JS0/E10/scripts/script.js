let numeros = [1, 2, 3, 4, 5];
let nombres = ["ana", "luis", "carlos", "maria"];
let precios = [100, 250, 500, 1000];

function render(id, arr) {
  const div = document.getElementById(id);

  let html = "<ul class='lista'>";
  arr.forEach(e => html += `<li>${e}</li>`);
  html += "</ul>";

  div.innerHTML = html;
}

function actualizar() {
  render("numeros", numeros);
  render("nombres", nombres);
  render("precios", precios);
}

/* NUMEROS */
document.getElementById("rangeNum").addEventListener("input", (e) => {
  const res = numeros.map(n => n * 3);

  document.getElementById("resNumero").textContent =
    `Resultado: ${res.join(" - ")}`;

  document.getElementById("txtNum").remove();
  e.target.remove();
});

/* NOMBRES */
document.getElementById("rangeNombre").addEventListener("input", (e) => {
  const res = nombres.map(n => n.toUpperCase());

  document.getElementById("resNombre").textContent =
    `Resultado: ${res.join(" - ")}`;

  document.getElementById("txtNom").remove();
  e.target.remove();
});

/* PRECIOS */
document.getElementById("rangePrecio").addEventListener("input", (e) => {
  const res = precios.map(p => (p * 1.21).toFixed(2));

  document.getElementById("resPrecio").textContent =
    `Resultado: ${res.join(" - ")}`;

  document.getElementById("txtPre").remove();
  e.target.remove();
});

actualizar();