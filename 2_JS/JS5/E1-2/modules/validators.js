/**
 * validators.js
 * Valida los datos de un alumno antes de guardarlos en la base.
 * De dónde viene: recibe el body de las requests POST/PUT de alumnosRoutes.js.
 * A dónde va: devuelve { valido, errores } que la ruta usa para responder 400 o continuar.
 */

const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÑáéíóúñ' ]+$/;

/**
 * Valida nombre y apellido: solo letras, espacios y apóstrofes.
 * @param {string} valor
 * @returns {boolean}
 */
function esTextoValido(valor) {
  return typeof valor === 'string' && valor.trim().length > 0 && SOLO_LETRAS.test(valor.trim());
}

/**
 * Valida la edad: entero entre 0 y 120.
 * @param {any} valor
 * @returns {boolean}
 */
function esEdadValida(valor) {
  const edad = Number(valor);
  return Number.isInteger(edad) && edad >= 0 && edad <= 120;
}

/**
 * Valida el objeto completo de un alumno.
 * @param {{nombre:string, apellido:string, edad:number}} data
 * @returns {{valido:boolean, errores:string[]}}
 */
export function validarAlumno(data) {
  const errores = [];
  const { nombre, apellido, edad } = data;

  if (!esTextoValido(nombre)) {
    errores.push('El nombre solo puede contener letras, espacios y apóstrofes.');
  }
  if (!esTextoValido(apellido)) {
    errores.push('El apellido solo puede contener letras, espacios y apóstrofes.');
  }
  if (!esEdadValida(edad)) {
    errores.push('La edad debe ser un número entero entre 0 y 120.');
  }

  return { valido: errores.length === 0, errores };
}
