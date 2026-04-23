/**
 * Cronómetro Profesional + Analizador de Descendientes DOM
 */

// --- CRONÓMETRO ---
let startTime;
let elapsedTime = 0;
let timerInterval;

const mDisp = document.getElementById('minutos');
const sDisp = document.getElementById('segundos');
const msDisp = document.getElementById('milisegundos');

const updateChrono = () => {
    const diff = Date.now() - startTime + elapsedTime;
    const mins = Math.floor(diff / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const ms = diff % 1000;

    mDisp.textContent = String(mins).padStart(2, '0');
    sDisp.textContent = String(secs).padStart(2, '0');
    msDisp.textContent = String(ms).padStart(3, '0');
};

document.getElementById('btnStart').onclick = () => {
    if (!timerInterval) {
        startTime = Date.now();
        timerInterval = setInterval(updateChrono, 10);
    }
};

document.getElementById('btnStop').onclick = () => {
    if (timerInterval) {
        elapsedTime += Date.now() - startTime;
        clearInterval(timerInterval);
        timerInterval = null;
    }
};

document.getElementById('btnReset').onclick = () => {
    clearInterval(timerInterval);
    timerInterval = null;
    elapsedTime = 0;
    mDisp.textContent = "00";
    sDisp.textContent = "00";
    msDisp.textContent = "000";
};

// --- ANALIZADOR DE DESCENDIENTES ---

const btnAnalizar = document.getElementById('btnContarTodo');
const displayConteo = document.getElementById('conteoTotal');
const raiz = document.getElementById('raiz-componente');

// Botón original (sigue funcionando igual)
btnAnalizar.onclick = () => {
    const descendientes = raiz.querySelectorAll('*');
    const totalDescendientes = descendientes.length;

    displayConteo.textContent = totalDescendientes;

    btnAnalizar.classList.replace('btn-info', 'btn-light');
    setTimeout(() => btnAnalizar.classList.replace('btn-light', 'btn-info'), 200);

    console.log("--- Informe del DOM ---");
    console.log(`Se han encontrado ${totalDescendientes} descendientes totales.`);
    console.dir(descendientes);
};

// NUEVO: contar descendientes del elemento clickeado
document.addEventListener('click', (e) => {
    // Evitar conflicto con el botón
    if (e.target.id === 'btnContarTodo') return;

    const elemento = e.target;

    // Contar todos los descendientes del elemento clickeado
    const total = elemento.querySelectorAll('*').length;

    displayConteo.textContent = total;

    console.log("Elemento clickeado:", elemento);
    console.log("Total de descendientes:", total);
});