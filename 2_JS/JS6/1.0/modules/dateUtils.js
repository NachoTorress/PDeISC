/**
 * modules/dateUtils.js
 * -------------------------------------------------------
 * De donde viene: recibe objetos Date (de MySQL o del propio
 *                  servidor).
 * A donde va:     lo usan modules/pdfService.js y las rutas
 *                  que devuelven fechas ya formateadas al front.
 * Que hace:       formatea una fecha al formato DD/MM/AA
 *                  pedido en la consigna.
 * -------------------------------------------------------
 */

/**
 * Formatea una fecha al formato DD/MM/AA.
 * @param {Date|string} fecha
 * @returns {string} fecha formateada, ej: "02/07/26"
 */
export function formatearFecha(fecha) {
    const d = new Date(fecha);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const anio = String(d.getFullYear()).slice(-2);
    return `${dia}/${mes}/${anio}`;
}
