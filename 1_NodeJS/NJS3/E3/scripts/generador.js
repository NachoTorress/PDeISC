// --- GENERADOR DE CONTRASEÑAS ---

const btnGenerar = document.getElementById('btnGenerar');
const btnCopiar = document.getElementById('btnCopiar');
const passResult = document.getElementById('passResult');

btnGenerar.addEventListener('click', () => {
    const caracteres = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let password = "";

    for (let i = 0; i < 12; i++) {
        password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }

    passResult.value = password;

    btnCopiar.textContent = "Copiar";
    btnCopiar.classList.remove('btn-success');
    btnCopiar.classList.add('btn-outline-secondary');
});

btnCopiar.addEventListener('click', () => {
    if (passResult.value) {
        navigator.clipboard.writeText(passResult.value);
        btnCopiar.textContent = "¡Copiado!";
        btnCopiar.classList.replace('btn-outline-secondary', 'btn-success');
    }
});


// --- ANALIZADOR DE DESCENDIENTES ---

const displayNodos = document.getElementById('conteoNodos');
const btnAnalizar = document.getElementById('btnContarTodo');
const tarjeta = document.querySelector('.card');

// Botón: analiza todo el componente
btnAnalizar.onclick = () => {
    const total = tarjeta.querySelectorAll('*').length;
    displayNodos.textContent = total;
};

// Click dinámico
document.addEventListener('click', (e) => {
    const elemento = e.target;

    // Evitar interferencias
    if (
        elemento.id === 'btnContarTodo' ||
        elemento.id === 'btnGenerar' ||
        elemento.id === 'btnCopiar' ||
        elemento.id === 'passResult'
    ) return;

    const total = elemento.querySelectorAll('*').length;

    displayNodos.textContent = total;

    console.log("Elemento clickeado:", elemento);
    console.log("Descendientes:", total);
});