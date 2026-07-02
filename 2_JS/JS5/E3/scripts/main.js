/**
 * main.js
 * Orquesta la carga, búsqueda y renderizado de los alumnos consumidos
 * desde la API del proyecto 1 (alumnos-api).
 * De dónde viene: se carga como <script type="module"> desde pages/index.html.
 */

import { inicializarTema, alternarTema } from './theme.js';
import { inicializarScrollTop } from './scrollTop.js';
import { obtenerAlumnos } from './api.js';
import { renderizarAlumnos } from './render.js';
import { mostrarToast } from './toast.js';

const inputBusqueda = document.getElementById('input-busqueda');
const mensajeError = document.getElementById('mensaje-error');

let todosLosAlumnos = [];

/** Filtra por nombre/apellido según el texto de búsqueda. */
function filtrarYRenderizar() {
  const texto = inputBusqueda.value.trim().toLowerCase();
  const filtrados = todosLosAlumnos.filter((alumno) =>
    `${alumno.nombre} ${alumno.apellido}`.toLowerCase().includes(texto)
  );
  renderizarAlumnos(filtrados);
}

async function cargarAlumnos() {
  try {
    todosLosAlumnos = await obtenerAlumnos();
    mensajeError.classList.add('d-none');
    filtrarYRenderizar();
  } catch (error) {
    mensajeError.classList.remove('d-none');
    mostrarToast('No se pudo conectar con la API de alumnos.', 'error');
  }
}

inputBusqueda.addEventListener('input', filtrarYRenderizar);
document.getElementById('theme-toggle').addEventListener('click', alternarTema);

inicializarTema();
inicializarScrollTop();
cargarAlumnos();
