let nombres = ["Ana", "Luis", "Carlos", "María"];
let numeros = [2, 4, 6, 8, 10];
let personas = [
  { nombre: "Nacho", edad: 20 },
  { nombre: "Valen", edad: 21 },
  { nombre: "Alexis", edad: 22 }
];

// Función que renderiza un array en formato de código plano
function render(id, arr) {
  const div = document.getElementById(id);
  // Para las personas (objetos), usamos stringify para que se vea el contenido
  const contenido = arr.map(e => typeof e === 'object' ? JSON.stringify(e) : e).join(', ');
  div.textContent = `${id}=[${contenido}]`;
}

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