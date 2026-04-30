let numeros = [3, 8, 12, 15, 7, 20, 5, 30];

let palabras = [
  "casa",
  "computadora",
  "perro",
  "ventana",
  "sol",
  "javascript"
];

let usuarios = [
  { nombre: "Nacho", activo: true },
  { nombre: "Valen", activo: false },
  { nombre: "Alexis", activo: true },
  { nombre: "Tizi", activo: false }
];

function render(id, arr) {
  const div = document.getElementById(id);

  let html = "<ul class='lista'>";
  arr.forEach(e => {
    html += `<li>${typeof e === "object" ? JSON.stringify(e) : e}</li>`;
  });
  html += "</ul>";

  div.innerHTML = html;
}

function actualizar() {
  render("numeros", numeros);
  render("palabras", palabras);
  render("usuarios", usuarios);
}

/* NUMEROS */
document.getElementById("btnNum").addEventListener("click", (e) => {
  const res = numeros.filter(n => n > 10);

  document.getElementById("resNum").textContent =
    `Resultado: ${res.join(" - ")}`;

  e.target.remove();
});

/* PALABRAS */
document.getElementById("btnPal").addEventListener("click", (e) => {
  const res = palabras.filter(p => p.length > 5);

  document.getElementById("resPal").textContent =
    `Resultado: ${res.join(" - ")}`;

  e.target.remove();
});

/* USUARIOS */
document.getElementById("btnUsu").addEventListener("click", (e) => {
  const res = usuarios
    .filter(u => u.activo)
    .map(u => u.nombre);

  document.getElementById("resUsu").textContent =
    `Activos: ${res.join(" - ")}`;

  e.target.remove();
});

actualizar();