/**
 * validation.js
 * Valida en tiempo real los campos del formulario de alta de alumnos.
 * De dónde viene: main.js llama a inicializarValidacion() al cargar la página.
 * A dónde va: marca los inputs con is-invalid/is-valid y habilita/deshabilita
 * el botón de guardar según el estado global del formulario.
 */

import { reglas } from './reglas.js';

/**
 * Valida un campo puntual y refleja el resultado visualmente.
 * @param {HTMLInputElement} input
 * @returns {boolean} true si es válido
 */
function validarCampo(input) {
  const error = reglas[input.name](input.value);
  const contenedorError = document.getElementById(`error-${input.name}`);

  input.classList.toggle('is-invalid', Boolean(error));
  input.classList.toggle('is-valid', !error);
  contenedorError.textContent = error || '';
  contenedorError.classList.toggle('visible', Boolean(error));

  return !error;
}

/**
 * Activa la validación en tiempo real sobre el formulario dado.
 * @param {HTMLFormElement} form
 * @param {HTMLButtonElement} botonSubmit
 */
export function inicializarValidacion(form, botonSubmit) {
  const inputs = [...form.querySelectorAll('input[name]')];

  function actualizarEstadoBoton() {
    const todosValidos = inputs.every((input) => validarCampo(input) && input.value !== '');
    botonSubmit.disabled = !todosValidos;
  }

  inputs.forEach((input) => {
    input.addEventListener('input', actualizarEstadoBoton);
  });
}

/** Revalida todos los inputs de un formulario (usado antes de enviar). */
export function validarFormularioCompleto(form) {
  const inputs = [...form.querySelectorAll('input[name]')];
  return inputs.every((input) => validarCampo(input));
}

/** Limpia clases de validación y mensajes de un formulario. */
export function limpiarValidacion(form) {
  const inputs = [...form.querySelectorAll('input[name]')];
  inputs.forEach((input) => {
    input.classList.remove('is-invalid', 'is-valid');
    const contenedorError = document.getElementById(`error-${input.name}`);
    if (contenedorError) {
      contenedorError.textContent = '';
      contenedorError.classList.remove('visible');
    }
  });
}
