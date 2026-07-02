/**
 * theme.js
 * Alterna entre las hojas de estilo light.css y dark.css.
 * De dónde viene: se invoca desde main.js al hacer click en #theme-toggle.
 * A dónde va: modifica el href de #theme-link y guarda la preferencia en localStorage.
 */

const LINK_ID = 'theme-link';
const ICON_ID = 'theme-icon';
const STORAGE_KEY = 'alumnos-theme';

function aplicarTema(tema) {
  const link = document.getElementById(LINK_ID);
  const icono = document.getElementById(ICON_ID);
  link.href = tema === 'dark' ? '/styles/dark.css' : '/styles/light.css';
  icono.textContent = tema === 'dark' ? '☀️' : '🌙';
  localStorage.setItem(STORAGE_KEY, tema);
}

/** Aplica el tema guardado (o claro por defecto) al cargar la página. */
export function inicializarTema() {
  const guardado = localStorage.getItem(STORAGE_KEY) || 'light';
  aplicarTema(guardado);
}

/** Invierte el tema actual. */
export function alternarTema() {
  const actual = localStorage.getItem(STORAGE_KEY) || 'light';
  aplicarTema(actual === 'light' ? 'dark' : 'light');
}
