

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
  const contenido = arr.map(e => typeof e === "object" ? `${e.nombre}(${e.edad})` : e).join(', ');
  div.textContent = `${id} = [${contenido}]`;
}

function actualizar() {
  render("numeros", numeros);
  render("palabras", palabras);
  render("personas", personas);
}

/* NUMEROS */
document.getElementById("selNum").addEventListener("change", (e) => {
  if (!e.target.value) return;
  
  const sorted = [...numeros].sort((a, b) => a - b);
  document.getElementById("resNum").textContent = `✔ Resultado Final: ${sorted.join(" < ")}`;

  // Eliminamos el label y el select asociados
  document.getElementById("wrapperNum").remove();
});

/* PALABRAS */
document.getElementById("selPal").addEventListener("change", (e) => {
  if (!e.target.value) return;

  const sorted = [...palabras].sort();
  document.getElementById("resPal").textContent = `✔ Resultado Final: ${sorted.join(", ")}`;

  document.getElementById("wrapperPal").remove();
});

/* PERSONAS */
document.getElementById("selPer").addEventListener("change", (e) => {
  if (!e.target.value) return;

  const sorted = [...personas].sort((a, b) => a.edad - b.edad);
  document.getElementById("resPer").textContent = 
    `✔ Resultado Final: ` + sorted.map(p => `${p.nombre} (${p.edad})`).join(" - ");

  document.getElementById("wrapperPer").remove();
});

actualizar();
