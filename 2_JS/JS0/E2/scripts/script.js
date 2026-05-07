// Código JavaScript para manejar la lógica de la página
// Arrays para almacenar los datos de animales, compras y números
let animales = ["Perro", "Gato", "Pez", "Tigre", "León"];
let compras = ["Harina", "Arroz", "Aceite", "Galletitas", "Papel Higiénico"];
let numeros = [2, 4, 6, 8, 10];

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

// Función que controla la visibilidad de los botones según si hay elementos
// Función que controla la visibilidad de elementos en la página
function controlarBotones() {
  document.getElementById("btnAnimal").style.display =
    animales.length === 0 ? "none" : "block";

  document.getElementById("btnCompra").style.display =
    compras.length === 0 ? "none" : "block";

  document.getElementById("btnNumero").style.display =
    numeros.length === 0 ? "none" : "block";
}

// Función que actualiza todas las listas en la pantalla
// Función que actualiza todas las listas en pantalla
function actualizarPantalla() {
  renderLista("animales", animales);
  renderLista("compras", compras);
  renderLista("numeros", numeros);
  controlarBotones();
}

// Función que elimina el último animal de la lista usando pop()
// Función para eliminar elementos del array usando pop()
function eliminarAnimal() {
  if (animales.length > 0) {
    let eliminado = animales.pop(); // Método pop() elimina el último elemento

    document.getElementById("resultado").textContent =
      `Elemento eliminado: ${eliminado}`;
  }

  actualizarPantalla();
}

// Función que elimina el último producto de la compra usando pop()
// Función para eliminar elementos del array usando pop()
function eliminarProducto() {
  if (compras.length > 0) {
    let eliminado = compras.pop(); // Método pop() elimina el último elemento

    document.getElementById("resultado").textContent =
      `Elemento eliminado: ${eliminado}`;
  }

  actualizarPantalla();
}

// Función que vacía el array de números usando pop() en un bucle
// Función que realiza una acción de la interfaz
function vaciarNumeros() {
  let eliminados = [];

  // Eliminar todos los números usando pop()
  while (numeros.length > 0) {
    eliminados.push(numeros.pop());
  }

  document.getElementById("resultado").textContent =
    `Se eliminaron: ${eliminados.join(", ")}`;

  actualizarPantalla();
}

/* Función para detectar doble toque en móviles
   En móviles el doble click suele fallar.
   Se reemplaza por doble toque usando dos clicks rápidos. */

let ultimoToque = 0;

// Función que ejecuta una acción solo si hay dos clicks en menos de 500ms
// Función que realiza una acción de la interfaz
function dobleToque(funcion) {
  let tiempoActual = new Date().getTime();
  let diferencia = tiempoActual - ultimoToque;

  // Si la diferencia es menor a 500ms, es un doble toque
  if (diferencia < 500 && diferencia > 0) {
    funcion();
  }

  ultimoToque = tiempoActual;
}

// Event listeners que detectan doble toque en los botones
document.getElementById("btnAnimal").addEventListener("click", () => {
  dobleToque(eliminarAnimal);
});

document.getElementById("btnCompra").addEventListener("click", () => {
  dobleToque(eliminarProducto);
});

document.getElementById("btnNumero").addEventListener("click", () => {
  dobleToque(vaciarNumeros);
});

// Mostrar las listas al cargar la página
actualizarPantalla();