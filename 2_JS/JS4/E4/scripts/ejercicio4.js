/**
 * scripts/ejercicio4.js
 * Ejercicio 4: CRUD completo contra la API local /api/alumnos.
 * Ambas versiones (fetch y axios) comparten el mismo formulario de alta.
 * Entrada: campos de formulario, botones agregar/editar/borrar
 * Salida: listas de alumnos renderizadas en #al-fetch-list y #al-axios-list
 */

import {
  validateNombre,
  validateEmail,
  validateRequired,
  setFieldError,
  showToast,
  escapeHtml,
} from "./utils.js";

const API_BASE = "/api/alumnos";

// ─────────────────────── RENDERIZADO ───────────────────────
/**
 * Renderiza la lista de alumnos en un contenedor dado.
 * @param {string} containerId - ID del contenedor
 * @param {Array} alumnos - Array de objetos alumno
 * @param {"fetch"|"axios"} method - Método HTTP usado para los botones de acción
 */
function renderAlumnos(containerId, alumnos, method) {
  const container = document.getElementById(containerId);
  if (!alumnos.length) {
    container.innerHTML = `<span class="terminal-placeholder">// Sin alumnos registrados.</span>`;
    return;
  }

  container.innerHTML = alumnos
    .map(
      (a) => `
      <div class="alumno-card" data-id="${a.id}">
        <div class="alumno-info">
          <div class="alumno-nombre">${escapeHtml(a.nombre)}</div>
          <div class="alumno-email">${escapeHtml(a.email)}</div>
          <div class="alumno-materia"><i class="bi bi-journal-code me-1"></i>${escapeHtml(a.materia)}</div>
          <div class="alumno-date"><i class="bi bi-calendar3 me-1"></i>${escapeHtml(a.createdAt)}</div>
        </div>
        <div class="alumno-actions">
          <button class="btn-icon edit" title="Editar"
            data-id="${a.id}" data-nombre="${escapeHtml(a.nombre)}"
            data-email="${escapeHtml(a.email)}" data-materia="${escapeHtml(a.materia)}"
            data-method="${method}">
            <i class="bi bi-pencil-fill"></i>
          </button>
          <button class="btn-icon delete" title="Eliminar"
            data-id="${a.id}" data-method="${method}">
            <i class="bi bi-trash3-fill"></i>
          </button>
        </div>
      </div>`
    )
    .join("");

  // Registrar listeners de edición y borrado en los botones recién renderizados
  container.querySelectorAll(".btn-icon.edit").forEach((btn) => {
    btn.addEventListener("click", () => openEditModal(btn));
  });
  
  // Registrar listeners de borrado (con confirmación intermedia)
  container.querySelectorAll(".btn-icon.delete").forEach((btn) => {
    btn.addEventListener("click", () => handleConfirmDelete(btn));
  });
}

// ─────────────────────── MANEJADOR DE BORRADO ───────────────────────
/**
 * Intercepta el clic de borrado para pedir confirmación antes de proceder.
 */
function handleConfirmDelete(btn) {
  const nombre = btn.closest('.alumno-card').querySelector('.alumno-nombre').textContent;
  const isConfirmed = confirm(`¿Estás seguro de que quieres eliminar a "${nombre}"?`);
  
  if (isConfirmed) {
    deleteAlumno(btn.dataset.id, btn.dataset.method);
  }
}

// ─────────────────────── GET ───────────────────────
/**
 * Carga la lista de alumnos usando fetch.
 */
async function loadAlumnosFetch() {
  const container = document.getElementById("al-fetch-list");
  container.innerHTML = `<span class="terminal-placeholder">// Cargando...</span>`;

  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const alumnos = await res.json();
    renderAlumnos("al-fetch-list", alumnos, "fetch");
  } catch (err) {
    container.innerHTML = `<span style="color:var(--error)">Error: ${escapeHtml(err.message)}</span>`;
  }
}

/**
 * Carga la lista de alumnos usando axios.
 */
async function loadAlumnosAxios() {
  const container = document.getElementById("al-axios-list");
  container.innerHTML = `<span class="terminal-placeholder">// Cargando...</span>`;

  try {
    const { data } = await axios.get(API_BASE);
    renderAlumnos("al-axios-list", data, "axios");
  } catch (err) {
    const msg = err.response?.data?.error || err.message;
    container.innerHTML = `<span style="color:var(--error)">Error: ${escapeHtml(msg)}</span>`;
  }
}

/**
 * Recarga ambas listas simultáneamente.
 */
function reloadBothLists() {
  loadAlumnosFetch();
  loadAlumnosAxios();
}

// ─────────────────────── VALIDACIÓN FORMULARIO ALTA ───────────────────────
/**
 * Valida los campos del formulario de alta de alumno.
 * @returns {boolean}
 */
function validateAddForm() {
  const nombre = document.getElementById("al-nombre");
  const email = document.getElementById("al-email");
  const materia = document.getElementById("al-materia");

  const errNombre = validateNombre(nombre.value);
  const errEmail = validateEmail(email.value);
  const errMateria = validateRequired(materia.value, "La materia");

  setFieldError(nombre, document.getElementById("al-nombre-err"), errNombre);
  setFieldError(email, document.getElementById("al-email-err"), errEmail);
  setFieldError(materia, document.getElementById("al-materia-err"), errMateria);

  return !errNombre && !errEmail && !errMateria;
}

/**
 * Registra validación en tiempo real en los campos del formulario de alta.
 */
function initAddFormValidation() {
  const pairs = [
    { id: "al-nombre", errId: "al-nombre-err", fn: validateNombre },
    { id: "al-email", errId: "al-email-err", fn: validateEmail },
    { id: "al-materia", errId: "al-materia-err", fn: (v) => validateRequired(v, "La materia") },
  ];

  pairs.forEach(({ id, errId, fn }) => {
    const input = document.getElementById(id);
    const errEl = document.getElementById(errId);
    input.addEventListener("input", () => setFieldError(input, errEl, fn(input.value)));
    input.addEventListener("blur", () => setFieldError(input, errEl, fn(input.value)));
  });
}

/**
 * Lee y limpia los campos del formulario de alta.
 * @returns {{nombre:string, email:string, materia:string}}
 */
function getAndClearAddForm() {
  const nombre = document.getElementById("al-nombre");
  const email = document.getElementById("al-email");
  const materia = document.getElementById("al-materia");
  const data = {
    nombre: nombre.value.trim(),
    email: email.value.trim(),
    materia: materia.value.trim(),
  };
  nombre.value = "";
  email.value = "";
  materia.value = "";
  return data;
}

// ─────────────────────── POST ───────────────────────
/**
 * Agrega un alumno con fetch.
 */
async function addAlumnoFetch() {
  if (!validateAddForm()) return;
  const body = getAndClearAddForm();
  const btn = document.getElementById("al-fetch-add");
  btn.disabled = true;

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    showToast("✓ Alumno agregado con Fetch", "success");
    reloadBothLists();
  } catch (err) {
    showToast(`Error Fetch: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
  }
}

/**
 * Agrega un alumno con axios.
 */
async function addAlumnoAxios() {
  if (!validateAddForm()) return;
  const body = getAndClearAddForm();
  const btn = document.getElementById("al-axios-add");
  btn.disabled = true;

  try {
    await axios.post(API_BASE, body);
    showToast("✓ Alumno agregado con Axios", "success");
    reloadBothLists();
  } catch (err) {
    const msg = err.response?.data?.error || err.message;
    showToast(`Error Axios: ${msg}`, "error");
  } finally {
    btn.disabled = false;
  }
}

// ─────────────────────── DELETE ───────────────────────
/**
 * Elimina un alumno por ID.
 * @param {string|number} id
 * @param {"fetch"|"axios"} method
 */
async function deleteAlumno(id, method) {
  try {
    if (method === "fetch") {
      const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } else {
      await axios.delete(`${API_BASE}/${id}`);
    }
    showToast(`✓ Alumno eliminado (${method})`, "success");
    reloadBothLists();
  } catch (err) {
    const msg = err.response?.data?.error || err.message;
    showToast(`Error al eliminar: ${msg}`, "error");
  }
}

// ─────────────────────── MODAL EDICIÓN ───────────────────────
/**
 * Abre el modal de edición poblando los campos con los datos del alumno.
 * @param {HTMLElement} btn - Botón de editar con data-attributes
 */
function openEditModal(btn) {
  document.getElementById("edit-id").value = btn.dataset.id;
  document.getElementById("edit-method").value = btn.dataset.method;
  document.getElementById("edit-nombre").value = btn.dataset.nombre;
  document.getElementById("edit-email").value = btn.dataset.email;
  document.getElementById("edit-materia").value = btn.dataset.materia;

  // Limpiar errores previos
  ["edit-nombre", "edit-email", "edit-materia"].forEach((id) => {
    document.getElementById(id).classList.remove("input-error");
  });
  ["edit-nombre-err", "edit-email-err", "edit-materia-err"].forEach((id) => {
    document.getElementById(id).textContent = "";
  });

  const modal = new bootstrap.Modal(document.getElementById("editModal"));
  modal.show();
}

/**
 * Valida los campos del modal de edición.
 * @returns {boolean}
 */
function validateEditForm() {
  const nombre = document.getElementById("edit-nombre");
  const email = document.getElementById("edit-email");
  const materia = document.getElementById("edit-materia");

  const errNombre = validateNombre(nombre.value);
  const errEmail = validateEmail(email.value);
  const errMateria = validateRequired(materia.value, "La materia");

  setFieldError(nombre, document.getElementById("edit-nombre-err"), errNombre);
  setFieldError(email, document.getElementById("edit-email-err"), errEmail);
  setFieldError(materia, document.getElementById("edit-materia-err"), errMateria);

  return !errNombre && !errEmail && !errMateria;
}

/**
 * Guarda los cambios del modal de edición con el método correspondiente.
 */
async function saveEdit() {
  if (!validateEditForm()) return;

  const id = document.getElementById("edit-id").value;
  const method = document.getElementById("edit-method").value;
  const body = {
    nombre: document.getElementById("edit-nombre").value.trim(),
    email: document.getElementById("edit-email").value.trim(),
    materia: document.getElementById("edit-materia").value.trim(),
  };

  const btn = document.getElementById("edit-save-btn");
  btn.disabled = true;

  try {
    if (method === "fetch") {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
    } else {
      await axios.put(`${API_BASE}/${id}`, body);
    }

    bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
    showToast(`✓ Alumno actualizado (${method})`, "success");
    reloadBothLists();
  } catch (err) {
    const msg = err.response?.data?.error || err.message;
    showToast(`Error al editar: ${msg}`, "error");
  } finally {
    btn.disabled = false;
  }
}

/**
 * Registra validación en tiempo real en los campos del modal de edición.
 */
function initEditModalValidation() {
  const pairs = [
    { id: "edit-nombre", errId: "edit-nombre-err", fn: validateNombre },
    { id: "edit-email", errId: "edit-email-err", fn: validateEmail },
    { id: "edit-materia", errId: "edit-materia-err", fn: (v) => validateRequired(v, "La materia") },
  ];

  pairs.forEach(({ id, errId, fn }) => {
    const input = document.getElementById(id);
    const errEl = document.getElementById(errId);
    input.addEventListener("input", () => setFieldError(input, errEl, fn(input.value)));
    input.addEventListener("blur", () => setFieldError(input, errEl, fn(input.value)));
  });
}

// ─────────────────────── INIT ───────────────────────
/**
 * Inicializa el ejercicio 4: carga inicial, listeners y validaciones.
 * Llamado desde main.js.
 */
export function initEjercicio4() {
  // Carga inicial de ambas listas
  loadAlumnosFetch();
  loadAlumnosAxios();

  // Botones de actualizar
  document.getElementById("al-fetch-load").addEventListener("click", loadAlumnosFetch);
  document.getElementById("al-axios-load").addEventListener("click", loadAlumnosAxios);

  // Botones de agregar
  document.getElementById("al-fetch-add").addEventListener("click", addAlumnoFetch);
  document.getElementById("al-axios-add").addEventListener("click", addAlumnoAxios);

  // Guardar edición
  document.getElementById("edit-save-btn").addEventListener("click", saveEdit);

  // Validaciones en tiempo real
  initAddFormValidation();
  initEditModalValidation();
}