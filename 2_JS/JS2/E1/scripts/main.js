/**
 * main.js
 * Módulo principal del Generador de Secuencias.
 *
 * Reglas de negocio:
 *  - Mínimo 10, máximo 20 números para habilitar la exportación.
 *  - Solo números enteros (sin decimales).
 *  - Negativos permitidos (son valores numéricos válidos en una secuencia).
 *  - Cada número puede tener hasta 20 dígitos.
 *  - Cada registro guarda su fecha de carga real (DD/MM/AA).
 *  - Validación en tiempo real (on input).
 *  - La eliminación y el limpiado requieren confirmación inline.
 */

// ─── Constantes ───────────────────────────────────────────────────────────────

const MAX_DIGITS = 20;

// ─── Estado ──────────────────────────────────────────────────────────────────

/**
 * @typedef {{ value: number, date: string }} NumberEntry
 */

/** @type {NumberEntry[]} */
let numbers = [];

// ─── Referencias DOM ─────────────────────────────────────────────────────────

const input         = document.getElementById('num-input');
const addBtn        = document.getElementById('add-btn');
const listContainer = document.getElementById('number-list');
const badge         = document.getElementById('counter-badge');
const progressBar   = document.getElementById('progress-bar');
const exportBtn     = document.getElementById('export-btn');
const clearBtn      = document.getElementById('clear-btn');
const errorMsg      = document.getElementById('error-feedback');
const emptyHint     = document.getElementById('empty-hint');
const scrollBtn     = document.getElementById('scroll-top');
const toggleTheme   = document.getElementById('toggle-theme');
const themeLink     = document.getElementById('theme-link');
const themeIcon     = document.getElementById('theme-icon');

// ─── Utilidades ──────────────────────────────────────────────────────────────

/**
 * Genera la fecha actual formateada como DD/MM/AA.
 * @returns {string}
 */
function getTodayStr() {
    const now = new Date();
    const dd  = String(now.getDate()).padStart(2, '0');
    const mm  = String(now.getMonth() + 1).padStart(2, '0');
    const yy  = String(now.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
}

/**
 * Extrae solo los dígitos de un string (ignora signo negativo para el conteo).
 * @param {string} raw
 * @returns {string}
 */
function extractDigits(raw) {
    return raw.replace(/[^0-9]/g, '');
}

/**
 * Valida el valor del input y retorna un mensaje de error o cadena vacía.
 * @param {string} raw
 * @returns {string}
 */
function getValidationError(raw) {
    if (raw === '' || raw === null)              return 'Ingresá un número entero.';
    if (raw.includes('.') || raw.includes(',')) return 'Solo se permiten números enteros (sin decimales).';
    const digits = extractDigits(raw);
    if (digits.length > MAX_DIGITS)             return `El número no puede tener más de ${MAX_DIGITS} dígitos.`;
    const parsed = Number(raw);
    if (isNaN(parsed))                          return 'El valor ingresado no es un número válido.';
    if (!Number.isInteger(parsed))              return 'Solo se permiten números enteros.';
    if (numbers.length >= 20)                   return 'Límite de 20 números alcanzado.';
    return '';
}

// ─── Feedback de Validación ───────────────────────────────────────────────────

/** @param {string} txt */
function showError(txt) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    errorMsg.textContent = txt;
}

function clearError() {
    input.classList.remove('is-invalid', 'is-valid');
    errorMsg.textContent = '';
}

function markValid() {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    errorMsg.textContent = '';
}

// ─── Eventos de Input ─────────────────────────────────────────────────────────

input.addEventListener('input', () => {
    const raw    = input.value;
    const digits = extractDigits(raw);

    // Truncar si supera el límite por paste o autocompletado
    if (digits.length > MAX_DIGITS) {
        const isNeg = raw.startsWith('-');
        input.value = isNeg ? `-${digits.slice(0, MAX_DIGITS)}` : digits.slice(0, MAX_DIGITS);
    }

    if (input.value === '') { clearError(); return; }

    const err = getValidationError(input.value);
    err ? showError(err) : markValid();
});

input.addEventListener('keydown', (e) => {
    const controlKeys = ['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Enter','-'];
    if (controlKeys.includes(e.key)) {
        if (e.key === 'Enter') addNumber();
        return;
    }
    const digits = extractDigits(input.value);
    if (/^\d$/.test(e.key) && digits.length >= MAX_DIGITS) {
        e.preventDefault();
        showError(`Máximo ${MAX_DIGITS} dígitos permitidos.`);
    }
});

input.addEventListener('blur', () => {
    if (input.value === '') clearError();
});

// ─── Renderizado de Lista ─────────────────────────────────────────────────────

/**
 * Re-renderiza la grilla completa y sincroniza todos los controles de UI.
 */
function updateUI() {
    listContainer.innerHTML = '';

    emptyHint.textContent = numbers.length === 0 ? 'Aún no hay números cargados' : '';

    numbers.forEach((entry, i) => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-xl-4';
        col.innerHTML = buildItemHTML(entry, i);
        listContainer.appendChild(col);
    });

    const count = numbers.length;
    badge.textContent = `${count} / 20`;
    progressBar.style.width = `${(count / 20) * 100}%`;
    progressBar.setAttribute('aria-valuenow', count);

    const atMax = count >= 20;
    input.disabled = atMax;
    addBtn.disabled = atMax;
    if (atMax) {
        clearError();
        input.classList.remove('is-valid');
    }

    // Exportar: visible desde 10 números y si no fue usado
    if (count >= 10 && !exportBtn.dataset.used) {
        exportBtn.classList.remove('d-none');
    }

    // Limpiar: visible si hay al menos 1 número
    clearBtn.classList.toggle('d-none', count === 0);
}

/**
 * Genera el HTML de una tarjeta de número.
 * Incluye tres vistas: lectura, edición y confirmación de borrado individual.
 * @param {NumberEntry} entry
 * @param {number} i
 * @returns {string}
 */
function buildItemHTML(entry, i) {
    return `
        <div class="number-card h-100 p-3">

            <!-- ── Vista de Lectura ── -->
            <div class="d-flex justify-content-between align-items-center" id="view-${i}">
                <div class="d-flex align-items-center gap-2">
                    <span class="item-index">#${i + 1}</span>
                    <span class="item-value font-mono">${entry.value}</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="item-date">${entry.date}</span>
                    <div class="btn-group btn-group-sm">
                        <button
                            class="btn btn-outline-warning btn-item"
                            onclick="showEdit(${i})"
                            aria-label="Modificar número ${i + 1}"
                        >✏</button>
                        <button
                            class="btn btn-outline-danger btn-item"
                            onclick="showDeleteConfirm(${i})"
                            aria-label="Eliminar número ${i + 1}"
                        >✕</button>
                    </div>
                </div>
            </div>

            <!-- ── Vista de Edición ── -->
            <div class="d-none w-100" id="edit-container-${i}">
                <label class="form-label small fw-semibold mb-1">Editar #${i + 1}</label>
                <div class="input-group input-group-sm">
                    <input
                        type="number"
                        class="form-control font-mono edit-input"
                        id="edit-input-${i}"
                        value="${entry.value}"
                        step="1"
                        aria-label="Nuevo valor para el número ${i + 1}"
                    >
                    <button class="btn btn-success" onclick="saveEdit(${i})" aria-label="Guardar">✓</button>
                    <button class="btn btn-secondary" onclick="cancelEdit()" aria-label="Cancelar">✕</button>
                </div>
                <div class="edit-error-msg mt-1" id="edit-error-${i}"></div>
            </div>

            <!-- ── Vista de Confirmación de Borrado Individual ── -->
            <div class="d-none w-100" id="delete-confirm-${i}">
                <div class="delete-confirm-box">
                    <p class="delete-confirm-msg mb-2">
                        ¿Borrar <span class="font-mono fw-bold">${entry.value}</span>?
                    </p>
                    <div class="d-flex gap-2">
                        <button class="btn btn-danger btn-sm flex-grow-1 fw-bold" onclick="confirmDelete(${i})">Sí, borrar</button>
                        <button class="btn btn-secondary btn-sm flex-grow-1" onclick="cancelDelete(${i})">Cancelar</button>
                    </div>
                </div>
            </div>

        </div>
    `;
}

// ─── Acciones de Datos ────────────────────────────────────────────────────────

/** Agrega un nuevo número tras validación. */
function addNumber() {
    const raw = input.value;
    const err = getValidationError(raw);
    if (err) { showError(err); return; }

    numbers.push({ value: parseInt(raw, 10), date: getTodayStr() });
    input.value = '';
    clearError();
    input.classList.remove('is-valid');
    updateUI();
    input.focus();
}

addBtn.addEventListener('click', addNumber);

/**
 * Muestra el formulario de edición inline con validación en tiempo real.
 * @param {number} i
 */
window.showEdit = (i) => {
    document.getElementById(`view-${i}`).classList.add('d-none');
    document.getElementById(`edit-container-${i}`).classList.remove('d-none');

    const editInput = document.getElementById(`edit-input-${i}`);
    editInput.focus();

    editInput.addEventListener('input', () => {
        const raw    = editInput.value;
        const digits = extractDigits(raw);
        const errEl  = document.getElementById(`edit-error-${i}`);

        if (digits.length > MAX_DIGITS) {
            const isNeg = raw.startsWith('-');
            editInput.value = isNeg ? `-${digits.slice(0, MAX_DIGITS)}` : digits.slice(0, MAX_DIGITS);
        }

        if (editInput.value === '') {
            errEl.textContent = 'El campo no puede estar vacío.';
            editInput.classList.add('is-invalid');
        } else if (raw.includes('.') || raw.includes(',')) {
            errEl.textContent = 'Solo se permiten enteros.';
            editInput.classList.add('is-invalid');
        } else {
            errEl.textContent = '';
            editInput.classList.remove('is-invalid');
        }
    });
};

/** Cancela la edición en curso. */
window.cancelEdit = () => updateUI();

/**
 * Guarda el valor editado tras validación. Mantiene la fecha original.
 * @param {number} i
 */
window.saveEdit = (i) => {
    const editInput = document.getElementById(`edit-input-${i}`);
    const errorEl   = document.getElementById(`edit-error-${i}`);
    const raw = editInput.value;

    if (raw === '') {
        errorEl.textContent = 'El campo no puede estar vacío.';
        editInput.classList.add('is-invalid');
        return;
    }
    if (raw.includes('.') || raw.includes(',')) {
        errorEl.textContent = 'Solo se permiten enteros.';
        editInput.classList.add('is-invalid');
        return;
    }
    if (extractDigits(raw).length > MAX_DIGITS) {
        errorEl.textContent = `Máximo ${MAX_DIGITS} dígitos permitidos.`;
        editInput.classList.add('is-invalid');
        return;
    }
    if (!Number.isInteger(Number(raw))) {
        errorEl.textContent = 'Valor no válido.';
        editInput.classList.add('is-invalid');
        return;
    }

    numbers[i].value = parseInt(raw, 10);
    updateUI();
};

/**
 * Muestra la confirmación de borrado inline en la tarjeta i.
 * @param {number} i
 */
window.showDeleteConfirm = (i) => {
    document.getElementById(`view-${i}`).classList.add('d-none');
    document.getElementById(`delete-confirm-${i}`).classList.remove('d-none');
};

/**
 * Cancela el borrado individual y restaura la vista de lectura.
 * @param {number} i
 */
window.cancelDelete = (i) => {
    document.getElementById(`delete-confirm-${i}`).classList.add('d-none');
    document.getElementById(`view-${i}`).classList.remove('d-none');
};

/**
 * Confirma y ejecuta el borrado del ítem i.
 * @param {number} i
 */
window.confirmDelete = (i) => {
    numbers.splice(i, 1);
    if (numbers.length < 10 && !exportBtn.dataset.used) {
        exportBtn.classList.add('d-none');
    }
    updateUI();
};

// ─── Limpiar Todos ────────────────────────────────────────────────────────────

/**
 * Muestra una confirmación inline debajo del botón antes de limpiar.
 * Una vez confirmado, vacía el arreglo y resetea toda la UI.
 */
clearBtn.addEventListener('click', () => {
    // Evitar duplicar la caja de confirmación
    if (document.getElementById('clear-confirm')) return;

    const confirmBox = document.createElement('div');
    confirmBox.id        = 'clear-confirm';
    confirmBox.className = 'clear-confirm-box mt-2';
    confirmBox.innerHTML = `
        <p class="clear-confirm-msg mb-2">
            ¿Borrar los <strong>${numbers.length}</strong> número${numbers.length !== 1 ? 's' : ''}?
        </p>
        <div class="d-flex gap-2">
            <button class="btn btn-danger btn-sm flex-grow-1 fw-bold" id="clear-yes">Sí, limpiar</button>
            <button class="btn btn-secondary btn-sm flex-grow-1" id="clear-no">Cancelar</button>
        </div>
    `;

    clearBtn.insertAdjacentElement('afterend', confirmBox);

    document.getElementById('clear-yes').addEventListener('click', () => {
        numbers = [];
        exportBtn.dataset.used = '';
        exportBtn.classList.add('d-none');
        confirmBox.remove();
        updateUI();
        input.focus();
    });

    document.getElementById('clear-no').addEventListener('click', () => {
        confirmBox.remove();
    });
});

// ─── Exportación .TXT ─────────────────────────────────────────────────────────

/**
 * Genera y descarga el archivo .txt con nombre numeros_DD-MM-AAAA.txt.
 * Se oculta permanentemente tras el primer uso.
 */
/**
 * Reemplazá SOLO el bloque de exportación actual por este.
 * Hace ambas cosas:
 * 1. Guarda en /descargados del servidor
 * 2. Descarga el archivo al usuario
 */

exportBtn.addEventListener('click', async () => {
    const content = numbers.map(e => e.value).join(',');

    // Nombre del archivo con fecha actual
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const aaaa = now.getFullYear();

    const fileName = `numeros_${dd}-${mm}-${aaaa}.txt`;

    // ─── Guardar en servidor ─────────────────────────────

    try {
        const response = await fetch('/guardar-archivo', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: fileName,
                contenido: content
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al guardar archivo');
        }

        console.log(data.mensaje);

    } catch (error) {
        console.error('Error:', error);
        alert('No se pudo guardar el archivo en el servidor.');
        return;
    }

    // ─── Descargar al usuario ────────────────────────────

    const blob = new Blob([content], {
        type: 'text/plain'
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;

    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

   // URL.revokeObjectURL(url);

    // ─── Ocultar botón luego de exportar ─────────────────

    //exportBtn.dataset.used = 'true';
   // exportBtn.classList.add('d-none');
});

// ─── Tema Oscuro / Claro ──────────────────────────────────────────────────────

toggleTheme.addEventListener('click', () => {
    const isDark = themeLink.href.includes('dark');
    themeLink.href = isDark ? '../styles/light.css' : '../styles/dark.css';
    themeIcon.textContent = isDark ? '☀️' : '🌙';
    document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
});

// ─── Botón Scroll al Tope ─────────────────────────────────────────────────────

window.addEventListener('scroll', () => {
    scrollBtn.classList.toggle('d-none', window.scrollY < 300);
});

scrollBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ─── Inicialización ───────────────────────────────────────────────────────────

updateUI();