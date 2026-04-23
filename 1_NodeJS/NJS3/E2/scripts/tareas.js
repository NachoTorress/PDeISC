// Evento DHTML: 'submit' para formularios y delegación de eventos
const form = document.getElementById('formTarea');
const input = document.getElementById('inputTarea');
const lista = document.getElementById('listaTareas');

form.addEventListener('submit', (e) => {
    e.preventDefault(); // Evita que la página se recargue
    const texto = input.value.trim();
    
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-center tarea-item';
    li.innerHTML = `
        <span class="texto-tarea">${texto}</span>
        <button class="btn btn-sm btn-danger btn-eliminar">✖</button>
    `;
    
    lista.appendChild(li);
    input.value = ''; // Limpia el input
});

// Delegación de eventos para tachar o eliminar
lista.addEventListener('click', (e) => {
    // Si clickea el botón rojo
    if (e.target.classList.contains('btn-eliminar')) {
        e.target.parentElement.remove();
    } 
    // Si clickea el texto de la tarea
    else if (e.target.classList.contains('texto-tarea')) {
        e.target.classList.toggle('tachado');
    }
});