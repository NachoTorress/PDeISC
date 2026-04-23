// --- CALCULADORA ---

const montoInput = document.getElementById('monto');
const rangoInput = document.getElementById('rango');
const lblPorcentaje = document.getElementById('lblPorcentaje');
const totalFinal = document.getElementById('totalFinal');

function calcularPropina() {
    const monto = parseFloat(montoInput.value) || 0;
    const porcentaje = parseInt(rangoInput.value);
    
    lblPorcentaje.textContent = `${porcentaje}%`;
    const total = monto + (monto * (porcentaje / 100));
    totalFinal.textContent = `$ ${total.toFixed(2)}`;
}

montoInput.addEventListener('input', calcularPropina);
rangoInput.addEventListener('input', calcularPropina);


// --- ANALIZADOR DE DESCENDIENTES ---

const displayNodos = document.getElementById('conteoNodos');
const btnAnalizar = document.getElementById('btnContarTodo');
const tarjeta = document.querySelector('.card');

// Botón: analiza todo el componente
btnAnalizar.onclick = () => {
    const total = tarjeta.querySelectorAll('*').length;
    displayNodos.textContent = total;
};

// Click dinámico: analiza elemento clickeado
document.addEventListener('click', (e) => {
    const elemento = e.target;

    // Evitar interferir con inputs o el botón
    if (
        elemento.id === 'monto' ||
        elemento.id === 'rango' ||
        elemento.id === 'btnContarTodo'
    ) return;

    const total = elemento.querySelectorAll('*').length;

    displayNodos.textContent = total;

    console.log("Elemento clickeado:", elemento);
    console.log("Descendientes:", total);
});