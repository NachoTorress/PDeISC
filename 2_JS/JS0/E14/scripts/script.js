
let letras = ["A", "B", "C", "D", "E"];
let numeros = [10, 20, 30, 40, 50];
let texto = "JavaScript";

function render(id, arr) {
  const div = document.getElementById(id);
  div.textContent = `${id} = [${arr.join(', ')}]`;
}

function actualizar() {
  render("letras", letras);
  render("numeros", numeros);
}

/* LETRAS */
document.getElementById("btnLet").addEventListener("click", (e) => {
  // Usamos spread para no mutar el original en la vista previa
  const res = [...letras].reverse();

  document.getElementById("resLet").textContent = `✔ Invertido: ${res.join(" - ")}`;

  // Quitamos el contenedor del botón y su label
  document.getElementById("wrapperLet").remove();
});

/* NUMEROS */
document.getElementById("btnNum").addEventListener("click", (e) => {
  const res = [...numeros].reverse();

  document.getElementById("resNum").textContent = `✔ Invertido: ${res.join(" - ")}`;

  document.getElementById("wrapperNum").remove();
});

/* TEXTO */
document.getElementById("btnTxt").addEventListener("click", (e) => {
  // Proceso para invertir un string
  const res = texto.split("").reverse().join("");

  document.getElementById("resTxt").textContent = `✔ Invertido: ${res}`;

  document.getElementById("wrapperTxt").remove();
});

actualizar();
