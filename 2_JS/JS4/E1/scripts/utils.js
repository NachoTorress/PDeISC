/**
 * scripts/utils.js
 * Utilidades compartidas: toast, spinner, renderizado en terminal, validaciones.
 * Entrada: llamadas desde los módulos de ejercicios
 * Salida: efectos en el DOM o valores booleanos de validación
 */

// ─────────────────────── TOAST ───────────────────────
let toastTimer = null;

/**
 * Muestra un toast de notificación.
 * @param {string} message - Texto a mostrar
 * @param {"success"|"error"|"info"} type
 * @param {number} [duration=2500] - Duración en ms
 */
export function showToast(message, type = "info", duration = 2500) {
  const toast = document.getElementById("appToast");
  const msg = document.getElementById("toastMsg");

  if (toastTimer) clearTimeout(toastTimer);

  toast.className = `app-toast show toast-${type}`;
  msg.textContent = message;

  toastTimer = setTimeout(() => {
    toast.className = "app-toast";
  }, duration);
}

// ─────────────────────── TERMINAL ───────────────────────
/**
 * Muestra un spinner de carga en un elemento terminal.
 * @param {string} terminalId - ID del elemento
 */
export function showLoading(terminalId) {
  const el = document.getElementById(terminalId);
  if (!el) return;
  el.innerHTML = `<span class="spinner"></span> <span style="color:var(--text-muted)">Cargando...</span>`;
}

/**
 * Muestra un mensaje de error en rojo dentro de un terminal.
 * @param {string} terminalId
 * @param {string} message
 */
export function showTerminalError(terminalId, message) {
  const el = document.getElementById(terminalId);
  if (!el) return;
  el.innerHTML = `<span style="color:var(--error)"><i class="bi bi-exclamation-triangle-fill"></i> ${escapeHtml(message)}</span>`;
}

/**
 * Renderiza una lista de usuarios en el terminal (ejercicios 1 y 3).
 * @param {string} terminalId
 * @param {Array<{name:string, email:string}>} users
 * @param {string} [highlight=""] - Texto a resaltar en los nombres
 */
export function renderUserList(terminalId, users, highlight = "") {
  const el = document.getElementById(terminalId);
  if (!el) return;

  if (!users.length) {
    el.innerHTML = `<span class="terminal-placeholder">// Sin resultados para "${escapeHtml(highlight)}"</span>`;
    return;
  }

  el.innerHTML = users
    .map((u) => {
      const name = highlight
        ? highlightMatch(escapeHtml(u.name), highlight)
        : escapeHtml(u.name);
      return `
        <div class="user-entry">
          <span class="user-name">${name}</span>
          <span class="user-email">${escapeHtml(u.email)}</span>
        </div>`;
    })
    .join("");
}

/**
 * Renderiza el ID de respuesta de un POST en el terminal (ejercicio 2).
 * @param {string} terminalId
 * @param {number|string} id
 * @param {"fetch"|"axios"} method
 */
export function renderPostResponse(terminalId, id, method) {
  const el = document.getElementById(terminalId);
  if (!el) return;
  el.innerHTML = `
    <div>
      <div class="response-label">// Respuesta via ${method}</div>
      <div class="response-id">ID: ${escapeHtml(String(id))}</div>
      <div style="color:var(--text-secondary);margin-top:4px;font-size:0.75rem">
        El recurso fue creado correctamente en la API remota.
      </div>
    </div>`;
}

// ─────────────────────── VALIDACIÓN ───────────────────────
/**
 * Valida un campo de nombre (solo letras, apóstrofes y espacios).
 * @param {string} value
 * @returns {string|null} Mensaje de error o null si es válido
 */
export function validateNombre(value) {
  if (!value.trim()) return "El nombre es obligatorio.";
  if (/\d/.test(value)) return "El nombre no puede contener números.";
  if (/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']/.test(value))
    return "Solo se permiten letras, espacios y apóstrofes.";
  if (value.trim().length < 2) return "El nombre debe tener al menos 2 caracteres.";
  return null;
}

/**
 * Valida un campo de email.
 * @param {string} value
 * @returns {string|null} Mensaje de error o null si es válido
 */
export function validateEmail(value) {
  if (!value.trim()) return "El email es obligatorio.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
    return "Ingresá un email con formato válido (ej: juan@mail.com).";
  return null;
}

/**
 * Valida un campo de texto genérico (no vacío).
 * @param {string} value
 * @param {string} [fieldLabel="Este campo"]
 * @returns {string|null}
 */
export function validateRequired(value, fieldLabel = "Este campo") {
  if (!value.trim()) return `${fieldLabel} es obligatorio.`;
  if (value.trim().length < 2) return `${fieldLabel} debe tener al menos 2 caracteres.`;
  return null;
}

/**
 * Aplica o limpia el estado de error en un input.
 * @param {HTMLElement} input
 * @param {HTMLElement} errorEl
 * @param {string|null} message - null para limpiar el error
 */
export function setFieldError(input, errorEl, message) {
  if (message) {
    input.classList.add("input-error");
    errorEl.textContent = message;
  } else {
    input.classList.remove("input-error");
    errorEl.textContent = "";
  }
}

// ─────────────────────── HELPERS ───────────────────────
/**
 * Escapa HTML para evitar XSS al insertar texto en innerHTML.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Resalta una subcadena dentro de un texto ya escapado.
 * @param {string} text - Texto ya escapado con escapeHtml
 * @param {string} match - Subcadena a resaltar (insensible a mayúsculas)
 * @returns {string}
 */
function highlightMatch(text, match) {
  if (!match) return text;
  const regex = new RegExp(`(${match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  return text.replace(regex, `<mark style="background:rgba(0,255,135,0.25);color:inherit;border-radius:2px">$1</mark>`);
}