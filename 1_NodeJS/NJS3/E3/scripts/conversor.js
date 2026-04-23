// --- CONVERSOR ---

const kmInput = document.getElementById('kmInput');
const miInput = document.getElementById('miInput');

// KM → Millas
kmInput.addEventListener('input', () => {
    const km = parseFloat(kmInput.value);

    if (!isNaN(km)) {
        miInput.value = (km * 0.621371).toFixed(2);
    } else {
        miInput.value = '';
    }
});

// Millas → KM
miInput.addEventListener('input', () => {
    const mi = parseFloat(miInput.value);

    if (!isNaN(mi)) {
        kmInput.value = (mi / 0.621371).toFixed(2);
    } else {
        kmInput.value = '';
    }
});


// --- ANALIZADOR DE DESCENDIENTES ---

const displayNodos = document.getElementById('conteoNodos');
const btnAnalizar = document.getElementById('btnContarTodo');
const tarjeta = document.querySelector('.card');

// Botón: analiza todo
btnAnalizar.onclick = () => {
    const total = tarjeta.querySelectorAll('*').length;
    displayNodos.textContent = total;
};

// Click global
document.addEventListener('click', (e) => {
    const elemento = e.target;

    // No interferir con inputs ni botón
    if (
        elemento.id === 'btnContarTodo' ||
        elemento.id === 'kmInput' ||
        elemento.id === 'miInput'
    ) return;

    const total = elemento.querySelectorAll('*').length;

    displayNodos.textContent = total;

    console.log("Elemento clickeado:", elemento);
    console.log("Descendientes:", total);
});