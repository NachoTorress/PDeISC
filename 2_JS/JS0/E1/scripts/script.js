let frutas = [];
let amigos = [];
let numeros = [3, 5, 7];

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

function actualizarPantalla() {
  renderLista("frutas", frutas);
  renderLista("amigos", amigos);
  renderLista("numeros", numeros);
}

function agregarFruta() {
  const lista = ["Banana", "Mandarina", "Naranja", "Manzana", "Pera"];
  const fruta = lista[Math.floor(Math.random() * lista.length)];

  frutas.push(fruta);
  actualizarPantalla();
}

function agregarAmigo() {
  const lista = ["Tizi", "Valen", "Alexis", "Juan", "Pedro"];
  const amigo = lista[Math.floor(Math.random() * lista.length)];

  amigos.push(amigo);
  actualizarPantalla();
}

function agregarNumero() {
  let num = Math.floor(Math.random() * 10) + 1;
  let ultimo = numeros[numeros.length - 1];

  document.getElementById("resultadoNumero").textContent =
    `Número generado: ${num}`;

  if (num > ultimo) {
    numeros.push(num);
  }

  actualizarPantalla();
}

actualizarPantalla();