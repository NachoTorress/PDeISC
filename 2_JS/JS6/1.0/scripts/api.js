/**
 * scripts/api.js
 * -------------------------------------------------------
 * De donde viene: lo usan scripts/main.js, scripts/leaderboard.js
 *                  y scripts/hangmanGame.js cada vez que necesitan
 *                  hablar con el servidor.
 * A donde va:     hace fetch() contra las rutas expuestas en
 *                  server.js (montadas en /api).
 * Que hace:       centraliza todas las llamadas HTTP para no
 *                  repetir codigo de fetch en todos lados.
 * -------------------------------------------------------
 */

const BASE_URL = '/api';

/**
 * Pide al backend una palabra nueva para jugar.
 * @returns {Promise<{palabra: string, categoria: string, pista: string}>}
 */
export async function pedirPalabra() {
    const respuesta = await fetch(`${BASE_URL}/palabra`);
    if (!respuesta.ok) throw new Error('No se pudo obtener la palabra.');
    return respuesta.json();
}

/**
 * Trae la tabla de posiciones completa.
 * @returns {Promise<Array>}
 */
export async function obtenerTablaPosiciones() {
    const respuesta = await fetch(`${BASE_URL}/scores`);
    if (!respuesta.ok) throw new Error('No se pudo obtener la tabla de posiciones.');
    return respuesta.json();
}

/**
 * Guarda un nuevo puntaje.
 * @param {{nombre: string, tiempo: number, puntos: number}} datos
 * @returns {Promise<Object>} respuesta del servidor (puede incluir "error")
 */
export async function guardarPuntaje(datos) {
    const respuesta = await fetch(`${BASE_URL}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudo guardar el puntaje.');
    return cuerpo;
}

/**
 * Actualiza el nombre/puntos de un registro existente.
 * @param {number} id
 * @param {{nombre: string, puntos: number}} datos
 */
export async function editarPuntaje(id, datos) {
    const respuesta = await fetch(`${BASE_URL}/score/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudo editar el puntaje.');
    return cuerpo;
}

/**
 * Elimina un registro de la tabla de posiciones.
 * @param {number} id
 */
export async function eliminarPuntaje(id) {
    const respuesta = await fetch(`${BASE_URL}/score/${id}`, { method: 'DELETE' });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudo eliminar el puntaje.');
    return cuerpo;
}

/**
 * Pide al servidor el PDF del score actual y dispara la descarga.
 * @param {{nombre: string, tiempo: number, puntos: number, fecha: string}} datos
 */
export async function descargarPdf(datos) {
    const respuesta = await fetch(`${BASE_URL}/pdf/generar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
    });

    if (!respuesta.ok) {
        const cuerpo = await respuesta.json();
        throw new Error(cuerpo.error || 'No se pudo generar el PDF.');
    }

    const blob = await respuesta.blob();
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `score-${datos.nombre}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.URL.revokeObjectURL(url);
}
