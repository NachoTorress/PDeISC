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

// Función que renderiza un array en formato de texto plano
function render(id, arr) {
  const div = document.getElementById(id);
  const contenido = arr.map(e => typeof e === "object" ? JSON.stringify(e) : e).join(', ');
  div.textContent = `${id}=[${contenido}]`;
}

function actualizar() {
  render("numeros", numeros);
  render("palabras", palabras);
  render("usuarios", usuarios);
}

/* NUMEROS */
document.getElementById("btnNum").addEventListener("click", (e) => {
  const res = numeros.filter(n => n > 10); //

  document.getElementById("resNum").textContent =
    `Resultado: ${res.join(" - ")}`;

  e.target.remove(); //
});

/* PALABRAS */
document.getElementById("btnPal").addEventListener("click", (e) => {
  const res = palabras.filter(p => p.length > 5); //

  document.getElementById("resPal").textContent =
    `Resultado: ${res.join(" - ")}`;

  e.target.remove(); //
});

/* USUARIOS */
document.getElementById("btnUsu").addEventListener("click", (e) => {
  const res = usuarios
    .filter(u => u.activo) //
    .map(u => u.nombre);

  document.getElementById("resUsu").textContent =
    `Activos: ${res.join(" - ")}`;

  e.target.remove(); //
});

actualizar();