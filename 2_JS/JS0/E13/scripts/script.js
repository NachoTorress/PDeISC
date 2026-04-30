let numeros = [25, 8, 42, 3, 17, 10];
let palabras = ["banana", "manzana", "pera", "uva", "naranja"];

let personas = [
  { nombre: "Nacho", edad: 20 },
  { nombre: "Valen", edad: 18 },
  { nombre: "Alexis", edad: 22 },
  { nombre: "Tizi", edad: 19 }
];

function render(id, arr) {
  const div = document.getElementById(id);

  let html = "<ul class='lista'>";
  arr.forEach(e => {
    if (typeof e === "object") {
      html += `<li>${e.nombre} - ${e.edad}</li>`;
    } else {
      html += `<li>${e}</li>`;
    }
  });
  html += "</ul>";

  div.innerHTML = html;
}

function actualizar() {
  render("numeros", numeros);
  render("palabras", palabras);
  render("personas", personas);
}

/* NUMEROS */
document.getElementById("selNum").addEventListener("change", (e) => {
  const sorted = [...numeros].sort((a, b) => a - b);

  document.getElementById("resNum").textContent =
    `Ordenados: ${sorted.join(" - ")}`;
});

/* PALABRAS */
document.getElementById("selPal").addEventListener("change", (e) => {
  const sorted = [...palabras].sort();

  document.getElementById("resPal").textContent =
    `Ordenadas: ${sorted.join(" - ")}`;
});

/* PERSONAS */
document.getElementById("selPer").addEventListener("change", (e) => {
  const sorted = [...personas].sort((a, b) => a.edad - b.edad);

  document.getElementById("resPer").textContent =
    sorted.map(p => `${p.nombre} (${p.edad})`).join(" - ");
});

actualizar();