const form = document.getElementById('hotelForm');
const tabla = document.getElementById('tablaReservas');
const liveFeedback = document.getElementById('liveFeedback');
const alertContainer = document.getElementById('alertContainer');

const fechaIngreso = document.getElementById('fechaIngreso');
const fechaSalida = document.getElementById('fechaSalida');

const regexTexto = /^[a-zA-ZÁÉÍÓÚáéíóúñÑ\s]{3,}$/;

const inputsNumber = document.querySelectorAll('.input-no-e');

//
// BLOQUEAR e, E, +, -, .
//
inputsNumber.forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (['e', 'E', '+', '-', '.'].includes(e.key)) {
            e.preventDefault();
        }
    });
});

//
// VALIDAR FECHA DE SALIDA > FECHA DE INGRESO
//
fechaIngreso.addEventListener('change', () => {
    if (!fechaIngreso.value) return;

    const ingreso = new Date(fechaIngreso.value);
    ingreso.setDate(ingreso.getDate() + 1);

    const year = ingreso.getFullYear();
    const month = String(ingreso.getMonth() + 1).padStart(2, '0');
    const day = String(ingreso.getDate()).padStart(2, '0');

    const minSalida = `${year}-${month}-${day}`;

    fechaSalida.min = minSalida;

    if (fechaSalida.value && fechaSalida.value < minSalida) {
        fechaSalida.value = "";
    }
});

//
// MÉTODO 3: CAPTURA EN TIEMPO REAL
//
form.addEventListener('input', (e) => {
    if (e.target.classList.contains('form-control')) {
        e.target.classList.remove('is-invalid');
    }

    const nom = document.getElementById('nombre').value || "...";
    const ape = document.getElementById('apellido').value || "...";

    liveFeedback.innerHTML = `
        <div>CHECK-IN: ${nom} ${ape}</div>
    `;
});

//
// SUBMIT
//
form.addEventListener('submit', (e) => {
    e.preventDefault();

    //
    // MÉTODO 1: DOM DIRECTO
    //
    const domNombre = document.getElementById('nombre');
    const domApellido = document.getElementById('apellido');
    const domDni = document.getElementById('dni');
    const domTelefono = document.getElementById('telefono');
    const domContacto = document.getElementById('contacto');
    const domPersonas = document.getElementById('personas');
    const domNumeroHabitacion = document.getElementById('numeroHabitacion');

    //
    // MÉTODO 2: FORMDATA
    //
    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    let esValido = true;

    //
    // LIMPIAR MENSAJES DINÁMICOS
    //
    fechaSalida.nextElementSibling.innerText = "";
    domPersonas.nextElementSibling && (domPersonas.nextElementSibling.innerText = "");
    domNumeroHabitacion.nextElementSibling && (domNumeroHabitacion.nextElementSibling.innerText = "");
    domContacto.nextElementSibling.innerText = "";

    //
    // VALIDACIÓN DE TEXTOS
    //
    if (!regexTexto.test(domNombre.value)) {
        domNombre.classList.add('is-invalid');
        esValido = false;
    }

    if (!regexTexto.test(domApellido.value)) {
        domApellido.classList.add('is-invalid');
        esValido = false;
    }

    //
    // CONTACTO DE EMERGENCIA = SOLO NÚMEROS
    //
    if (!domContacto.value || domContacto.value.length < 8) {
        domContacto.classList.add('is-invalid');
        domContacto.nextElementSibling.innerText = "Debe contener al menos 8 números.";
        esValido = false;
    }

    //
    // VALIDACIÓN DE NÚMEROS
    //
    if (domDni.value.length < 7) {
        domDni.classList.add('is-invalid');
        esValido = false;
    }

    if (domTelefono.value.length < 8) {
        domTelefono.classList.add('is-invalid');
        esValido = false;
    }

    if (!domPersonas.value || domPersonas.value < 1) {
        domPersonas.classList.add('is-invalid');
        domPersonas.nextElementSibling.innerText = "Debe haber al menos 1 persona.";
        esValido = false;
    }

    if (!domNumeroHabitacion.value || domNumeroHabitacion.value < 1) {
        domNumeroHabitacion.classList.add('is-invalid');
        domNumeroHabitacion.nextElementSibling.innerText = "Ingrese un número de habitación válido.";
        esValido = false;
    }

    //
    // VALIDACIÓN DE FECHAS
    //
    if (!data.fechaIngreso || !data.fechaSalida) {
        fechaSalida.classList.add('is-invalid');
        fechaSalida.nextElementSibling.innerText = "Debe completar ambas fechas.";
        esValido = false;
    }

    if (data.fechaSalida <= data.fechaIngreso) {
        fechaSalida.classList.add('is-invalid');
        fechaSalida.nextElementSibling.innerText =
            "La fecha de salida debe ser posterior a la fecha de ingreso.";
        esValido = false;
    }

    if (!esValido) {
        showAlert('Datos inválidos o incompletos.', 'danger');
        return;
    }

    //
    // RENDER TABLA
    //
    const row = document.createElement('tr');
    row.className = "animate-row";

    row.innerHTML = `
        <td class="ps-3">
            <strong>${domApellido.value.toUpperCase()}, ${domNombre.value}</strong><br>
            <small class="text-muted">DNI: ${domDni.value}</small>
        </td>

        <td>
            ${data.fechaIngreso}<br>
            <small class="text-primary">
                Salida: ${data.fechaSalida}
            </small>
        </td>

        <td>
            Hab. ${data.numeroHabitacion} - ${data.habitacion}<br>
            <small class="text-muted">
                ${data.observaciones || "Sin observaciones"}
            </small>
        </td>
    `;

    tabla.prepend(row);

    form.reset();
    fechaSalida.min = "";
    liveFeedback.innerHTML = `>_ EN ESPERA`;

    showAlert(
        '✓ Ingreso de huésped registrado correctamente.',
        'success'
    );
});

//
// ALERTAS
//
function showAlert(msg, type) {
    alertContainer.innerHTML = `
        <div class="alert alert-${type} py-2 shadow-sm animate-row">
            ${msg}
        </div>
    `;

    setTimeout(() => {
        alertContainer.innerHTML = '';
    }, 3000);
}