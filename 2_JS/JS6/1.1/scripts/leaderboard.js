/**
 * scripts/leaderboard.js
 * -------------------------------------------------------
 * De donde viene: scripts/main.js (pagina publica del juego)
 *                  le pasa el listado de puntajes obtenido
 *                  de scripts/api.js.
 * A donde va:     pinta tarjetas de solo lectura dentro de
 *                  #lista-posiciones. Editar/eliminar puntajes
 *                  ahora es exclusivo del panel de admin
 *                  (ver scripts/adminScores.js), por eso esta
 *                  version publica no tiene esos botones.
 * -------------------------------------------------------
 */

const MEDALLAS = ['🥇', '🥈', '🥉'];

/**
 * Renderiza el listado completo de puntajes como tarjetas de solo lectura.
 * @param {HTMLElement} contenedor
 * @param {Array<Object>} scores
 */
export function renderizarTablaPosiciones(contenedor, scores) {
    contenedor.innerHTML = '';

    if (scores.length === 0) {
        contenedor.innerHTML = '<p class="texto-vacio">Todavia no hay puntajes guardados. ¡Se el primero en jugar!</p>';
        return;
    }

    scores.forEach((score, indice) => {
        contenedor.appendChild(crearTarjetaScoreSoloLectura(score, indice + 1));
    });
}

/**
 * Construye una tarjeta de puntaje de solo lectura (sin editar/eliminar).
 * @param {Object} score
 * @param {number} posicion
 * @returns {HTMLElement}
 */
function crearTarjetaScoreSoloLectura(score, posicion) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-score';

    const minutos = Math.floor(score.tiempo / 60);
    const segundos = score.tiempo % 60;
    const tiempoFormateado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    tarjeta.innerHTML = `
        <div class="posicion-badge">#${posicion}</div>
        <h5 class="nombre-jugador">${escaparHtml(score.nombre)}</h5>
        <p class="detalle-score"><i class="bi bi-star-fill"></i> ${score.puntos} puntos</p>
        <p class="detalle-score"><i class="bi bi-stopwatch"></i> ${tiempoFormateado} min</p>
        <p class="detalle-score"><i class="bi bi-calendar3"></i> ${score.fechaFormateada}</p>
    `;

    return tarjeta;
}

/**
 * Renderiza el Top 3 de puntajes en un panel aparte de la tabla completa.
 * @param {HTMLElement} contenedor
 * @param {Array<Object>} scores listado completo (ya viene ordenado del backend)
 */
export function renderizarTop3(contenedor, scores) {
    contenedor.innerHTML = '';
    const top3 = scores.slice(0, 3);

    if (top3.length === 0) {
        contenedor.innerHTML = '<p class="texto-vacio">Todavia no hay puntajes en el top.</p>';
        return;
    }

    top3.forEach((score, indice) => {
        const item = document.createElement('div');
        item.className = 'item-top3';
        item.innerHTML = `
            <span class="medalla">${MEDALLAS[indice]}</span>
            <div class="info-top3">
                <div class="nombre-top3">${escaparHtml(score.nombre)}</div>
                <div class="detalle-top3">${score.fechaFormateada}</div>
            </div>
            <span class="puntos-top3">${score.puntos} pts</span>
        `;
        contenedor.appendChild(item);
    });
}

/**
 * Genera y descarga un archivo CSV con la tabla completa de puntajes.
 * @param {Array<Object>} scores listado completo (ya viene ordenado del backend)
 */
export function descargarTablaComoCSV(scores) {
    if (scores.length === 0) return;

    const encabezado = ['Posicion', 'Nombre', 'Puntos', 'Tiempo (segundos)', 'Fecha'];

    const filas = scores.map((score, indice) => [
        indice + 1,
        `"${score.nombre.replace(/"/g, '""')}"`,
        score.puntos,
        score.tiempo,
        `"${score.fechaFormateada}"`,
    ]);

    const contenidoCSV = [encabezado, ...filas]
        .map((fila) => fila.join(','))
        .join('\n');

    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `tabla-posiciones-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    URL.revokeObjectURL(url);
}

/**
 * Escapa texto para insertarlo de forma segura dentro de innerHTML.
 * @param {string} texto
 * @returns {string}
 */
export function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}