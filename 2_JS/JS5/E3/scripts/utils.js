/**
 * utils.js
 * Funciones utilitarias compartidas por el resto de los módulos del front-end.
 */

/**
 * Formatea una fecha ISO a DD/MM/AA.
 * @param {string} fechaIso
 * @returns {string}
 */
export function formatearFecha(fechaIso) {
  const fecha = new Date(fechaIso);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const anio = String(fecha.getFullYear()).slice(-2);
  return `${dia}/${mes}/${anio}`;
}
