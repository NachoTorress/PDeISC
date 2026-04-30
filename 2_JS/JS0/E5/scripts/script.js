let letras = ["A", "B", "C", "D", "E"];
let nombres = ["Ana", "Luis", "Carlos", "María", "Sofía"];
let cosas = ["Display", "Teclado", "Mouse", "Parlantes"];

function render(id, arr) {
  const div = document.getElementById(id);

  let html = "<ul class='lista'>";
  arr.forEach(e => html += `<li>${e}</li>`);
  html += "</ul>";

  div.innerHTML = html;
}

function actualizar() {
  render("letras", letras);
  render("nombres", nombres);
  render("cosas", cosas);
}

/* LETRAS */
document.getElementById("btnLetras").addEventListener("click", (e) => {
  letras.splice(1, 2);

  document.getElementById("resultado").textContent =
    "Se eliminaron elementos de letras";

  e.target.remove();
  actualizar();
});

/* NOMBRES */
document.getElementById("btnNombres").addEventListener("click", (e) => {
  nombres.splice(2, 0, "Nacho");

  document.getElementById("resultado").textContent =
    "Se insertó Nacho en nombres";

  e.target.remove();
  actualizar();
});

/* COSAS (DINÁMICO) */
document.getElementById("btnCosas").addEventListener("click", (e) => {
  const pos = parseInt(document.getElementById("pos").value);
  const n1 = document.getElementById("n1").value;
  const n2 = document.getElementById("n2").value;

  if (!isNaN(pos)) {
    cosas.splice(pos, 2, n1, n2);

    document.getElementById("resultado").textContent =
      `Se reemplazó desde posición ${pos}`;
  }

  e.target.remove();
  actualizar();
});

actualizar();