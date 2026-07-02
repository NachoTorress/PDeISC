/**
 * main.js
 * Orquesta todos los módulos de la interfaz de gestión de alumnos.
 * De dónde viene: se carga como <script type="module"> desde pages/index.html.
 * A dónde va: conecta el formulario, la validación, la API y el renderizado.
 */

import { inicializarTema, alternarTema } from './theme.js';
import { inicializarScrollTop } from './scrollTop.js';
import { inicializarValidacion, validarFormularioCompleto, limpiarValidacion } from './validation.js';
import { obtenerAlumnos, crearAlumno } from './api.js';
import { renderizarAlumnos } from './render.js';
import { mostrarToast } from './toast.js';

const form = document.getElementById('form-alumno');
const botonGuardar = document.getElementById('btn-guardar');

/** Pide la lista actualizada de alumnos a la API y la vuelve a dibujar. */
async function recargarAlumnos() {
  try {
    const alumnos = await obtenerAlumnos();
    renderizarAlumnos(alumnos, recargarAlumnos);
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  if (!validarFormularioCompleto(form)) return;

  const datos = {
    nombre: form.nombre.value.trim(),
    apellido: form.apellido.value.trim(),
    edad: Number(form.edad.value),
  };

  try {
    await crearAlumno(datos);
    mostrarToast('Alumno cargado correctamente.', 'success');
    form.reset();
    limpiarValidacion(form);
    botonGuardar.disabled = true;
    recargarAlumnos();
  } catch (error) {
    mostrarToast(error.message, 'error');
  }
});

document.getElementById('theme-toggle').addEventListener('click', alternarTema);

inicializarTema();
inicializarScrollTop();
inicializarValidacion(form, botonGuardar);
recargarAlumnos();
