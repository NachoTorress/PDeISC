let numeros = [10, 20, 30, 40, 50];
let peliculas = [
  "Inception",
  "The Matrix",
  "Interstellar",
  "The Dark Knight",
  "Pulp Fiction"
];
let datos = [5, 15, 25, 35, 45, 55];

// Renderizado en formato array: nombre=[...]
function render(id, arr) {
  const div = document.getElementById(id);
  div.textContent = `${id}=[${arr.join(', ')}]`;
}

function init() {
  render("numeros", numeros);
  render("peliculas", peliculas);
  render("ultimos", datos);
}

/* DOBLE CLICK - NUMEROS */
document.getElementById("btnNumeros").addEventListener("dblclick", (e) => {
  const copia = numeros.slice(0, 3); // Copia los primeros 3
  
  document.getElementById("resNumeros").innerHTML = 
    `<div class="resultado-array">copia_numeros=[${copia.join(', ')}]</div>`;
  
  e.target.remove(); // Remueve el botón tras la acción
});

/* DOBLE CLICK - PELICULAS */
document.getElementById("btnPeliculas").addEventListener("dblclick", (e) => {
  const copia = peliculas.slice(2, 5); // Copia desde índice 2 hasta antes del 5
  
  document.getElementById("resPeliculas").innerHTML = 
    `<div class="resultado-array">copia_peliculas=[${copia.join(', ')}]</div>`;
  
  e.target.remove(); // Remueve el botón tras la acción
});

/* DOBLE CLICK - ULTIMOS */
document.getElementById("btnUltimos").addEventListener("dblclick", (e) => {
  const copia = datos.slice(-3); // Copia los últimos 3 usando índice negativo
  
  document.getElementById("resUltimos").innerHTML = 
    `<div class="resultado-array">copia_datos=[${copia.join(', ')}]</div>`;
  
  e.target.remove(); // Remueve el botón tras la acción
});

init();