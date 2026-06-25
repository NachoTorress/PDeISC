/**
 * scripts/ejercicio1.js
 * Ejercicio 1: GET de usuarios desde jsonplaceholder.
 * Dos implementaciones: fetch nativo y axios.
 * Entrada: clic en botones #ex1-fetch-btn y #ex1-axios-btn
 * Salida: lista de nombre/email renderizada en los terminales correspondientes
 */

import { showLoading, showTerminalError, renderUserList, showToast } from "./utils.js";

const API_URL = "https://jsonplaceholder.typicode.com/users";

// ─────────────────────── FETCH ───────────────────────
/**
 * Obtiene los usuarios usando fetch nativo y los renderiza.
 * El botón se oculta una vez ejecutado con éxito (único uso).
 */
async function getUsersWithFetch() {
  const btn = document.getElementById("ex1-fetch-btn");
  showLoading("ex1-fetch-output");
  btn.disabled = true;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
    }

    const users = await response.json();
    renderUserList("ex1-fetch-output", users);
    showToast("✓ Fetch: usuarios cargados correctamente", "success");

    // Ocultar botón tras uso único exitoso
    btn.style.display = "none";
  } catch (err) {
    showTerminalError("ex1-fetch-output", `Fetch falló: ${err.message}`);
    showToast("Error al cargar con Fetch", "error");
    btn.disabled = false;
  }
}

// ─────────────────────── AXIOS ───────────────────────
/**
 * Obtiene los usuarios usando axios y los renderiza.
 * El botón se oculta una vez ejecutado con éxito (único uso).
 */
async function getUsersWithAxios() {
  const btn = document.getElementById("ex1-axios-btn");
  showLoading("ex1-axios-output");
  btn.disabled = true;

  try {
    const response = await axios.get(API_URL);
    const users = response.data;

    renderUserList("ex1-axios-output", users);
    showToast("✓ Axios: usuarios cargados correctamente", "success");

    // Ocultar botón tras uso único exitoso
    btn.style.display = "none";
  } catch (err) {
    const msg = err.response
      ? `Error HTTP ${err.response.status}`
      : err.message;
    showTerminalError("ex1-axios-output", `Axios falló: ${msg}`);
    showToast("Error al cargar con Axios", "error");
    btn.disabled = false;
  }
}

// ─────────────────────── INIT ───────────────────────
/**
 * Registra los listeners del ejercicio 1.
 * Llamado desde main.js al iniciar la aplicación.
 */
export function initEjercicio1() {
  document.getElementById("ex1-fetch-btn").addEventListener("click", getUsersWithFetch);
  document.getElementById("ex1-axios-btn").addEventListener("click", getUsersWithAxios);
}