// Código JavaScript para manejar la lógica de la página
let colores = [];
let tareas = [
  "Lavar los platos",
  "Hacer la cama",
  "Sacar la basura"
];

let usuarios = ["Cheski", "Tizi", "Valen"];

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

// Función que controla la visibilidad de elementos en la página
function controlarOpciones() {
  if (colores.length >= 3) {
    document.getElementById("selectColor").style.display = "none";
  }

  if (tareas[0] === "Tarea urgente para mañana") {
    document.getElementById("selectTarea").style.display = "none";
  }

  if (usuarios[0] === "Alexis") {
    document.getElementById("selectUsuario").style.display = "none";
  }
}

// Función que actualiza todas las listas en pantalla
function actualizarPantalla() {
  renderLista("colores", colores);
  renderLista("tareas", tareas);
  renderLista("usuarios", usuarios);
  controlarOpciones();
}

// Función para agregar elementos al inicio del array usando unshift()
function agregarColor() {
  const select = document.getElementById("selectColor");
  const valor = select.value;

  if (valor !== "") {
    colores.unshift(valor);

    document.getElementById("resultado").textContent =
      `Último agregado: ${valor}`;

    select.value = "";
  }

  actualizarPantalla();
}

// Función para agregar elementos al inicio del array usando unshift()
function agregarTarea() {
  const select = document.getElementById("selectTarea");
  const valor = select.value;

  if (valor !== "") {
    tareas.unshift(valor);

    document.getElementById("resultado").textContent =
      `Último agregado: ${valor}`;

    select.value = "";
  }

  actualizarPantalla();
}

// Función para agregar elementos al inicio del array usando unshift()
function agregarUsuario() {
  const select = document.getElementById("selectUsuario");
  const valor = select.value;

  if (valor !== "") {
    usuarios.unshift(valor);

    document.getElementById("resultado").textContent =
      `Último agregado: ${valor}`;

    select.value = "";
  }

  actualizarPantalla();
}

actualizarPantalla();