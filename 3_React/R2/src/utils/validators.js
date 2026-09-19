/**
 * validators.js
 * -----------------------------------------------------------------------
 * De donde viene: funciones puras de validación de formularios, sin
 *   dependencias de React.
 * A donde va: son importadas por `TaskForm.jsx` (y cualquier otro
 *   formulario futuro) para validar los datos en tiempo real.
 * -----------------------------------------------------------------------
 */

/**
 * Valida el título de una tarea.
 * Reglas: obligatorio, entre 3 y 60 caracteres.
 * @param {string} valor
 * @returns {string} mensaje de error, o cadena vacía si es válido
 */
export function validarTitulo(valor) {
  const limpio = valor.trim();
  if (!limpio) return "El título es obligatorio.";
  if (limpio.length < 3) return "El título debe tener al menos 3 caracteres.";
  if (limpio.length > 60) return "El título no puede superar los 60 caracteres.";
  return "";
}

/**
 * Valida la descripción de una tarea.
 * Reglas: obligatoria, entre 5 y 300 caracteres.
 * @param {string} valor
 * @returns {string} mensaje de error, o cadena vacía si es válido
 */
export function validarDescripcion(valor) {
  const limpio = valor.trim();
  if (!limpio) return "La descripción es obligatoria.";
  if (limpio.length < 5) return "La descripción debe tener al menos 5 caracteres.";
  if (limpio.length > 300) return "La descripción no puede superar los 300 caracteres.";
  return "";
}

/**
 * Formatea una fecha ISO al formato DD/MM/AA solicitado.
 * @param {string} fechaISO
 * @returns {string}
 */
export function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  const dia = String(fecha.getDate()).padStart(2, "0");
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const anio = String(fecha.getFullYear()).slice(-2);
  return `${dia}/${mes}/${anio}`;
}
