let enteros = [1, 2, 3, 4, 5];
let mensajes = ["Hola", "¿Cómo estás?", "Adiós"];
let cola = ["Primero", "Segundo", "Tercero"];

function renderLista(id, array) {
  const contenedor = document.getElementById(id);
  // Formato: nombre_array=[elemento1, elemento2]
  contenedor.textContent = `${id}=[${array.join(', ')}]`;
}

function controlarInputs() {
  if (enteros.length === 0) {
    document.getElementById("rangoEnteros").style.display = "none";
    document.getElementById("textoEnteros").style.display = "none";
  }
  if (mensajes.length === 0) {
    document.getElementById("rangoMensajes").style.display = "none";
    document.getElementById("textoMensajes").style.display = "none";
  }
  if (cola.length === 0) {
    document.getElementById("rangoCola").style.display = "none";
    document.getElementById("textoCola").style.display = "none";
  }
}

function actualizarPantalla() {
  renderLista("enteros", enteros);
  renderLista("mensajes", mensajes);
  renderLista("cola", cola);
  controlarInputs();
}

function resetRange(id) {
  document.getElementById(id).value = 0;
}

function eliminarEntero() {
  if (enteros.length > 0) {
    const eliminado = enteros.shift(); // Elimina el primero
    document.getElementById("resultado").textContent = `Elemento eliminado: ${eliminado}`;
  }
  resetRange("rangoEnteros");
  actualizarPantalla();
}

function eliminarMensaje() {
  if (mensajes.length > 0) {
    const eliminado = mensajes.shift(); // Elimina el primero
    document.getElementById("resultado").textContent = `Elemento eliminado: ${eliminado}`;
  }
  resetRange("rangoMensajes");
  actualizarPantalla();
}

function atenderCliente() {
  if (cola.length > 0) {
    const eliminado = cola.shift(); // Elimina el primero
    document.getElementById("resultado").textContent = `Cliente atendido: ${eliminado}`;
  }
  resetRange("rangoCola");
  actualizarPantalla();
}

actualizarPantalla();