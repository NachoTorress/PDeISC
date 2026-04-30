let animales = ["Perro", "Gato", "Pez", "Tigre", "León"];
let compras = ["Harina", "Arroz", "Aceite", "Galletitas", "Papel Higiénico"];
let numeros = [2, 4, 6, 8, 10];

function renderLista(id, array) {
  const contenedor = document.getElementById(id);

  if (array.length === 0) {
    contenedor.innerHTML = "<p class='vacio'>Lista vacía</p>";
    return;
  }

  let html = "<ul class='lista'>";

  array.forEach(elemento => {
    html += `<li>${elemento}</li>`;
  });

  html += "</ul>";

  contenedor.innerHTML = html;
}

function controlarBotones() {
  document.getElementById("btnAnimal").style.display =
    animales.length === 0 ? "none" : "block";

  document.getElementById("btnCompra").style.display =
    compras.length === 0 ? "none" : "block";

  document.getElementById("btnNumero").style.display =
    numeros.length === 0 ? "none" : "block";
}

function actualizarPantalla() {
  renderLista("animales", animales);
  renderLista("compras", compras);
  renderLista("numeros", numeros);
  controlarBotones();
}

function eliminarAnimal() {
  if (animales.length > 0) {
    let eliminado = animales.pop();

    document.getElementById("resultado").textContent =
      `Elemento eliminado: ${eliminado}`;
  }

  actualizarPantalla();
}

function eliminarProducto() {
  if (compras.length > 0) {
    let eliminado = compras.pop();

    document.getElementById("resultado").textContent =
      `Elemento eliminado: ${eliminado}`;
  }

  actualizarPantalla();
}

function vaciarNumeros() {
  let eliminados = [];

  while (numeros.length > 0) {
    eliminados.push(numeros.pop());
  }

  document.getElementById("resultado").textContent =
    `Se eliminaron: ${eliminados.join(", ")}`;

  actualizarPantalla();
}

/*
En móviles el doble click suele fallar.
Se reemplaza por doble toque usando dos clicks rápidos.
*/

let ultimoToque = 0;

function dobleToque(funcion) {
  let tiempoActual = new Date().getTime();
  let diferencia = tiempoActual - ultimoToque;

  if (diferencia < 500 && diferencia > 0) {
    funcion();
  }

  ultimoToque = tiempoActual;
}

document.getElementById("btnAnimal").addEventListener("click", () => {
  dobleToque(eliminarAnimal);
});

document.getElementById("btnCompra").addEventListener("click", () => {
  dobleToque(eliminarProducto);
});

document.getElementById("btnNumero").addEventListener("click", () => {
  dobleToque(vaciarNumeros);
});

actualizarPantalla();