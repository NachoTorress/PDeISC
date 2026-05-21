// ============================================================
//  SISTEMA DE CHECK-IN HOTELERO — main.js
//  Funcionalidades:
//    - Validaciones en tiempo real
//    - Toggle modo claro / oscuro
//    - Confirmación de DNI duplicado en fechas solapadas
// ============================================================

// ---------- REFERENCIAS AL DOM ----------
const form            = document.getElementById('hotelForm');
const tabla           = document.getElementById('tablaReservas');
const liveFeedback    = document.getElementById('liveFeedback');
const alertContainer  = document.getElementById('alertContainer');
const btnScrollTop    = document.getElementById('btnScrollTop');
const fechaIngresoEl  = document.getElementById('fechaIngreso');
const fechaSalidaEl   = document.getElementById('fechaSalida');
const themeToggle     = document.getElementById('themeToggle');
const themeStylesheet = document.getElementById('themeStylesheet');

// ---------- ESTADO DE LA APLICACIÓN ----------

/**
 * Base de datos volátil de reservas registradas.
 * Cada entrada: { habitacion, ingreso, salida, dni }
 */
let baseDeDatosReservas = [];

/**
 * Flag que indica si el usuario ya confirmó el DNI duplicado
 * y el registro debe proceder igualmente.
 */
let confirmarDniDuplicado = false;

// Regex: permite letras (incluyendo acentos), espacios y apóstrofe
const regexTexto = /^(?=.*[a-zA-ZÁÉÍÓÚáéíóúñÑ])[a-zA-ZÁÉÍÓÚáéíóúñÑ\s']{3,}$/;

// ---------- MODO OSCURO / CLARO ----------

/**
 * Aplica el tema guardado en localStorage al cargar la página.
 * Por defecto usa modo claro.
 */
(function aplicarTemaGuardado() {
    const temaGuardado = localStorage.getItem('tema') || 'claro';
    if (temaGuardado === 'oscuro') {
        activarModoOscuro(false); // false = sin animar (carga inicial)
    }
})();

/**
 * Activa el CSS de modo oscuro y actualiza el botón.
 * @param {boolean} [guardar=true] - Si debe guardarse en localStorage.
 */
function activarModoOscuro(guardar = true) {
    themeStylesheet.href = '../styles/style-dark.css';
    themeToggle.textContent = '☀️ Modo Claro';
    if (guardar) localStorage.setItem('tema', 'oscuro');
}

/**
 * Activa el CSS de modo claro y actualiza el botón.
 * @param {boolean} [guardar=true] - Si debe guardarse en localStorage.
 */
function activarModoClaro(guardar = true) {
    themeStylesheet.href = '../styles/style.css';
    themeToggle.textContent = '🌙 Modo Oscuro';
    if (guardar) localStorage.setItem('tema', 'claro');
}

/** Listener del botón toggle de tema */
themeToggle.addEventListener('click', () => {
    const esOscuro = themeStylesheet.href.includes('style-dark');
    esOscuro ? activarModoClaro() : activarModoOscuro();
});

// ---------- BLOQUEAR CARACTERES INVÁLIDOS EN INPUTS NUMÉRICOS ----------
/**
 * Previene que el usuario escriba caracteres no numéricos en campos
 * marcados con la clase .input-no-e (e, E, +, -, .)
 */
document.querySelectorAll('.input-no-e').forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
    });
});

// ---------- VALIDACIÓN DINÁMICA DE FECHAS ----------
/**
 * Al cambiar la fecha de ingreso, ajusta el mínimo de fecha de salida
 * para que siempre sea al menos un día posterior.
 */
fechaIngresoEl.addEventListener('change', () => {
    if (!fechaIngresoEl.value) return;

    const minDate = new Date(fechaIngresoEl.value);
    minDate.setDate(minDate.getDate() + 1);
    fechaSalidaEl.min = minDate.toISOString().split('T')[0];

    // Si la salida ya elegida queda inválida, la borra
    if (fechaSalidaEl.value && fechaSalidaEl.value <= fechaIngresoEl.value) {
        fechaSalidaEl.value = '';
    }
});

// ---------- MONITOR EN TIEMPO REAL ----------
/**
 * Actualiza el monitor inferior con los datos del huésped
 * a medida que el usuario escribe (evento 'input' en el form).
 * También quita la clase 'is-invalid' del campo que está siendo editado.
 */
form.addEventListener('input', (e) => {
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

// ---------- FUNCIONES DE VALIDACIÓN ----------

/**
 * Marca un input como inválido y muestra el mensaje de error.
 * @param {HTMLElement} input - El campo a marcar.
 * @param {string} [mensaje] - Mensaje personalizado (opcional).
 */
function marcarInvalido(input, mensaje = null) {
    input.classList.add('is-invalid');
    if (mensaje) {
        const fb = input.nextElementSibling;
        if (fb && fb.classList.contains('invalid-feedback')) {
            fb.innerText = mensaje;
        }
    }
}

/**
 * Limpia todos los estados de error del formulario.
 */
function limpiarErrores() {
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

/**
 * Valida todos los campos del formulario.
 * @param {Object} data - Datos del FormData del formulario.
 * @returns {boolean} true si todo es válido.
 */
function validarFormulario(data) {
    limpiarErrores();
    let esValido = true;

    // Nombre
    if (!regexTexto.test(data.nombre)) {
        marcarInvalido(document.getElementById('nombre'));
        esValido = false;
    }

    // Apellido
    if (!regexTexto.test(data.apellido)) {
        marcarInvalido(document.getElementById('apellido'));
        esValido = false;
    }

   // DNI: entre 7 y 10 dígitos enteros
if (
    !/^\d{7,10}$/.test(data.dni)
) {
    marcarInvalido(
        document.getElementById('dni'),
        'El DNI debe tener entre 7 y 10 números.'
    );
    esValido = false;
}

   // Teléfono: entre 8 y 11 dígitos
if (
    !/^\d{8,11}$/.test(data.telefono)
) {
    marcarInvalido(
        document.getElementById('telefono'),
        'El teléfono debe tener entre 8 y 11 números.'
    );
    esValido = false;
}

    // Fechas
    const inicioNuevo = new Date(data.fechaIngreso);
    const finNuevo    = new Date(data.fechaSalida);

    if (!data.fechaIngreso || !data.fechaSalida || finNuevo <= inicioNuevo) {
        marcarInvalido(
            document.getElementById('fechaSalida'),
            'La fecha de salida debe ser posterior al ingreso.'
        );
        esValido = false;
    }

   // Número de habitación: entero positivo
const numHab = Number(data.numeroHabitacion);

if (
    !Number.isInteger(numHab) ||
    numHab <= 0 ||
    numHab >= 320
) {
    marcarInvalido(
        document.getElementById('numeroHabitacion'),
        'Ingrese un número entero válido, y menor a 320.'
    );
    esValido = false;
}

   // Cantidad de personas: entero positivo
const personas = Number(data.personas);

if (
    !Number.isInteger(personas) ||
    personas < 1 ||
    personas > 10
) {
    marcarInvalido(
        document.getElementById('personas'),
        'Ingrese una cantidad entera válida (entre 1 y 10).'
    );
    esValido = false;
}

    // Contacto de emergencia: entre 8 y 15 dígitos (si se ingresó)
    if (data.contacto && data.contacto.length > 0 && (!/^\d{8,15}$/.test(data.contacto))) {
        marcarInvalido(
            document.getElementById('contacto'),
            'El contacto de emergencia debe tener entre 8 y 15 números.'
        );
        esValido = false;
    }

    // Disponibilidad de la habitación (solapamiento de fechas)
    if (esValido) {
        const ocupada = baseDeDatosReservas.some(reserva => {
            if (String(reserva.habitacion) === String(data.numeroHabitacion)) {
                const inicioExistente = new Date(reserva.ingreso);
                const finExistente    = new Date(reserva.salida);
                return inicioNuevo < finExistente && finNuevo > inicioExistente;
            }
            return false;
        });

        if (ocupada) {
            marcarInvalido(
                document.getElementById('numeroHabitacion'),
                'Habitación ocupada en esas fechas.'
            );
            esValido = false;
        }
    }

    return esValido;
}

// ---------- DETECCIÓN DE DNI DUPLICADO EN FECHAS SOLAPADAS ----------

/**
 * Verifica si el DNI ya tiene una reserva en fechas que se solapan
 * con las fechas ingresadas actualmente.
 * @param {string} dni - DNI a verificar.
 * @param {Date} inicioNuevo - Fecha de ingreso nueva.
 * @param {Date} finNuevo - Fecha de salida nueva.
 * @returns {boolean} true si hay solapamiento de fechas para ese DNI.
 */
function dniTieneReservaEnFechas(dni, inicioNuevo, finNuevo) {
    return baseDeDatosReservas.some(reserva => {
        if (String(reserva.dni) === String(dni)) {
            const inicioExistente = new Date(reserva.ingreso);
            const finExistente    = new Date(reserva.salida);
            return inicioNuevo < finExistente && finNuevo > inicioExistente;
        }
        return false;
    });
}

// ---------- MODAL DE CONFIRMACIÓN ----------

/**
 * Muestra un modal de confirmación personalizado.
 * No usa alert() ni confirm() del navegador.
 * @param {string} titulo - Título del modal.
 * @param {string} mensaje - Cuerpo del mensaje.
 * @param {string} textoConfirmar - Texto del botón de confirmar.
 * @returns {Promise<boolean>} Resuelve true si confirma, false si cancela.
 */
function mostrarModal(titulo, mensaje, textoConfirmar = 'Confirmar') {
    return new Promise((resolve) => {

        // Crear overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-labelledby', 'modalTitulo');

        overlay.innerHTML = `
            <div class="modal-box">
                <h5 id="modalTitulo">⚠️ ${titulo}</h5>
                <p>${mensaje}</p>
                <div class="d-flex gap-2 justify-content-end mt-3">
                    <button class="btn btn-secondary btn-sm" id="modalCancelar">Cancelar</button>
                    <button class="btn btn-warning btn-sm" id="modalConfirmar">${textoConfirmar}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Foco automático en el botón de cancelar (mejor práctica UX/accesibilidad)
        overlay.querySelector('#modalCancelar').focus();

        // Listener: confirmar
        overlay.querySelector('#modalConfirmar').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(true);
        });

        // Listener: cancelar
        overlay.querySelector('#modalCancelar').addEventListener('click', () => {
            document.body.removeChild(overlay);
            resolve(false);
        });

        // Cerrar con Escape
        overlay.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.body.removeChild(overlay);
                resolve(false);
            }
        });
    });
}

// ---------- REGISTRO EN LA TABLA ----------

/**
 * Formatea una fecha string (YYYY-MM-DD) a DD/MM/AA para mostrar en tabla.
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD.
 * @returns {string} Fecha formateada DD/MM/AA.
 */
function formatearFecha(fechaStr) {
    if (!fechaStr) return '—';
    const [anio, mes, dia] = fechaStr.split('-');
    return `${dia}/${mes}/${anio.slice(2)}`;
}

/**
 * Obtiene la fecha actual del sistema formateada como DD/MM/AA.
 * @returns {string}
 */
function fechaDeHoy() {
    const hoy = new Date();
    const dd = String(hoy.getDate()).padStart(2, '0');
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const aa = String(hoy.getFullYear()).slice(2);
    return `${dd}/${mm}/${aa}`;
}

/**
 * Inserta una nueva fila en la tabla de historial con los datos del formulario.
 * @param {Object} data - Datos del formulario.
 */
function insertarFilaTabla(data) {
    const inicioNuevo = new Date(data.fechaIngreso);
    const finNuevo    = new Date(data.fechaSalida);
    const noches      = Math.round((finNuevo - inicioNuevo) / (1000 * 60 * 60 * 24));

    const row = document.createElement('tr');
    row.className = 'animate-row';
    row.innerHTML = `
        <td class="ps-3">
            <strong>${data.apellido.toUpperCase()}, ${data.nombre}</strong><br>
            <small class="text-muted">DNI: ${data.dni}</small><br>
            <small class="text-muted">Tel: ${data.telefono}</small>
        </td>
        <td>
            📅 ${formatearFecha(data.fechaIngreso)}<br>
            <small class="text-primary">Salida: ${formatearFecha(data.fechaSalida)}</small><br>
            <small class="text-muted">${noches} noche${noches !== 1 ? 's' : ''}</small>
        </td>
        <td>r
            Hab. ${data.numeroHabitacion} — ${data.habitacion}<br>
            <small class="text-muted">${data.pago} · ${data.personas} pers.</small><br>
            <small class="text-muted" title="Fecha de registro">🗓 ${fechaDeHoy()}</small>
        </td>
    `;

    tabla.prepend(row);
}

// ---------- SUBMIT DEL FORMULARIO ----------

/**
 * Maneja el envío del formulario.
 * Valida los datos, verifica duplicados de DNI y registra la entrada.
 * Usa async/await para poder mostrar el modal de confirmación.
 */
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fd   = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    // 1. Validar campos
    if (!validarFormulario(data)) return;

    // 2. Verificar DNI duplicado en fechas solapadas
    const inicioNuevo = new Date(data.fechaIngreso);
    const finNuevo    = new Date(data.fechaSalida);

    if (dniTieneReservaEnFechas(data.dni, inicioNuevo, finNuevo)) {
        const confirmado = await mostrarModal(
            'DNI ya registrado en esas fechas',
            `El DNI <strong>${data.dni}</strong> ya tiene una reserva activa en el período seleccionado 
             (${formatearFecha(data.fechaIngreso)} — ${formatearFecha(data.fechaSalida)}).<br><br>
             ¿Está seguro/a de que desea registrar igualmente este ingreso?`,
            'Sí, registrar igual'
        );

        // Si el usuario cancela, no se registra
        if (!confirmado) return;
    }

    // 3. Guardar en base de datos interna para futuras validaciones
    baseDeDatosReservas.push({
        habitacion: data.numeroHabitacion,
        ingreso:    data.fechaIngreso,
        salida:     data.fechaSalida,
        dni:        data.dni
    });

    // 4. Insertar fila en la tabla
    insertarFilaTabla(data);

    // 5. Resetear formulario y UI
    form.reset();
    liveFeedback.innerHTML = '&gt;_ EN ESPERA';
    showAlert('✓ Ingreso registrado correctamente.', 'success');
});

// ---------- FUNCIONES DE INTERFAZ ----------

/**
 * Muestra una alerta temporal en el contenedor de alertas.
 * @param {string} msg - Mensaje a mostrar.
 * @param {string} type - Tipo Bootstrap ('success' | 'danger').
 */
function showAlert(msg, type) {
    alertContainer.innerHTML = `
        <div class="alert alert-${type} py-2 shadow-sm animate-row" role="alert">
            ${msg}
        </div>
    `;
    setTimeout(() => { alertContainer.innerHTML = ''; }, 3500);
}

// ---------- BOTÓN VOLVER ARRIBA ----------

/** Muestra u oculta el botón según posición de scroll */
window.addEventListener('scroll', () => {
    btnScrollTop.classList.toggle('visible', window.scrollY > 300);
});

/** Scroll suave al tope al hacer click */
btnScrollTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});