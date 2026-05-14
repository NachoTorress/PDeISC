// Definición de puerto por variable según preferencia
const APP_PORT = 3000; 

let numeros = [1, 2, 3, 4, 5];
let numeros2 = [2, 3, 4];
let productos = [
  { precio: 100 },
  { precio: 250 },
  { precio: 400 }
];

// Función para renderizar arrays en formato texto plano
function render(id, arr) {
  const div = document.getElementById(id);
  const contenido = arr.map(e => typeof e === "object" ? `Precio: ${e.precio}` : e).join(', ');
  div.textContent = `${id}=[${contenido}]`;
}

function actualizar() {
  render("suma", numeros);
  render("mult", numeros2);
  render("precios", productos);
}

/* SUMA */
document.getElementById("btnSuma").addEventListener("dblclick", (e) => {
  const res = numeros.reduce((acc, n) => acc + n, 0);
  document.getElementById("resSuma").textContent = `Suma total: ${res}`;
  e.target.remove();
});

/* MULTIPLICACION */
document.getElementById("btnMult").addEventListener("dblclick", (e) => {
  const res = numeros2.reduce((acc, n) => acc * n, 1);
  document.getElementById("resMult").textContent = `Producto total: ${res}`;
  e.target.remove();
});

/* OBJETOS */
document.getElementById("btnPrecios").addEventListener("dblclick", (e) => {
  const res = productos.reduce((acc, obj) => acc + obj.precio, 0);
  document.getElementById("resPrecios").textContent = `Total precios: ${res}`;
  e.target.remove();
});

actualizar();
console.log(`Aplicación inicializada en el puerto: ${APP_PORT}`);