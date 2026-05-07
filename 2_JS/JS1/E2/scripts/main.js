const form = document.getElementById('userForm');
const tabla = document.getElementById('tablaUsuarios');
const alertContainer = document.getElementById('alertContainer');
const userBadge = document.getElementById('userBadge');

// Cargamos de LocalStorage por defecto, o de Session si el Local está vacío
let usuarios = JSON.parse(localStorage.getItem('db_usuarios')) || 
               JSON.parse(sessionStorage.getItem('db_usuarios')) || [];

const regexLetras = /^[a-zA-ZÁéíóúÁÉÍÓÚñÑ\s]{3,}$/;

window.addEventListener('DOMContentLoaded', () => renderTabla());

// VALIDACIÓN DINÁMICA
document.querySelectorAll('.validate-text').forEach(input => {
    input.addEventListener('input', () => {
        const errorDiv = document.getElementById(`error-${input.id}`);
        if (input.value.length > 0 && !regexLetras.test(input.value)) {
            errorDiv.style.display = 'block';
            input.classList.add('input-error');
        } else {
            errorDiv.style.display = 'none';
            input.classList.remove('input-error');
        }
    });
});

document.querySelectorAll('.input-no-e').forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
    });
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    const inputsParaValidar = ['nombre', 'apellidos', 'calle', 'ciudad'];
    let formValido = true;
    inputsParaValidar.forEach(id => {
        if (!regexLetras.test(document.getElementById(id).value)) formValido = false;
    });

    if (!formValido || !data.altura || !data.cp) {
        showAlert('Revisa los campos obligatorios (*) y el formato.', 'danger');
        return;
    }

    data.id = Date.now();
    usuarios.push(data);
    
    sincronizarAlmacenamiento();
    renderTabla();
    form.reset();
    showAlert('✓ Registrado en Local y Session Storage.', 'success');
});

// FUNCIÓN DE DUAL STORAGE
function sincronizarAlmacenamiento() {
    const dataString = JSON.stringify(usuarios);
    localStorage.setItem('db_usuarios', dataString);
    sessionStorage.setItem('db_usuarios', dataString);
}

function renderTabla() {
    tabla.innerHTML = '';
    userBadge.innerText = `${usuarios.length} Usuarios`;

    usuarios.forEach(user => {
        const row = document.createElement('tr');
        row.className = "row-animate";
        row.innerHTML = `
            <td>
                <div class="fw-bold">${user.nombre} ${user.apellidos}</div>
                <div class="text-muted small">CP: ${user.cp}</div>
            </td>
            <td>
                <div class="small">${user.calle} ${user.altura}</div>
                <div class="text-muted small">${user.piso ? 'Piso '+user.piso : ''} ${user.depto || ''}</div>
            </td>
            <td>
                <div class="small fw-semibold text-primary">${user.ciudad}</div>
            </td>
            <td class="text-end">
                <button class="btn-delete" onclick="eliminarUsuario(${user.id})">Eliminar</button>
            </td>
        `;
        tabla.prepend(row);
    });
}

window.eliminarUsuario = (id) => {
    usuarios = usuarios.filter(u => u.id !== id);
    sincronizarAlmacenamiento();
    renderTabla();
};

function showAlert(msg, type) {
    alertContainer.innerHTML = `<div class="alert alert-${type} py-2 mb-3 border-0 shadow-sm">${msg}</div>`;
    setTimeout(() => alertContainer.innerHTML = '', 3000);
}