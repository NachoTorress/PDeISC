// --- SALUDO DINÁMICO ---

window.addEventListener('load', () => {
    const saludo = document.getElementById('saludo-dinamico');
    const hora = new Date().getHours();

    let mensaje = hora < 12 
        ? '¡Buenos días!' 
        : (hora < 19 ? '¡Buenas tardes!' : '¡Buenas noches!');

    saludo.innerHTML = `<strong>${mensaje}</strong> Todos los sistemas operativos.`;
});


// --- ANALIZADOR DE DESCENDIENTES ---

const displayNodos = document.getElementById('conteoNodos');
const btnAnalizar = document.getElementById('btnContarTodo');
const contenedor = document.querySelector('main');

// Botón: analiza todo el main
btnAnalizar.onclick = () => {
    const total = contenedor.querySelectorAll('*').length;
    displayNodos.textContent = total;
};

// Click global
document.addEventListener('click', (e) => {
    const elemento = e.target;

    // Evitar interferencias
    if (elemento.id === 'btnContarTodo') return;

    const total = elemento.querySelectorAll('*').length;

    displayNodos.textContent = total;

    console.log("Elemento clickeado:", elemento);
    console.log("Descendientes:", total);
});