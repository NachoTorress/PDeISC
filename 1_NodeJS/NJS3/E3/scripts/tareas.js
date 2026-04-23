// --- LISTA DE TAREAS ---

const form = document.getElementById('formTarea');
const input = document.getElementById('inputTarea');
const lista = document.getElementById('listaTareas');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const texto = input.value.trim();
    if (!texto) return;

    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center tarea-item';
    li.innerHTML = `
        <span class="texto-tarea">${texto}</span>
        <button class="btn btn-sm btn-danger btn-eliminar">✖</button>
    `;
    
    lista.appendChild(li);
    input.value = '';
});

// Delegación de eventos (esto NO hay que romperlo)
lista.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-eliminar')) {
        e.target.parentElement.remove();
    } 
    else if (e.target.classList.contains('texto-tarea')) {
        e.target.classList.toggle('tachado');
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

    // MUY IMPORTANTE: no romper la lista ni el form
    if (
        elemento.id === 'btnContarTodo' ||
        elemento.id === 'inputTarea' ||
        elemento.closest('#formTarea') ||
        elemento.closest('#listaTareas')
    ) return;

    const total = elemento.querySelectorAll('*').length;

    displayNodos.textContent = total;

    console.log("Elemento clickeado:", elemento);
    console.log("Descendientes:", total);
});