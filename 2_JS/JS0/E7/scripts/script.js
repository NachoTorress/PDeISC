let animales = ["gato", "perro", "loro", "pez"];
let numeros = [10, 20, 50, 80, 100];
let ciudades = ["Buenos Aires", "Lima", "Madrid", "Bogotá"];

function render(id, arr) {
  const div = document.getElementById(id);
  div.textContent = `${id}=[${arr.join(', ')}]`;
}

// Función genérica para poblar selects con datos mezclados
function poblarSelect(selectId, arrayOriginal, label) {
  const select = document.getElementById(selectId);
  // Mezclamos una copia para no alterar el original
  let mezclado = [...arrayOriginal].sort(() => Math.random() - 0.5);

  mezclado.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = `${label}: ${item}`;
    select.appendChild(option);
  });
}

function mostrarResultado(element, mensaje, exito) {
  element.textContent = mensaje;
  if (exito) {
    element.classList.add("encontrado");
  } else {
    element.classList.remove("encontrado");
  }
}

// Configuración de eventos para cada select
function configurarEventos() {
  /* ANIMALES */
  document.getElementById("selectAnimales").addEventListener("change", (e) => {
    const valor = e.target.value;
    const pos = animales.indexOf(valor);
    mostrarResultado(document.getElementById("resPerro"), `"${valor}" está en el índice ${pos}`, true);
  });

  /* NUMEROS */
  document.getElementById("selectNumero").addEventListener("change", (e) => {
    const valor = Number(e.target.value);
    const pos = numeros.indexOf(valor);
    mostrarResultado(document.getElementById("resNumero"), `Número ${valor} encontrado en la posición ${pos}`, true);
  });

  /* CIUDADES */
  document.getElementById("selectCiudades").addEventListener("change", (e) => {
    const valor = e.target.value;
    const pos = ciudades.indexOf(valor);
    mostrarResultado(document.getElementById("resCiudad"), `"${valor}" se ubica en el índice ${pos}`, true);
  });
}

function init() {
  render("animales", animales);
  render("numeros", numeros);
  render("ciudades", ciudades);

  poblarSelect("selectAnimales", animales, "Animal");
  poblarSelect("selectNumero", numeros, "Valor");
  poblarSelect("selectCiudades", ciudades, "Ciudad");

  configurarEventos();
}

init();