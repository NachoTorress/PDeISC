// Código JavaScript para manejar la lógica de la página
let nombres = ["Ana", "Luis", "Carlos", "María"];
let numeros = [2, 4, 6, 8, 10];
let personas = [
  { nombre: "Nacho", edad: 20 },
  { nombre: "Valen", edad: 21 },
  { nombre: "Alexis", edad: 22 }
];

// Función que renderiza un array en la página HTML
function render(id, arr) {
  const div = document.getElementById(id);

  let html = "<ul class='lista'>";
  arr.forEach(e => html += `<li>${JSON.stringify(e)}</li>`);
  html += "</ul>";

  div.innerHTML = html;
}

// Función que actualiza todas las listas en pantalla
function actualizar() {
  render("nombres", nombres);
  render("numeros", numeros);
  render("personas", personas);
}

/* NOMBRES */
document.getElementById("btnNombres").addEventListener("dblclick", (e) => {
  let res = "";

  nombres.forEach(n => {
    res += `Hola, ${n}\n`;
  });

  document.getElementById("resNombres").textContent = res;

  e.target.remove();
});

/* NUMEROS */
document.getElementById("btnNumeros").addEventListener("dblclick", (e) => {
  let res = "";

  numeros.forEach(n => {
    res += `${n} -> ${n * 2}\n`;
  });

  document.getElementById("resNumeros").textContent = res;

  e.target.remove();
});

/* PERSONAS */
document.getElementById("btnPersonas").addEventListener("dblclick", (e) => {
  let res = "";

  personas.forEach(p => {
    res += `${p.nombre} tiene ${p.edad} años\n`;
  });

  document.getElementById("resPersonas").textContent = res;

  e.target.remove();
});

actualizar();