/**
 * scripts/ejercicio3.js
 * Ejercicio 3: Obtener todos los usuarios y filtrar por nombre en tiempo real.
 * Primero se carga la lista completa (fetch o axios), luego se habilita el input
 * de búsqueda que filtra el array en memoria sin hacer nuevas peticiones.
 * Entrada: botones #ex3-fetch-load / #ex3-axios-load, inputs #ex3f-search / #ex3a-search
 * Salida: lista filtrada renderizada en #ex3-fetch-output / #ex3-axios-output
 */

import { showLoading, showTerminalError, renderUserList, showToast } from "./utils.js";

const API_URL = "https://jsonplaceholder.typicode.com/users";

// Arrays en memoria para filtrar sin re-fetching
let usuariosFetch = [];
let usuariosAxios = [];

// ─────────────────────── RENDERIZADO FILTRADO ───────────────────────
/**
 * Filtra el array de usuarios por nombre y renderiza el resultado.
 * @param {string} outputId - ID del terminal de salida
 * @param {Array} usuarios - Array completo de usuarios
 * @param {string} query - Texto de búsqueda
 */
function renderFiltered(outputId, usuarios, query) {
  const q = query.trim().toLowerCase();
  const filtrados = q
    ? usuarios.filter((u) => u.name.toLowerCase().includes(q))
    : usuarios;

  if (!filtrados.length) {
    document.getElementById(outputId).innerHTML =
      `<span style="color:var(--text-muted)">// Sin resultados para "${query}"</span>`;
    return;
  }

  renderUserList(outputId, filtrados);
}

// ─────────────────────── FETCH ───────────────────────
/**
 * Carga los usuarios con fetch y habilita el campo de búsqueda.
 */
async function loadUsersWithFetch() {
  const btn = document.getElementById("ex3-fetch-load");
  const searchInput = document.getElementById("ex3f-search");
  showLoading("ex3-fetch-output");
  btn.disabled = true;

  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    usuariosFetch = await res.json();

    renderUserList("ex3-fetch-output", usuariosFetch);
    searchInput.disabled = false;
    searchInput.focus();
    showToast("✓ Usuarios cargados — podés buscar por nombre", "success");
    btn.style.display = "none";
  } catch (err) {
    showTerminalError("ex3-fetch-output", `Fetch falló: ${err.message}`);
    showToast("Error al cargar usuarios", "error");
    btn.disabled = false;
  }
}

// ─────────────────────── AXIOS ───────────────────────
/**
 * Carga los usuarios con axios y habilita el campo de búsqueda.
 */
async function loadUsersWithAxios() {
  const btn = document.getElementById("ex3-axios-load");
  const searchInput = document.getElementById("ex3a-search");
  showLoading("ex3-axios-output");
  btn.disabled = true;

  try {
    const { data } = await axios.get(API_URL);
    usuariosAxios = data;

    renderUserList("ex3-axios-output", usuariosAxios);
    searchInput.disabled = false;
    searchInput.focus();
    showToast("✓ Usuarios cargados — podés buscar por nombre", "success");
    btn.style.display = "none";
  } catch (err) {
    const msg = err.response ? `HTTP ${err.response.status}` : err.message;
    showTerminalError("ex3-axios-output", `Axios falló: ${msg}`);
    showToast("Error al cargar usuarios", "error");
    btn.disabled = false;
  }
}

// ─────────────────────── INIT ───────────────────────
/**
 * Registra los listeners del ejercicio 3.
 * Llamado desde main.js al iniciar la aplicación.
 */
export function initEjercicio3() {
  document.getElementById("ex3-fetch-load").addEventListener("click", loadUsersWithFetch);
  document.getElementById("ex3-axios-load").addEventListener("click", loadUsersWithAxios);

  // Filtrar en tiempo real al escribir
  document.getElementById("ex3f-search").addEventListener("input", (e) => {
    renderFiltered("ex3-fetch-output", usuariosFetch, e.target.value);
  });

  document.getElementById("ex3a-search").addEventListener("input", (e) => {
    renderFiltered("ex3-axios-output", usuariosAxios, e.target.value);
  });
}
