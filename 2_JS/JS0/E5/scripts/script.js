let letras = ["A", "B", "C", "D", "E"];
let nombres = ["Ana", "Luis", "Carlos", "María", "Sofía"];
let cosas = ["Display", "Teclado", "Mouse", "Parlantes"];

// Renderizado en formato array: nombre=[...]
function render(id, arr) {
  const div = document.getElementById(id);
  div.textContent = `${id}=[${arr.join(', ')}]`;
}

function actualizar() {
  render("letras", letras);
  render("nombres", nombres);
  render("cosas", cosas);
}

/* LETRAS */
document.getElementById("btnLetras").addEventListener("click", (e) => {
  letras.splice(1, 2); 
  document.getElementById("resultado").textContent = "Se eliminaron elementos de letras";
  e.target.remove(); 
  actualizar();
});

/* NOMBRES */
document.getElementById("btnNombres").addEventListener("click", (e) => {
  nombres.splice(2, 0, "Nacho"); 
  document.getElementById("resultado").textContent = "Se insertó Nacho en nombres";
  e.target.remove(); 
  actualizar();
});

/* COSAS (DINÁMICO CON VALIDACIÓN SILENCIOSA) */
document.getElementById("btnCosas").addEventListener("click", (e) => {
  const posInput = document.getElementById("pos");
  const pos = parseInt(posInput.value);
  const n1 = document.getElementById("n1").value;
  const n2 = document.getElementById("n2").value;
  const errorMsg = document.getElementById("errorMsg");

  // Validación: Solo procede si la posición existe en el array
  if (!isNaN(pos) && pos >= 0 && pos < cosas.length) {
    cosas.splice(pos, 2, n1, n2); 
    document.getElementById("resultado").textContent = `Se reemplazó desde posición ${pos}`;
    
    // Si todo sale bien, borramos el bloque de inputs y ocultamos el error
    document.getElementById("inputsCosas").remove();
    actualizar();
  } else {
    // Si la posición está mal, mostramos un mensajito de texto en rojo (sin alert)
    errorMsg.classList.remove("d-none");
    posInput.classList.add("is-invalid");
  }
});

actualizar();