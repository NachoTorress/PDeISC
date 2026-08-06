/**
 * scripts/adminLogs.js
 * -------------------------------------------------------
 * De donde viene: scripts/adminMain.js le pasa los listados de
 *                  scripts/api.js (GET /api/admin/logs/descargas
 *                  y GET /api/admin/logs/logins) una vez que el
 *                  admin esta logueado.
 * A donde va:     pinta dos tablas de solo lectura dentro de
 *                  #lista-logs-descargas y #lista-logs-logins.
 * Que hace:       traduce el "tipo" tecnico de cada descarga a
 *                  una etiqueta legible y formatea las filas.
 * -------------------------------------------------------
 */

import { escaparHtml } from './leaderboard.js';

/** Etiquetas legibles para el campo "tipo" del log de descargas. */
const ETIQUETAS_TIPO_DESCARGA = {
    score_pdf: 'PDF de puntaje',
    tabla_posiciones_pdf: 'PDF de tabla de posiciones',
};

/**
 * Renderiza el historial de descargas como tabla de solo lectura.
 * @param {HTMLElement} contenedor
 * @param {Array<Object>} logs
 */
export function renderizarLogsDescargas(contenedor, logs) {
    if (logs.length === 0) {
        contenedor.innerHTML = '<p class="texto-vacio">Todavia no se registraron descargas.</p>';
        return;
    }

    const filas = logs
        .map(
            (log) => `
            <tr>
                <td>${escaparHtml(ETIQUETAS_TIPO_DESCARGA[log.tipo] || log.tipo)}</td>
                <td>${escaparHtml(log.detalle || '-')}</td>
                <td>${escaparHtml(log.fechaFormateada)}</td>
            </tr>`
        )
        .join('');

    contenedor.innerHTML = `
        <div class="table-responsive">
            <table class="table tabla-logs align-middle">
                <thead>
                    <tr>
                        <th>Tipo</th>
                        <th>Detalle</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
    `;
}

/**
 * Renderiza el historial de logins de administrador como tabla de solo lectura.
 * @param {HTMLElement} contenedor
 * @param {Array<Object>} logs
 */
export function renderizarLogsLogins(contenedor, logs) {
    if (logs.length === 0) {
        contenedor.innerHTML = '<p class="texto-vacio">Todavia no se registraron inicios de sesion.</p>';
        return;
    }

    const filas = logs
        .map(
            (log) => `
            <tr>
                <td><i class="bi bi-person-circle"></i> ${escaparHtml(log.usuario)}</td>
                <td>${escaparHtml(log.fechaFormateada)}</td>
            </tr>`
        )
        .join('');

    contenedor.innerHTML = `
        <div class="table-responsive">
            <table class="table tabla-logs align-middle">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Fecha</th>
                    </tr>
                </thead>
                <tbody>${filas}</tbody>
            </table>
        </div>
    `;
}
