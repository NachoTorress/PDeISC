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

/**
 * Formatea una fecha con hora al formato DD/MM/AA HH:MM, usado en los
 * logs de descargas y de logins del panel de administracion.
 * @param {Date|string} fecha
 * @returns {string} fecha formateada, ej: "02/07/26 14:35"
 */
export function formatearFechaHora(fecha) {
    const d = new Date(fecha);
    const horas = String(d.getHours()).padStart(2, '0');
    const minutos = String(d.getMinutes()).padStart(2, '0');
    return `${formatearFecha(d)} ${horas}:${minutos}`;
}
