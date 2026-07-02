/**
 * render.js
 * Dibuja el listado de alumnos y maneja los modos "vista", "edición"
 * y "confirmar eliminación" dentro de cada tarjeta.
 * De dónde viene: main.js llama a renderizarAlumnos() luego de cada
 * operación exitosa contra la API (api.js).
 * A dónde va: modifica el DOM de #lista-alumnos y dispara nuevas
 * llamadas a la API cuando el usuario edita o elimina.
 */

import { actualizarAlumno, eliminarAlumno } from './api.js';
import { mostrarToast } from './toast.js';
import { formatearFecha } from './utils.js';
import { reglas } from './reglas.js';

const contenedor = document.getElementById('lista-alumnos');
const mensajeVacio = document.getElementById('mensaje-vacio');
const contador = document.getElementById('contador-alumnos');

let alumnosActuales = [];
let recargarCallback = null;

/**
 * Punto de entrada del módulo.
 * @param {Array} alumnos
 * @param {Function} recargar función que vuelve a pedir la lista a la API
 */
export function renderizarAlumnos(alumnos, recargar) {
  alumnosActuales = alumnos;
  recargarCallback = recargar;
  contador.textContent = alumnos.length;
  mensajeVacio.classList.toggle('d-none', alumnos.length > 0);

  contenedor.innerHTML = '';
  alumnos.forEach((alumno) => contenedor.appendChild(crearTarjeta(alumno)));
}

/** Crea el nodo de tarjeta en modo vista. */
function crearTarjeta(alumno) {
  const columna = document.createElement('div');
  columna.className = 'col-12 col-md-6 col-lg-4';
  columna.dataset.id = alumno.id;
  columna.innerHTML = vistaHTML(alumno);

  columna.querySelector('.btn-editar').addEventListener('click', () => activarEdicion(columna, alumno));
  columna.querySelector('.btn-eliminar-icono').addEventListener('click', () => activarConfirmacion(columna, alumno));

  return columna;
}

function vistaHTML(alumno) {
  return `
    <div class="alumno-card">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <p class="alumno-nombre mb-1">${alumno.nombre} ${alumno.apellido} <span class="alumno-id">#${alumno.id}</span></p>
          <p class="alumno-meta mb-1">${alumno.edad} años</p>
          <p class="alumno-fecha mb-0">Cargado el ${formatearFecha(alumno.fecha_creacion)}</p>
        </div>
        <div class="d-flex gap-2">
          <button class="btn btn-sm btn-accion btn-editar" type="button" aria-label="Editar">✏️</button>
          <button class="btn btn-sm btn-accion btn-eliminar-icono" type="button" aria-label="Eliminar">🗑️</button>
        </div>
      </div>
    </div>`;
}

/** Reemplaza la tarjeta por un formulario de edición inline. */
function activarEdicion(columna, alumno) {
  columna.innerHTML = `
    <div class="alumno-card">
      <div class="row g-2">
        <div class="col-12">
          <label class="form-label">Nombre</label>
          <input type="text" class="form-control campo-edicion" data-campo="nombre" value="${alumno.nombre}">
          <div class="invalid-feedback error-edicion" data-campo="nombre"></div>
        </div>
        <div class="col-12">
          <label class="form-label">Apellido</label>
          <input type="text" class="form-control campo-edicion" data-campo="apellido" value="${alumno.apellido}">
          <div class="invalid-feedback error-edicion" data-campo="apellido"></div>
        </div>
        <div class="col-12">
          <label class="form-label">Edad</label>
          <input type="number" class="form-control campo-edicion" data-campo="edad" value="${alumno.edad}">
          <div class="invalid-feedback error-edicion" data-campo="edad"></div>
        </div>
      </div>
      <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="btn btn-sm btn-accion btn-cancelar-edicion" type="button">Cancelar</button>
        <button class="btn btn-sm btn-primary btn-guardar-edicion" type="button" disabled>Guardar</button>
      </div>
    </div>`;

  const inputs = [...columna.querySelectorAll('.campo-edicion')];
  const botonGuardar = columna.querySelector('.btn-guardar-edicion');

  function validarEdicion() {
    const valido = inputs.every((input) => {
      const campo = input.dataset.campo;
      const error = reglas[campo](input.value);
      const contenedorError = columna.querySelector(`.error-edicion[data-campo="${campo}"]`);
      input.classList.toggle('is-invalid', Boolean(error));
      input.classList.toggle('is-valid', !error);
      contenedorError.textContent = error || '';
      contenedorError.classList.toggle('visible', Boolean(error));
      return !error;
    });
    botonGuardar.disabled = !valido;
  }

  inputs.forEach((input) => input.addEventListener('input', validarEdicion));
  validarEdicion();

  columna.querySelector('.btn-cancelar-edicion').addEventListener('click', () => {
    columna.innerHTML = vistaHTML(alumno);
    columna.querySelector('.btn-editar').addEventListener('click', () => activarEdicion(columna, alumno));
    columna.querySelector('.btn-eliminar-icono').addEventListener('click', () => activarConfirmacion(columna, alumno));
  });

  botonGuardar.addEventListener('click', async () => {
    const datos = {
      nombre: columna.querySelector('[data-campo="nombre"]').value.trim(),
      apellido: columna.querySelector('[data-campo="apellido"]').value.trim(),
      edad: Number(columna.querySelector('[data-campo="edad"]').value),
    };
    try {
      await actualizarAlumno(alumno.id, datos);
      mostrarToast('Alumno actualizado correctamente.', 'success');
      recargarCallback();
    } catch (error) {
      mostrarToast(error.message, 'error');
    }
  });
}

/** Reemplaza la tarjeta por la confirmación de borrado. */
function activarConfirmacion(columna, alumno) {
  columna.innerHTML = `
    <div class="alumno-card confirm-box">
      <p>¿Estás seguro que querés eliminar a ${alumno.nombre} ${alumno.apellido}?</p>
      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-sm btn-accion btn-cancelar-borrado" type="button">Cancelar</button>
        <button class="btn btn-sm btn-danger btn-confirmar-borrado" type="button">Eliminar</button>
      </div>
    </div>`;

  columna.querySelector('.btn-cancelar-borrado').addEventListener('click', () => {
    columna.innerHTML = vistaHTML(alumno);
    columna.querySelector('.btn-editar').addEventListener('click', () => activarEdicion(columna, alumno));
    columna.querySelector('.btn-eliminar-icono').addEventListener('click', () => activarConfirmacion(columna, alumno));
  });

  columna.querySelector('.btn-confirmar-borrado').addEventListener('click', async () => {
    try {
      await eliminarAlumno(alumno.id);
      mostrarToast('Alumno eliminado correctamente.', 'success');
      recargarCallback();
    } catch (error) {
      mostrarToast(error.message, 'error');
    }
  });
}