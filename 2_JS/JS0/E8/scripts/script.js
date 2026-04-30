let usuarios = ["usuario", "moderador", "admin", "editor"];
let colores = ["rojo", "azul", "amarillo", "verde"];
let numeros = [10, 20, 30, 40];

function render(id, arr) {
  const div = document.getElementById(id);

  let html = "<ul class='lista'>";
  arr.forEach(e => html += `<li>${e}</li>`);
  html += "</ul>";

  div.innerHTML = html;
}

function actualizar() {
  render("usuarios", usuarios);
  render("colores", colores);
  render("numeros", numeros);
}

/* ADMIN */
document.getElementById("btnAdmin").addEventListener("click", (e) => {
  const res = document.getElementById("resAdmin");

  res.textContent = usuarios.includes("admin")
    ? "✔ 'admin' existe"
    : "✖ 'admin' no existe";

  e.target.remove();
});

/* COLORES */
document.getElementById("btnColor").addEventListener("click", (e) => {
  const res = document.getElementById("resColor");

  res.textContent = colores.includes("verde")
    ? "✔ 'verde' existe"
    : "✖ 'verde' no existe";

  e.target.remove();
});

/* NUMEROS */
document.getElementById("btnNumero").addEventListener("click", (e) => {
  const res = document.getElementById("resNumero");

  res.textContent = numeros.includes(50)
    ? "✔ 50 existe"
    : "✖ 50 no existe";

  e.target.remove();
});

actualizar();