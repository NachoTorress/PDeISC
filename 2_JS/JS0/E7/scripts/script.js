let animales = ["gato", "perro", "loro", "pez"];
let numeros = [10, 20, 50, 80, 100];
let ciudades = ["Buenos Aires", "Lima", "Madrid", "Bogotá"];

function render(id, arr) {
  const div = document.getElementById(id);

  let html = "<ul class='lista'>";
  arr.forEach(e => html += `<li>${e}</li>`);
  html += "</ul>";

  div.innerHTML = html;
}

function actualizar() {
  render("animales", animales);
  render("numeros", numeros);
  render("ciudades", ciudades);
}

/* PERRO */
document.getElementById("inputPerro").addEventListener("input", (e) => {
  const valor = e.target.value.toLowerCase();
  const pos = animales.indexOf(valor);

  const res = document.getElementById("resPerro");

  if (pos !== -1) {
    res.textContent = `"${valor}" encontrado en posición ${pos}`;
  } else {
    res.textContent = `"${valor}" no encontrado`;
  }
});

/* NUMEROS */
document.getElementById("inputNumero").addEventListener("input", (e) => {
  const valor = Number(e.target.value);
  const pos = numeros.indexOf(valor);

  const res = document.getElementById("resNumero");

  if (pos !== -1) {
    res.textContent = `50 encontrado en posición ${pos}`;
  } else {
    res.textContent = `50 no está en el array`;
  }
});

/* CIUDADES */
document.getElementById("inputCiudad").addEventListener("input", (e) => {
  const valor = e.target.value;
  const pos = ciudades.indexOf(valor);

  const res = document.getElementById("resCiudad");

  if (pos !== -1) {
    res.textContent = `"${valor}" está en posición ${pos}`;
  } else {
    res.textContent = `"${valor}" no está en el array`;
  }
});

actualizar();