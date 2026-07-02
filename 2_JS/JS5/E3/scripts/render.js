/**
 * render.js
 * Dibuja las tarjetas de alumnos en modo solo lectura.
 * De dónde viene: main.js le pasa la lista de alumnos ya filtrada.
 * A dónde va: pinta el contenido de #lista-alumnos.
 */

import { formatearFecha } from './utils.js';

const contenedor = document.getElementById('lista-alumnos');
const mensajeVacio = document.getElementById('mensaje-vacio');
const contador = document.getElementById('contador-alumnos');

/** @param {Array} alumnos */
export function renderizarAlumnos(alumnos) {
  contador.textContent = `${alumnos.length} alumno${alumnos.length === 1 ? '' : 's'}`;
  mensajeVacio.classList.toggle('d-none', alumnos.length > 0);

  contenedor.innerHTML = alumnos.map((alumno) => `
    <div class="col-12 col-md-6 col-lg-4">
      <div class="alumno-card">
        <p class="alumno-nombre mb-1">${alumno.nombre} ${alumno.apellido} <span class="alumno-id">#${alumno.id}</span></p>
        <p class="alumno-meta mb-1">${alumno.edad} años</p>
        <p class="alumno-fecha mb-0">Cargado el ${formatearFecha(alumno.fecha_creacion)}</p>
      </div>
    </div>`).join('');
}