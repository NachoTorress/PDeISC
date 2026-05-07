// Código JavaScript para manejar la lógica de la página
// Arrays para almacenar los datos de frutas, amigos y números
let frutas = [];
let amigos = [];
let numeros = [3, 5, 7];

// Función que convierte un array en HTML y lo muestra en la página
// Función que renderiza un array en la página HTML
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

// Función que actualiza todas las listas en la pantalla
// Función que actualiza todas las listas en pantalla
function actualizarPantalla() {
  renderLista("frutas", frutas);
  renderLista("amigos", amigos);
  renderLista("numeros", numeros);
}

// Función que agrega una fruta aleatoria a la lista de frutas
// Función para agregar elementos al inicio del array usando unshift()
function agregarFruta() {
  const lista = ["Banana", "Mandarina", "Naranja", "Manzana", "Pera"];
  const fruta = lista[Math.floor(Math.random() * lista.length)];

  frutas.push(fruta); // Agregar fruta a la lista
  actualizarPantalla();
}

// Función que agrega un amigo aleatorio a la lista de amigos
// Función para agregar elementos al inicio del array usando unshift()
function agregarAmigo() {
  const lista = ["Tizi", "Valen", "Alexis", "Juan", "Pedro"];
  const amigo = lista[Math.floor(Math.random() * lista.length)];

  amigos.push(amigo); // Agregar amigo a la lista
  actualizarPantalla();
}

// Función que genera un número aleatorio y lo agrega solo si es mayor que el último
// Función para agregar elementos al inicio del array usando unshift()
function agregarNumero() {
  let num = Math.floor(Math.random() * 10) + 1;
  let ultimo = numeros[numeros.length - 1];

  // Mostrar el número generado en pantalla
  document.getElementById("resultadoNumero").textContent =
    `Número generado: ${num}`;

  // Solo agregar si el número es mayor que el último
  if (num > ultimo) {
    numeros.push(num);
  }

  actualizarPantalla();
}

// Mostrar las listas al cargar la página
actualizarPantalla();