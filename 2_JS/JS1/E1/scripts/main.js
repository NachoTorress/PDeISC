// ============================================================
//  SISTEMA DE CHECK-IN HOTELERO — main.js (Validaciones en Input)
// ============================================================

const form           = document.getElementById('hotelForm');
const tabla          = document.getElementById('tablaReservas');
const liveFeedback   = document.getElementById('liveFeedback');
const alertContainer = document.getElementById('alertContainer');
const btnScrollTop   = document.getElementById('btnScrollTop');
const fechaIngreso   = document.getElementById('fechaIngreso');
const fechaSalida    = document.getElementById('fechaSalida');

// Base de datos volátil para validaciones de fecha/habitación
let baseDeDatosReservas = [];

// Expresión regular: permite letras, espacios y apóstrofes (')
const regexTexto = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s']{3,}$/;

// --- BLOQUEAR CARACTERES INVÁLIDOS EN NUMÉRICOS ---
document.querySelectorAll('.input-no-e').forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
    });
});

// --- VALIDACIÓN DINÁMICA DE FECHAS (Atributo min) ---
fechaIngreso.addEventListener('change', () => {
    if (!fechaIngreso.value) return;
    let minDate = new Date(fechaIngreso.value);
    minDate.setDate(minDate.getDate() + 1);
    fechaSalida.min = minDate.toISOString().split('T')[0];
    
    if (fechaSalida.value && fechaSalida.value <= fechaIngreso.value) {
        fechaSalida.value = '';
    }
});

// --- MONITOR EN TIEMPO REAL ---
form.addEventListener('input', (e) => {
    // Quitar estado de error al escribir
    if (e.target.classList.contains('is-invalid')) {
        e.target.classList.remove('is-invalid');
    }

    const nom = document.getElementById('nombre').value || '...';
    const ape = document.getElementById('apellido').value || '...';
    const hab = document.getElementById('numeroHabitacion').value || '—';
    
    liveFeedback.innerHTML = `
        <div>CHECK-IN: ${ape.toUpperCase()}, ${nom}</div>
        <div style="font-size:11px; color:#8b949e;">Habitación: ${hab}</div>
    `;
});

// --- SUBMIT: VALIDACIÓN E INSERCIÓN ---
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());
    
    // Referencias a los inputs para mostrar errores
    const inputNombre = document.getElementById('nombre');
    const inputApellido = document.getElementById('apellido');
    const inputHabitacion = document.getElementById('numeroHabitacion');
    const inputSalida = document.getElementById('fechaSalida');

    let esValido = true;

    // 1. Limpiar todos los errores previos
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    // 2. Validación de Texto (Nombre y Apellido con apóstrofes)
    if (!regexTexto.test(data.nombre)) {
        inputNombre.classList.add('is-invalid');
        esValido = false;
    }
    if (!regexTexto.test(data.apellido)) {
        inputApellido.classList.add('is-invalid');
        esValido = false;
    }

    // 3. Validación de Fechas
    const inicioNuevo = new Date(data.fechaIngreso);
    const finNuevo = new Date(data.fechaSalida);

    if (!data.fechaIngreso || !data.fechaSalida || finNuevo <= inicioNuevo) {
        inputSalida.classList.add('is-invalid');
        const feedback = inputSalida.nextElementSibling;
        if (feedback) feedback.innerText = "La fecha de salida debe ser posterior al ingreso.";
        esValido = false;
    }

    // 4. Validación de Disponibilidad (Solapamiento)
    const ocupada = baseDeDatosReservas.some(reserva => {
        if (reserva.habitacion === data.numeroHabitacion) {
            const inicioExistente = new Date(reserva.ingreso);
            const finExistente = new Date(reserva.salida);
            return (inicioNuevo < finExistente && finNuevo > inicioExistente);
        }
        return false;
    });

    if (ocupada) {
        inputHabitacion.classList.add('is-invalid');
        const feedback = inputHabitacion.nextElementSibling;
        if (feedback) feedback.innerText = "Habitación ocupada en esas fechas.";
        esValido = false;
    }

    // Abortar si algo falló
    if (!esValido) return;

    // --- PROCESO DE REGISTRO ---
    
    // Guardar en base de datos para futuras validaciones
    baseDeDatosReservas.push({
        habitacion: data.numeroHabitacion,
        ingreso: data.fechaIngreso,
        salida: data.fechaSalida
    });

    // Calcular noches
    const noches = Math.round((finNuevo - inicioNuevo) / (1000 * 60 * 60 * 24));

    // Crear fila
    const row = document.createElement('tr');
    row.className = 'animate-row';
    row.innerHTML = `
        <td class="ps-3">
            <strong>${data.apellido.toUpperCase()}, ${data.nombre}</strong><br>
            <small class="text-muted">DNI: ${data.dni}</small>
        </td>
        <td>
            📅 ${data.fechaIngreso}<br>
            <small class="text-primary">Salida: ${data.fechaSalida}</small><br>
            <small class="text-muted">${noches} noche${noches !== 1 ? 's' : ''}</small>
        </td>
        <td>
            Hab. ${data.numeroHabitacion} — ${data.habitacion}<br>
            <small class="text-muted">${data.pago} · ${data.personas} pers.</small>
        </td>
    `;

    tabla.prepend(row);
    form.reset();
    liveFeedback.innerHTML = '&gt;_ EN ESPERA';
    showAlert('✓ Ingreso registrado correctamente.', 'success');
});

// --- FUNCIONES DE INTERFAZ ---
function showAlert(msg, type) {
    alertContainer.innerHTML = `<div class="alert alert-${type} py-2 shadow-sm animate-row">${msg}</div>`;
    setTimeout(() => { alertContainer.innerHTML = ''; }, 3500);
}

window.addEventListener('scroll', () => {
    btnScrollTop.classList.toggle('visible', window.scrollY > 300);
});

btnScrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});