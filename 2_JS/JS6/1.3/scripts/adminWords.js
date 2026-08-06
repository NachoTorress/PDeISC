/**
 * scripts/adminWords.js
 * -------------------------------------------------------
 * De donde viene: scripts/adminMain.js llama a estas
 *                  funciones una vez que el admin esta
 *                  logueado, usando el formulario y la
 *                  lista definidos en pages/admin.html.
 * A donde va:     usa scripts/api.js para hablar con las
 *                  rutas protegidas /api/admin/palabra*
 *                  (modules/routes/adminWordRoutes.js), que
 *                  a su vez persisten en la tabla "palabras".
 * -------------------------------------------------------
 */

import { crearPalabraAdmin, editarPalabraAdmin, eliminarPalabraAdmin } from './api.js';
import {
    validarPalabraCliente,
    validarCategoriaCliente,
    validarPistaCliente,
    conectarValidacionTiempoReal,
} from './validation.js';
import { escaparHtml } from './leaderboard.js';

/**
 * Conecta el formulario de "agregar palabra" con la API.
 * @param {Object} refs referencias a los elementos del formulario
 * @param {() => void} alCrear callback para refrescar la lista despues de crear
 */
export function inicializarFormularioNuevaPalabra(refs, alCrear) {
    const { form, inputPalabra, inputCategoria, inputPista, errorPalabra, errorCategoria, errorPista, botonCrear } = refs;

    const validarPalabra = conectarValidacionTiempoReal(inputPalabra, errorPalabra, validarPalabraCliente);
    const validarCategoria = conectarValidacionTiempoReal(inputCategoria, errorCategoria, validarCategoriaCliente);
    const validarPista = conectarValidacionTiempoReal(inputPista, errorPista, validarPistaCliente);

    form.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const esValida = [validarPalabra(), validarCategoria(), validarPista()].every(Boolean);
        if (!esValida) return;

        botonCrear.disabled = true;
        try {
            await crearPalabraAdmin({
                palabra: inputPalabra.value.trim(),
                categoria: inputCategoria.value.trim(),
                pista: inputPista.value.trim(),
            });
            form.reset();
            [inputPalabra, inputCategoria, inputPista].forEach((input) => {
                input.classList.remove('is-valid', 'is-invalid');
            });
            await alCrear();
        } catch (error) {
            errorPalabra.textContent = error.message;
        } finally {
            botonCrear.disabled = false;
        }
    });
}

/**
 * Renderiza el banco de palabras completo como tarjetas editables.
 * @param {HTMLElement} contenedor
 * @param {Array<Object>} palabras
 * @param {() => void} alCambiar callback para refrescar despues de editar/borrar
 */
export function renderizarPalabrasAdmin(contenedor, palabras, alCambiar) {
    contenedor.innerHTML = '';

    if (palabras.length === 0) {
        contenedor.innerHTML = '<p class="texto-vacio">Todavia no hay palabras cargadas.</p>';
        return;
    }

    palabras.forEach((palabra) => {
        contenedor.appendChild(crearTarjetaPalabra(palabra, alCambiar));
    });
}

function crearTarjetaPalabra(palabra, alCambiar) {
    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-score';
    tarjeta.dataset.id = palabra.id;

    tarjeta.innerHTML = `
        <div class="vista-normal">
            <span class="badge-categoria">${escaparHtml(palabra.categoria)}</span>
            <h5 class="nombre-jugador mt-2">${escaparHtml(palabra.palabra)}</h5>
            <p class="detalle-score"><i class="bi bi-question-circle"></i> ${escaparHtml(palabra.pista)}</p>
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

    tarjeta.querySelector('.btn-editar').addEventListener('click', () => mostrarEdicionPalabra(tarjeta, palabra, alCambiar));
    tarjeta.querySelector('.btn-borrar').addEventListener('click', () => mostrarConfirmarBorradoPalabra(tarjeta, palabra, alCambiar));

    return tarjeta;
}

function mostrarEdicionPalabra(tarjeta, palabra, alCambiar) {
    const vistaNormal = tarjeta.querySelector('.vista-normal');
    const vistaEdicion = tarjeta.querySelector('.vista-edicion');

    vistaEdicion.innerHTML = `
        <label class="form-label label-edicion" for="palabra-edit-${palabra.id}">Palabra</label>
        <input type="text" id="palabra-edit-${palabra.id}" class="form-control input-edicion" value="${escaparHtml(palabra.palabra)}" />
        <div class="mensaje-error error-palabra"></div>

        <label class="form-label label-edicion" for="categoria-edit-${palabra.id}">Categoria</label>
        <input type="text" id="categoria-edit-${palabra.id}" class="form-control input-edicion" value="${escaparHtml(palabra.categoria)}" />
        <div class="mensaje-error error-categoria"></div>

        <label class="form-label label-edicion" for="pista-edit-${palabra.id}">Pista</label>
        <input type="text" id="pista-edit-${palabra.id}" class="form-control input-edicion" value="${escaparHtml(palabra.pista)}" />
        <div class="mensaje-error error-pista"></div>

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

    const inputPalabra = vistaEdicion.querySelector(`#palabra-edit-${palabra.id}`);
    const inputCategoria = vistaEdicion.querySelector(`#categoria-edit-${palabra.id}`);
    const inputPista = vistaEdicion.querySelector(`#pista-edit-${palabra.id}`);

    const validarPalabra = conectarValidacionTiempoReal(inputPalabra, vistaEdicion.querySelector('.error-palabra'), validarPalabraCliente);
    const validarCategoria = conectarValidacionTiempoReal(inputCategoria, vistaEdicion.querySelector('.error-categoria'), validarCategoriaCliente);
    const validarPista = conectarValidacionTiempoReal(inputPista, vistaEdicion.querySelector('.error-pista'), validarPistaCliente);

    vistaEdicion.querySelector('.btn-cancelar-edicion').addEventListener('click', () => {
        vistaEdicion.classList.add('d-none');
        vistaNormal.classList.remove('d-none');
    });

    vistaEdicion.querySelector('.btn-guardar-edicion').addEventListener('click', async () => {
        const esValida = [validarPalabra(), validarCategoria(), validarPista()].every(Boolean);
        if (!esValida) return;

        try {
            await editarPalabraAdmin(palabra.id, {
                palabra: inputPalabra.value.trim(),
                categoria: inputCategoria.value.trim(),
                pista: inputPista.value.trim(),
            });
            alCambiar();
        } catch (error) {
            vistaEdicion.querySelector('.error-palabra').textContent = error.message;
        }
    });
}

function mostrarConfirmarBorradoPalabra(tarjeta, palabra, alCambiar) {
    const vistaNormal = tarjeta.querySelector('.vista-normal');
    const vistaConfirmar = tarjeta.querySelector('.vista-confirmar-borrado');

    vistaConfirmar.innerHTML = `
        <p class="texto-confirmacion">
            <i class="bi bi-exclamation-triangle-fill"></i>
            ¿Estas seguro que queres eliminar la palabra <strong>${escaparHtml(palabra.palabra)}</strong>?
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
            await eliminarPalabraAdmin(palabra.id);
            alCambiar();
        } catch (error) {
            vistaConfirmar.querySelector('.texto-confirmacion').textContent = error.message;
        }
    });
}
