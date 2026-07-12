/**
 * modules/validators.js
 * -------------------------------------------------------
 * De donde viene: se ejecuta dentro de las rutas
 *                  (modules/routes/scoreRoutes.js) apenas
 *                  llega un body desde el front.
 * A donde va:     si algo es invalido, la ruta responde
 *                  400 con un mensaje claro; si todo esta
 *                  bien, la ruta continua hacia scoreService.js.
 * Que hace:       centraliza las reglas de validacion para
 *                  no repetir codigo en cada ruta.
 * -------------------------------------------------------
 */

// Solo letras (con acentos y Ñ), espacios y apostrofes. Entre 2 y 40 caracteres.
const REGEX_NOMBRE = /^[a-zA-ZÀ-ÖØ-öø-ÿñÑ' ]{2,40}$/;

/**
 * Valida el nombre de un jugador.
 * @param {string} nombre
 * @returns {string|null} null si es valido, o un mensaje de error
 */
export function validarNombre(nombre) {
    if (typeof nombre !== 'string' || nombre.trim().length === 0) {
        return 'El nombre es obligatorio.';
    }
    const limpio = nombre.trim();
    if (limpio.length < 2) {
        return 'El nombre debe tener al menos 2 caracteres.';
    }
    if (limpio.length > 40) {
        return 'El nombre no puede superar los 40 caracteres.';
    }
    if (!REGEX_NOMBRE.test(limpio)) {
        return 'El nombre solo puede contener letras, espacios y apostrofes (sin numeros ni simbolos).';
    }
    return null;
}

/**
 * Valida un numero entero no negativo dentro de un rango razonable.
 * @param {*} valor
 * @param {{min?: number, max?: number, campo: string}} opciones
 * @returns {string|null} null si es valido, o un mensaje de error
 */
export function validarEntero(valor, { min = 0, max = 999999, campo = 'El valor' }) {
    const numero = Number(valor);
    if (valor === undefined || valor === null || valor === '' || Number.isNaN(numero)) {
        return `${campo} debe ser un numero valido.`;
    }
    if (!Number.isInteger(numero)) {
        return `${campo} debe ser un numero entero.`;
    }
    if (numero < min) {
        return `${campo} no puede ser negativo.`;
    }
    if (numero > max) {
        return `${campo} supera el maximo permitido (${max}).`;
    }
    return null;
}
