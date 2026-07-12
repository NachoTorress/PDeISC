/**
 * scripts/adminScores.js
 * -------------------------------------------------------
 * De donde viene: scripts/adminMain.js le pasa el listado de
 *                  puntajes (scripts/api.js -> GET /api/scores)
 *                  una vez que el admin esta logueado.
 * A donde va:     pinta tarjetas editables dentro de
 *                  #admin-lista-scores; los cambios se mandan
 *                  a MySQL via scripts/api.js (PUT/DELETE
 *                  /api/score/:id, protegidos por sesion).
 * Que hace:       arma tarjetas con edicion y borrado en linea,
 *                  con confirmacion dentro de la propia tarjeta
 *                  (nunca con confirm() nativo).
 * -------------------------------------------------------
 */

import { editarPuntaje, eliminarPuntaje } from './api.js';
import { validarNombreCliente, conectarValidacionTiempoReal } from './validation.js';
import { escaparHtml } from './leaderboard.js';

/**
 * Renderiza el listado completo de puntajes como tarjetas editables.
 * @param {HTMLElement} contenedor
 * @param {Array<Object>} scores
 * @param {() => void} alCambiar callback para refrescar despues de editar/borrar
 */
export function renderizarScoresAdmin(contenedor, scores, alCambiar) {
    contenedor.innerHTML = '';

    if (scores.length === 0) {
        contenedor.innerHTML = '<p class="texto-vacio">Todavia no hay puntajes guardados.</p>';
        return;
    }

    scores.forEach((score, indice) => {
        contenedor.appendChild(crearTarjetaScoreEditable(score, indice + 1, alCambiar));
    });
}

/**
 * Construye la tarjeta editable de un puntaje.
 */
function crearTarjetaScoreEditable(score, posicion, alCambiar) {
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

    tarjeta.querySelector('.btn-editar').addEventListener('click', () => mostrarVistaEdicion(tarjeta, score, alCambiar));
    tarjeta.querySelector('.btn-borrar').addEventListener('click', () => mostrarVistaConfirmarBorrado(tarjeta, score, alCambiar));

    return tarjeta;
}

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

    const validar = conectarValidacionTiempoReal(inputNombre, mensajeError, validarNombreCliente);

    vistaEdicion.querySelector('.btn-cancelar-edicion').addEventListener('click', () => {
        vistaEdicion.classList.add('d-none');
        vistaNormal.classList.remove('d-none');
    });

    vistaEdicion.querySelector('.btn-guardar-edicion').addEventListener('click', async () => {
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
