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

/**
 * Pide al servidor el PDF de la tabla de posiciones historica completa
 * y dispara la descarga.
 */
export async function descargarTablaPdf() {
    const respuesta = await fetch(`${BASE_URL}/pdf/tabla-posiciones`);

    if (!respuesta.ok) {
        throw new Error('No se pudo generar el PDF de la tabla de posiciones.');
    }

    const blob = await respuesta.blob();
    const url = window.URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `tabla-posiciones-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.URL.revokeObjectURL(url);
}

// =========================================================
// Autenticacion del panel de administracion
// =========================================================

/**
 * Intenta iniciar sesion como administrador.
 * @param {{usuario: string, contrasena: string}} credenciales
 * @returns {Promise<{usuario: string}>}
 */
export async function iniciarSesion(credenciales) {
    const respuesta = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciales),
    });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudo iniciar sesion.');
    return cuerpo;
}

/**
 * Cierra la sesion del administrador actual.
 */
export async function cerrarSesion() {
    const respuesta = await fetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
    if (!respuesta.ok) throw new Error('No se pudo cerrar sesion.');
    return respuesta.json();
}

/**
 * Consulta si hay una sesion de administrador activa (cookie).
 * @returns {Promise<{autenticado: boolean, usuario?: string}>}
 */
export async function consultarSesion() {
    const respuesta = await fetch(`${BASE_URL}/auth/sesion`);
    if (!respuesta.ok) throw new Error('No se pudo consultar la sesion.');
    return respuesta.json();
}

/**
 * Pide el mensaje de "olvide mi contraseña" (no resetea nada de verdad).
 * @returns {Promise<{mensaje: string}>}
 */
export async function pedirRecuperacionPassword() {
    const respuesta = await fetch(`${BASE_URL}/auth/olvide-password`, { method: 'POST' });
    return respuesta.json();
}

// =========================================================
// CRUD de palabras (panel de administracion)
// =========================================================

/**
 * Trae el banco de palabras completo.
 * @returns {Promise<Array>}
 */
export async function obtenerPalabrasAdmin() {
    const respuesta = await fetch(`${BASE_URL}/admin/palabras`);
    if (!respuesta.ok) throw new Error('No se pudo obtener el banco de palabras.');
    return respuesta.json();
}

/**
 * Crea una palabra nueva en el banco.
 * @param {{palabra: string, categoria: string, pista: string}} datos
 */
export async function crearPalabraAdmin(datos) {
    const respuesta = await fetch(`${BASE_URL}/admin/palabra`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudo crear la palabra.');
    return cuerpo;
}

/**
 * Edita una palabra existente.
 * @param {number} id
 * @param {{palabra: string, categoria: string, pista: string}} datos
 */
export async function editarPalabraAdmin(id, datos) {
    const respuesta = await fetch(`${BASE_URL}/admin/palabra/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudo editar la palabra.');
    return cuerpo;
}

/**
 * Elimina una palabra del banco.
 * @param {number} id
 */
export async function eliminarPalabraAdmin(id) {
    const respuesta = await fetch(`${BASE_URL}/admin/palabra/${id}`, { method: 'DELETE' });
    const cuerpo = await respuesta.json();
    if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudo eliminar la palabra.');
    return cuerpo;
}

// =========================================================
// Logs de auditoria (panel de administracion)
// =========================================================

/**
 * Trae el historial de PDFs descargados (score individual y tabla
 * de posiciones historica).
 * @returns {Promise<Array>}
 */
export async function obtenerLogsDescargas() {
    const respuesta = await fetch(`${BASE_URL}/admin/logs/descargas`);
    if (!respuesta.ok) throw new Error('No se pudo obtener el log de descargas.');
    return respuesta.json();
}

/**
 * Trae el historial de inicios de sesion del panel de administracion.
 * @returns {Promise<Array>}
 */
export async function obtenerLogsLogins() {
    const respuesta = await fetch(`${BASE_URL}/admin/logs/logins`);
    if (!respuesta.ok) throw new Error('No se pudo obtener el log de logins.');
    return respuesta.json();
}
