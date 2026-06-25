/**
 * scripts/ejercicio2.js
 * Ejercicio 2: POST de nombre y email a jsonplaceholder, muestra el ID de respuesta.
 * Validación en tiempo real de cada campo.
 * Entrada: campos #ex2f-nombre/#ex2f-email (fetch) y #ex2a-nombre/#ex2a-email (axios)
 * Salida: ID devuelto por la API en los terminales correspondientes
 */

import {
  validateNombre,
  validateEmail,
  setFieldError,
  renderPostResponse,
  showTerminalError,
  showToast,
} from "./utils.js";

const POST_URL = "https://jsonplaceholder.typicode.com/posts";

// ─────────────────────── VALIDACIÓN TIEMPO REAL ───────────────────────
/**
 * Registra validación en tiempo real (oninput) en un par input/error.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} errorEl
 * @param {Function} validatorFn - Función que retorna string|null
 */
function attachRealTimeValidation(input, errorEl, validatorFn) {
  input.addEventListener("input", () => {
    const error = validatorFn(input.value);
    setFieldError(input, errorEl, error);
  });

  // También validar al salir del campo
  input.addEventListener("blur", () => {
    const error = validatorFn(input.value);
    setFieldError(input, errorEl, error);
  });
}

// ─────────────────────── VALIDAR FORMULARIO ───────────────────────
/**
 * Valida los campos de un formulario de ejercicio 2.
 * @param {{nombreEl:HTMLElement, emailEl:HTMLElement, nombreErrEl:HTMLElement, emailErrEl:HTMLElement}} fields
 * @returns {boolean} true si el formulario es válido
 */
function validateForm({ nombreEl, emailEl, nombreErrEl, emailErrEl }) {
  const nombreError = validateNombre(nombreEl.value);
  const emailError = validateEmail(emailEl.value);

  setFieldError(nombreEl, nombreErrEl, nombreError);
  setFieldError(emailEl, emailErrEl, emailError);

  return !nombreError && !emailError;
}

// ─────────────────────── FETCH ───────────────────────
/**
 * Envía nombre y email a la API usando fetch con método POST.
 * Muestra el ID de la respuesta en el terminal.
 */
async function postWithFetch() {
  const nombreEl = document.getElementById("ex2f-nombre");
  const emailEl = document.getElementById("ex2f-email");
  const nombreErrEl = document.getElementById("ex2f-nombre-err");
  const emailErrEl = document.getElementById("ex2f-email-err");
  const btn = document.getElementById("ex2-fetch-btn");
  const outputId = "ex2-fetch-output";

  if (!validateForm({ nombreEl, emailEl, nombreErrEl, emailErrEl })) return;

  btn.disabled = true;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> Enviando...`;

  try {
    const response = await fetch(POST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: nombreEl.value.trim(),
        email: emailEl.value.trim(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }

    const data = await response.json();
    renderPostResponse(outputId, data.id, "fetch");
    showToast(`✓ Fetch POST exitoso — ID: ${data.id}`, "success");

    // Limpiar campos
    nombreEl.value = "";
    emailEl.value = "";
  } catch (err) {
    showTerminalError(outputId, `Fetch POST falló: ${err.message}`);
    showToast("Error al enviar con Fetch", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}

// ─────────────────────── AXIOS ───────────────────────
/**
 * Envía nombre y email a la API usando axios.post().
 * Muestra el ID de la respuesta en el terminal.
 */
async function postWithAxios() {
  const nombreEl = document.getElementById("ex2a-nombre");
  const emailEl = document.getElementById("ex2a-email");
  const nombreErrEl = document.getElementById("ex2a-nombre-err");
  const emailErrEl = document.getElementById("ex2a-email-err");
  const btn = document.getElementById("ex2-axios-btn");
  const outputId = "ex2-axios-output";

  if (!validateForm({ nombreEl, emailEl, nombreErrEl, emailErrEl })) return;

  btn.disabled = true;
  const originalHTML = btn.innerHTML;
  btn.innerHTML = `<span class="spinner"></span> Enviando...`;

  try {
    const { data } = await axios.post(POST_URL, {
      nombre: nombreEl.value.trim(),
      email: emailEl.value.trim(),
    });

    renderPostResponse(outputId, data.id, "axios");
    showToast(`✓ Axios POST exitoso — ID: ${data.id}`, "success");

    nombreEl.value = "";
    emailEl.value = "";
  } catch (err) {
    const msg = err.response
      ? `Error HTTP ${err.response.status}`
      : err.message;
    showTerminalError(outputId, `Axios POST falló: ${msg}`);
    showToast("Error al enviar con Axios", "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHTML;
  }
}

// ─────────────────────── INIT ───────────────────────
/**
 * Registra validaciones en tiempo real y listeners de submit.
 * Llamado desde main.js.
 */
export function initEjercicio2() {
  // Validación en tiempo real — Fetch
  attachRealTimeValidation(
    document.getElementById("ex2f-nombre"),
    document.getElementById("ex2f-nombre-err"),
    validateNombre
  );
  attachRealTimeValidation(
    document.getElementById("ex2f-email"),
    document.getElementById("ex2f-email-err"),
    validateEmail
  );

  // Validación en tiempo real — Axios
  attachRealTimeValidation(
    document.getElementById("ex2a-nombre"),
    document.getElementById("ex2a-nombre-err"),
    validateNombre
  );
  attachRealTimeValidation(
    document.getElementById("ex2a-email"),
    document.getElementById("ex2a-email-err"),
    validateEmail
  );

  document.getElementById("ex2-fetch-btn").addEventListener("click", postWithFetch);
  document.getElementById("ex2-axios-btn").addEventListener("click", postWithAxios);
}