/**
 * scripts/leaderboard.js
 * -------------------------------------------------------
 * De donde viene: scripts/main.js le pasa el listado de
 *                  puntajes obtenido de scripts/api.js
 *                  (que a su vez viene de MySQL via server.js).
 * A donde va:     pinta tarjetas dentro de #lista-posiciones y,
 *                  cuando el usuario edita o elimina, vuelve a
 *                  llamar a scripts/api.js para persistir el
 *                  cambio en la base de datos.
 * Que hace:       arma la tabla de posiciones como tarjetas,
 *                  con edicion y borrado en linea (sin confirm()
 *                  nativo, con confirmacion dentro de la propia
 *                  tarjeta).
 * -------------------------------------------------------
 */

import { editarPuntaje, eliminarPuntaje } from './api.js';
import { validarNombreCliente, conectarValidacionTiempoReal } from './validation.js';

/**
 * Renderiza el listado completo de puntajes como tarjetas.
 * @param {HTMLElement} contenedor
 * @param {Array<Object>} scores
 * @param {() => void} alCambiar callback para refrescar despues de editar/borrar
 */
export function renderizarTablaPosiciones(contenedor, scores, alCambiar) {
    contenedor.innerHTML = '';

    if (scores.length === 0) {
        contenedor.innerHTML = '<p class="texto-vacio">Todavia no hay puntajes guardados. ¡Se el primero en jugar!</p>';
        return;
    }

    scores.forEach((score, indice) => {
        const tarjeta = crearTarjetaScore(score, indice + 1, alCambiar);
        contenedor.appendChild(tarjeta);
    });
}

/**
 * Construye el elemento DOM de una tarjeta de puntaje individual.
 * @param {Object} score
 * @param {number} posicion
 * @param {() => void} alCambiar
 * @returns {HTMLElement}
 */
function crearTarjetaScore(score, posicion, alCambiar) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-score';
    tarjeta.dataset.id = score.id;

    const minutos = Math.floor(score.tiempo / 60);
    const segundos = score.tiempo % 60;
    const tiempoFormateado = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    tarjeta.innerHTML = `
        <div class="vista-normal">
            <div class="posicion-badge">#${posicion}</div>
            <h5 class="nombre-jugador">${escaparHtml(score.nombre)}</h5>
            <p class="detalle-score"><i class="bi bi-star-fill"></i> ${score.puntos} puntos</p>
            <p class="detalle-score"><i class="bi bi-stopwatch"></i> ${tiempoFormateado} min</p>
            <p class="detalle-score"><i class="bi bi-calendar3"></i> ${score.fechaFormateada}</p>
            <div class="acciones-tarjeta">
                <button type="button" class="btn btn-editar" title="Editar">
                    <i class="bi bi-pencil-fill"></i> Editar
                </button>
                <button type="button" class="btn btn-borrar" title="Eliminar">
                    <i class="bi bi-trash-fill"></i> Eliminar
                </button>
            </div>
        </div>
        <div class="vista-edicion d-none"></div>
        <div class="vista-confirmar-borrado d-none"></div>
    `;

    const botonEditar = tarjeta.querySelector('.btn-editar');
    const botonBorrar = tarjeta.querySelector('.btn-borrar');

    botonEditar.addEventListener('click', () => mostrarVistaEdicion(tarjeta, score, alCambiar));
    botonBorrar.addEventListener('click', () => mostrarVistaConfirmarBorrado(tarjeta, score, alCambiar));

    return tarjeta;
}

/**
 * Reemplaza la vista normal de la tarjeta por un formulario de edicion.
 */
function mostrarVistaEdicion(tarjeta, score, alCambiar) {
    const vistaNormal = tarjeta.querySelector('.vista-normal');
    const vistaEdicion = tarjeta.querySelector('.vista-edicion');

    vistaEdicion.innerHTML = `
        <label class="form-label label-edicion" for="nombre-edit-${score.id}">Nombre</label>
        <input type="text" id="nombre-edit-${score.id}" class="form-control input-edicion" value="${escaparHtml(score.nombre)}" />
        <div class="mensaje-error"></div>

        <label class="form-label label-edicion" for="puntos-edit-${score.id}">Puntos</label>
        <input type="number" id="puntos-edit-${score.id}" class="form-control input-edicion" value="${score.puntos}" min="0" />

        <div class="acciones-tarjeta mt-2">
            <button type="button" class="btn btn-guardar-edicion">
                <i class="bi bi-check-lg"></i> Guardar
            </button>
            <button type="button" class="btn btn-cancelar-edicion">
                <i class="bi bi-x-lg"></i> Cancelar
            </button>
        </div>
    `;

    vistaNormal.classList.add('d-none');
    vistaEdicion.classList.remove('d-none');

    const inputNombre = vistaEdicion.querySelector(`#nombre-edit-${score.id}`);
    const inputPuntos = vistaEdicion.querySelector(`#puntos-edit-${score.id}`);
    const mensajeError = vistaEdicion.querySelector('.mensaje-error');
    const botonGuardar = vistaEdicion.querySelector('.btn-guardar-edicion');
    const botonCancelar = vistaEdicion.querySelector('.btn-cancelar-edicion');

    const validar = conectarValidacionTiempoReal(inputNombre, mensajeError, validarNombreCliente);

    botonCancelar.addEventListener('click', () => {
        vistaEdicion.classList.add('d-none');
        vistaNormal.classList.remove('d-none');
    });

    botonGuardar.addEventListener('click', async () => {
        if (!validar()) return;
        try {
            await editarPuntaje(score.id, {
                nombre: inputNombre.value.trim(),
                puntos: Number(inputPuntos.value),
            });
            alCambiar();
        } catch (error) {
            mensajeError.textContent = error.message;
        }
    });
}

/**
 * Reemplaza la vista normal por la confirmacion de borrado
 * (estilizada dentro de la propia tarjeta, sin usar confirm()).
 */
function mostrarVistaConfirmarBorrado(tarjeta, score, alCambiar) {
    const vistaNormal = tarjeta.querySelector('.vista-normal');
    const vistaConfirmar = tarjeta.querySelector('.vista-confirmar-borrado');

    vistaConfirmar.innerHTML = `
        <p class="texto-confirmacion">
            <i class="bi bi-exclamation-triangle-fill"></i>
            ¿Estas seguro que queres eliminar el puntaje de <strong>${escaparHtml(score.nombre)}</strong>?
        </p>
        <div class="acciones-tarjeta">
            <button type="button" class="btn btn-confirmar-si">Si, eliminar</button>
            <button type="button" class="btn btn-confirmar-no">Cancelar</button>
        </div>
    `;

    vistaNormal.classList.add('d-none');
    vistaConfirmar.classList.remove('d-none');

    vistaConfirmar.querySelector('.btn-confirmar-no').addEventListener('click', () => {
        vistaConfirmar.classList.add('d-none');
        vistaNormal.classList.remove('d-none');
    });

    vistaConfirmar.querySelector('.btn-confirmar-si').addEventListener('click', async () => {
        try {
            await eliminarPuntaje(score.id);
            alCambiar();
        } catch (error) {
            vistaConfirmar.querySelector('.texto-confirmacion').textContent = error.message;
        }
    });
}

/**
 * Escapa texto para insertarlo de forma segura dentro de innerHTML.
 * @param {string} texto
 * @returns {string}
 */
function escaparHtml(texto) {
    const div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

const MEDALLAS = ['🥇', '🥈', '🥉'];

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