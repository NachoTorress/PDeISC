// ============================================================
//  SISTEMA DE CHECK-IN HOTELERO — main.js
//  Demuestra las 3 formas de lectura de formularios en JS:
//    1. DOM Directo    → getElementById().value
//    2. FormData       → new FormData(form) + Object.fromEntries()
//    3. Evento 'input' → captura en tiempo real mientras se escribe
// ============================================================


// ─── REFERENCIAS AL DOM ───────────────────────────────────────
const form           = document.getElementById('hotelForm');
const tabla          = document.getElementById('tablaReservas');
const liveFeedback   = document.getElementById('liveFeedback');
const alertContainer = document.getElementById('alertContainer');
const btnScrollTop   = document.getElementById('btnScrollTop');

const fechaIngreso   = document.getElementById('fechaIngreso');
const fechaSalida    = document.getElementById('fechaSalida');

// Expresión regular: solo letras (incluye tildes y ñ), mínimo 3 caracteres
const regexTexto = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s]{3,}$/;

// Todos los inputs numéricos con clase .input-no-e
const inputsNumber = document.querySelectorAll('.input-no-e');


// ─── BLOQUEAR CARACTERES INVÁLIDOS EN INPUTS NUMÉRICOS ────────
// Los inputs type="number" permiten e/E/+/-/. por defecto → los bloqueamos
inputsNumber.forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (['e', 'E', '+', '-', '.'].includes(e.key)) {
            e.preventDefault();
        }
    });
});


// ─── VALIDACIÓN DINÁMICA DE FECHAS ────────────────────────────
// Cuando se elige la fecha de ingreso, la fecha de salida no puede
// ser igual ni anterior → se establece el atributo min en el picker
fechaIngreso.addEventListener('change', () => {
    if (!fechaIngreso.value) return;

    // Calcular el día siguiente al ingreso como mínimo de salida
    const ingreso = new Date(fechaIngreso.value);
    ingreso.setDate(ingreso.getDate() + 1);

    // Formatear como YYYY-MM-DD (requerido por el atributo min)
    const year  = ingreso.getFullYear();
    const month = String(ingreso.getMonth() + 1).padStart(2, '0');
    const day   = String(ingreso.getDate()).padStart(2, '0');
    const minSalida = `${year}-${month}-${day}`;

    fechaSalida.min = minSalida;

    // Si ya había una salida seleccionada que ya no es válida, la limpiamos
    if (fechaSalida.value && fechaSalida.value < minSalida) {
        fechaSalida.value = '';
    }
});


// ─── MÉTODO 3: CAPTURA EN TIEMPO REAL ─────────────────────────
// El evento 'input' se dispara con cada tecla presionada.
// Muestra nombre, apellido, habitación y personas mientras se escribe.
form.addEventListener('input', (e) => {

    // Quitar el estado inválido visual al corregir un campo
    if (e.target.classList.contains('form-control') ||
        e.target.classList.contains('form-select')) {
        e.target.classList.remove('is-invalid');
    }

    // Leer valores actuales de los campos (pueden estar vacíos)
    const nom  = document.getElementById('nombre').value   || '...';
    const ape  = document.getElementById('apellido').value || '...';
    const hab  = document.getElementById('numeroHabitacion').value || '—';
    const pers = document.getElementById('personas').value || '—';

    // Actualizar el monitor en tiempo real
    liveFeedback.innerHTML = `
        <div>CHECK-IN: ${ape.toUpperCase()}, ${nom}</div>
        <div style="font-size:11px; color:#8b949e;">
            Hab: ${hab} &nbsp;|&nbsp; Personas: ${pers}
        </div>
    `;
});


// ─── SUBMIT: VALIDACIÓN + RENDER ──────────────────────────────
form.addEventListener('submit', (e) => {
    // Evitar recarga de página → la UI se actualiza dinámicamente
    e.preventDefault();

    // ── MÉTODO 1: DOM DIRECTO ──────────────────────────────
    // Se accede directamente al valor del campo mediante su ID
    const domNombre          = document.getElementById('nombre');
    const domApellido        = document.getElementById('apellido');
    const domDni             = document.getElementById('dni');
    const domTelefono        = document.getElementById('telefono');
    const domContacto        = document.getElementById('contacto');
    const domPersonas        = document.getElementById('personas');
    const domNumeroHabitacion = document.getElementById('numeroHabitacion');

    // ── MÉTODO 2: FORMDATA ──────────────────────────────────
    // FormData recopila todos los campos del formulario automáticamente
    // Object.fromEntries() lo convierte en un objeto plano {clave: valor}
    const fd   = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    // Flag general de validez del formulario
    let esValido = true;

    // ── LIMPIAR ERRORES ANTERIORES ──────────────────────────
    // Reiniciar mensajes de error dinámicos antes de re-validar
    fechaSalida.nextElementSibling.innerText              = '';
    domPersonas.nextElementSibling.innerText              = '';
    domNumeroHabitacion.nextElementSibling.innerText      = '';
    domContacto.nextElementSibling.innerText              = '';

    // Quitar clase is-invalid de todos los campos para re-evaluar
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    // ── VALIDACIÓN: NOMBRE Y APELLIDO ──────────────────────
    // Mín. 3 letras, sin números ni caracteres especiales
    if (!regexTexto.test(domNombre.value)) {
        domNombre.classList.add('is-invalid');
        esValido = false;
    }

    if (!regexTexto.test(domApellido.value)) {
        domApellido.classList.add('is-invalid');
        esValido = false;
    }

    // ── VALIDACIÓN: DNI ────────────────────────────────────
    // Mínimo 7 dígitos
    if (!domDni.value || domDni.value.length < 7) {
        domDni.classList.add('is-invalid');
        esValido = false;
    }

    // ── VALIDACIÓN: TELÉFONO ───────────────────────────────
    // Mínimo 8 dígitos
    if (!domTelefono.value || domTelefono.value.length < 8) {
        domTelefono.classList.add('is-invalid');
        esValido = false;
    }

    // ── VALIDACIÓN: CONTACTO DE EMERGENCIA ─────────────────
    if (!domContacto.value || domContacto.value.length < 8) {
        domContacto.classList.add('is-invalid');
        domContacto.nextElementSibling.innerText = 'Debe contener al menos 8 números.';
        esValido = false;
    }

    // ── VALIDACIÓN: CANTIDAD DE PERSONAS ───────────────────
    if (!domPersonas.value || domPersonas.value < 1) {
        domPersonas.classList.add('is-invalid');
        domPersonas.nextElementSibling.innerText = 'Debe haber al menos 1 persona.';
        esValido = false;
    }

    // ── VALIDACIÓN: NÚMERO DE HABITACIÓN ───────────────────
    if (!domNumeroHabitacion.value || domNumeroHabitacion.value < 1) {
        domNumeroHabitacion.classList.add('is-invalid');
        domNumeroHabitacion.nextElementSibling.innerText = 'Ingrese un número de habitación válido.';
        esValido = false;
    }

    // ── VALIDACIÓN: FECHAS ─────────────────────────────────
    // Primero verificar que ambas fechas estén completas
    if (!data.fechaIngreso || !data.fechaSalida) {
        fechaSalida.classList.add('is-invalid');
        fechaSalida.nextElementSibling.innerText = 'Debe completar ambas fechas.';
        esValido = false;
    } else if (data.fechaSalida <= data.fechaIngreso) {
        // Solo evaluamos la comparación si ambas fechas existen
        fechaSalida.classList.add('is-invalid');
        fechaSalida.nextElementSibling.innerText =
            'La fecha de salida debe ser posterior a la de ingreso.';
        esValido = false;
    }

    // ── ABORTAR SI HAY ERRORES ─────────────────────────────
    if (!esValido) {
        showAlert('⚠ Datos inválidos o incompletos. Revisá los campos marcados.', 'danger');
        return;
    }

    // ── CALCULAR NOCHES ────────────────────────────────────
    const diffMs    = new Date(data.fechaSalida) - new Date(data.fechaIngreso);
    const noches    = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // ── AGREGAR FILA A LA TABLA (DOM dinámico) ─────────────
    // Se usa createElement y prepend() para insertar sin recargar la página
    const row = document.createElement('tr');
    row.className = 'animate-row';

    row.innerHTML = `
        <td class="ps-3">
            <strong>${domApellido.value.toUpperCase()}, ${domNombre.value}</strong><br>
            <small class="text-muted">DNI: ${domDni.value}</small><br>
            <small class="text-muted">Tel: ${domTelefono.value}</small>
        </td>

        <td>
            📅 ${data.fechaIngreso}<br>
            <small class="text-primary">
                Salida: ${data.fechaSalida}
            </small><br>
            <small class="text-muted">${noches} noche${noches !== 1 ? 's' : ''}</small>
        </td>

        <td>
            Hab. ${data.numeroHabitacion} — ${data.habitacion}<br>
            <small class="text-muted">
                ${data.pago} · ${data.personas} persona${data.personas > 1 ? 's' : ''}
            </small><br>
            <small class="text-muted fst-italic">
                ${data.observaciones || 'Sin observaciones'}
            </small>
        </td>
    `;

    // prepend() agrega la fila al inicio de la tabla (más reciente primero)
    tabla.prepend(row);

    // ── RESETEAR FORMULARIO ────────────────────────────────
    form.reset();
    fechaSalida.min = '';
    liveFeedback.innerHTML = '&gt;_ EN ESPERA';

    showAlert('✓ Ingreso de huésped registrado correctamente.', 'success');
});


// ─── FUNCIÓN: MOSTRAR ALERTAS ──────────────────────────────────
// Muestra una alerta de Bootstrap que desaparece automáticamente a los 3s
function showAlert(msg, type) {
    alertContainer.innerHTML = `
        <div class="alert alert-${type} py-2 shadow-sm animate-row">
            ${msg}
        </div>
    `;

    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 3500);
}


// ─── BOTÓN VOLVER ARRIBA ───────────────────────────────────────
// Aparece cuando el usuario scrollea más de 300px hacia abajo
window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        btnScrollTop.classList.add('visible');
    } else {
        btnScrollTop.classList.remove('visible');
    }
});

// Al hacer click, vuelve suavemente al tope de la página
btnScrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});