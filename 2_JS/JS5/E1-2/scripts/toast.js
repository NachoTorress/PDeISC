/**
 * toast.js
 * Muestra notificaciones flotantes en vez de usar alert().
 * De dónde viene: se llama desde main.js tras cada operación de la API.
 * A dónde va: inyecta un div en #toast-container y lo remueve solo.
 */

/**
 * @param {string} mensaje
 * @param {'success'|'error'} tipo
 */
export function mostrarToast(mensaje, tipo = 'success') {
  const contenedor = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast-custom toast-${tipo}`;
  toast.textContent = mensaje;
  contenedor.appendChild(toast);

  setTimeout(() => toast.remove(), 3500);
}
