let usuarios = ["usuario", "moderador", "admin", "editor"];
let colores = ["rojo", "azul", "amarillo", "verde"];
let numeros = [10, 20, 30, 40];

// Opciones extra para que los selects tengan valores que NO están en los arrays
let opcionesExtra = {
  usuarios: ["visitante", "root", "invitado"],
  colores: ["violeta", "naranja", "rosa"],
  numeros: [50, 100, 5]
};

function render(id, arr) {
  const div = document.getElementById(id);
  div.textContent = `${id}=[${arr.join(', ')}]`;
}

function poblarSelect(selectId, arrayOriginal, extras) {
  const select = document.getElementById(selectId);
  // Mezclamos los valores reales con los extras para probar el false de includes()
  let combinados = [...arrayOriginal, ...extras].sort(() => Math.random() - 0.5);

  combinados.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });
}

function verificarExistencia(element, array, valor) {
  // Convertimos a número si el array original contiene números
  const valorABuscar = typeof array[0] === 'number' ? Number(valor) : valor;
  
  const existe = array.includes(valorABuscar);

  if (existe) {
    element.textContent = `✔ '${valor}' existe en el array`;
    element.className = "resultado-verificacion existe";
  } else {
    element.textContent = `✖ '${valor}' no existe en el array`;
    element.className = "resultado-verificacion no-existe";
  }
}

function init() {
  render("usuarios", usuarios);
  render("colores", colores);
  render("numeros", numeros);

  poblarSelect("selectUsuarios", usuarios, opcionesExtra.usuarios);
  poblarSelect("selectColores", colores, opcionesExtra.colores);
  poblarSelect("selectNumeros", numeros, opcionesExtra.numeros);

  document.getElementById("selectUsuarios").addEventListener("change", (e) => {
    verificarExistencia(document.getElementById("resAdmin"), usuarios, e.target.value);
  });

  document.getElementById("selectColores").addEventListener("change", (e) => {
    verificarExistencia(document.getElementById("resColor"), colores, e.target.value);
  });

  document.getElementById("selectNumeros").addEventListener("change", (e) => {
    verificarExistencia(document.getElementById("resNumero"), numeros, e.target.value);
  });
}

init();