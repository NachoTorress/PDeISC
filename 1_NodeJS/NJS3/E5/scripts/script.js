const canvas = document.getElementById('canvas');

// --- PLANTILLAS EXISTENTES ---
const getCardHTML = () => `
    <div class="card bg-dark text-white border-secondary card-custom animate__animated animate__zoomIn">
        <div class="card-body">
            <h5 class="card-title text-info">Usuario</h5>
            <p class="card-text small text-secondary">Inyectado como String.</p>
        </div>
    </div>
`;

const getAlertaHTML = () => `
    <div class="alert alert-warning w-100 animate__animated animate__fadeInDown">
        <strong>Aviso:</strong> Nodo inyectado por innerHTML.
    </div>
`;

const getTablaHTML = () => `
    <div class="table-responsive w-100 animate__animated animate__fadeIn">
        <table class="table table-dark table-sm border-secondary">
            <thead><tr><th>Dato</th><th>Valor</th></tr></thead>
            <tbody><tr><td>ID</td><td>${Math.floor(Math.random()*100)}</td></tr></tbody>
        </table>
    </div>
`;

// --- NUEVAS PLANTILLAS ---

// 4. ACORDEÓN (Usa IDs únicos para que no fallen los botones)
const getAcordeonHTML = () => {
    const id = Date.now(); // Generamos un ID único basado en el tiempo
    return `
    <div class="accordion w-100 animate__animated animate__fadeIn" id="acc-${id}">
        <div class="accordion-item bg-dark border-secondary">
            <h2 class="accordion-header">
                <button class="accordion-button collapsed bg-dark text-primary" type="button" data-bs-toggle="collapse" data-bs-target="#col-${id}">
                    Componente Acordeón #${id.toString().slice(-4)}
                </button>
            </h2>
            <div id="col-${id}" class="accordion-collapse collapse" data-bs-parent="#acc-${id}">
                <div class="accordion-body text-white-50">
                    Este contenido se despliega gracias a que <strong>innerHTML</strong> inyectó 
                    correctamente los atributos data-bs de Bootstrap.
                </div>
            </div>
        </div>
    </div>`;
};

// 5. LISTA DE TAREAS CON BADGES
const getListaHTML = () => `
    <ul class="list-group w-100 animate__animated animate__slideInRight">
        <li class="list-group-item bg-dark text-white d-flex justify-content-between align-items-center border-secondary">
            Servidor Express activo
            <span class="badge bg-primary rounded-pill">ON</span>
        </li>
        <li class="list-group-item bg-dark text-white d-flex justify-content-between align-items-center border-secondary">
            MIME Type verificado
            <span class="badge bg-success rounded-pill">OK</span>
        </li>
    </ul>
`;

// --- ASIGNACIÓN DE EVENTOS ---
document.getElementById('btnCard').onclick = () => canvas.innerHTML += getCardHTML();
document.getElementById('btnAlerta').onclick = () => canvas.innerHTML += getAlertaHTML();
document.getElementById('btnTabla').onclick = () => canvas.innerHTML += getTablaHTML();
document.getElementById('btnAcordeon').onclick = () => canvas.innerHTML += getAcordeonHTML();
document.getElementById('btnLista').onclick = () => canvas.innerHTML += getListaHTML();

document.getElementById('btnLimpiar').onclick = () => canvas.innerHTML = '';