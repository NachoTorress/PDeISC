/**
 * scripts/validation.js
 * -------------------------------------------------------
 * De donde viene: lo usan scripts/main.js y scripts/leaderboard.js
 *                  para validar inputs (nombre del jugador).
 * A donde va:     escucha el evento "input" de cada campo y
 *                  actualiza las clases Bootstrap (is-invalid)
 *                  y el mensaje de error en tiempo real, sin
 *                  esperar al submit.
 * -------------------------------------------------------
 */

const REGEX_NOMBRE = /^[a-zA-ZÀ-ÖØ-öø-ÿñÑ' ]{2,40}$/;

/**
 * Valida un nombre de jugador.
 * @param {string} valor
 * @returns {string|null} mensaje de error o null si es valido
 */
export function validarNombreCliente(valor) {
    const limpio = valor.trim();
    if (limpio.length === 0) return 'El nombre es obligatorio.';
    if (limpio.length < 2) return 'Debe tener al menos 2 caracteres.';
    if (limpio.length > 40) return 'No puede superar los 40 caracteres.';
    if (!REGEX_NOMBRE.test(limpio)) {
        return 'Solo se permiten letras, espacios y apostrofes (sin numeros ni simbolos).';
    }
    return null;
}

const REGEX_PALABRA = /^[a-zA-ZÀ-ÖØ-öø-ÿñÑ]{3,30}$/;
const REGEX_CATEGORIA = /^[a-zA-ZÀ-ÖØ-öø-ÿñÑ ]{2,50}$/;
const REGEX_USUARIO = /^[a-zA-Z0-9_.-]{3,30}$/;

/**
 * Valida una palabra para el banco del ahorcado (solo letras, sin espacios).
 * @param {string} valor
 * @returns {string|null}
 */
export function validarPalabraCliente(valor) {
    const limpio = valor.trim();
    if (limpio.length === 0) return 'La palabra es obligatoria.';
    if (!REGEX_PALABRA.test(limpio)) {
        return 'Solo letras, sin espacios ni numeros ni simbolos (3 a 30 caracteres).';
    }
    return null;
}

/**
 * Valida la categoria de una palabra.
 * @param {string} valor
 * @returns {string|null}
 */
export function validarCategoriaCliente(valor) {
    const limpio = valor.trim();
    if (limpio.length === 0) return 'La categoria es obligatoria.';
    if (!REGEX_CATEGORIA.test(limpio)) {
        return 'Solo letras y espacios (2 a 50 caracteres).';
    }
    return null;
}

/**
 * Valida la pista de una palabra.
 * @param {string} valor
 * @returns {string|null}
 */
export function validarPistaCliente(valor) {
    const limpio = valor.trim();
    if (limpio.length === 0) return 'La pista es obligatoria.';
    if (limpio.length < 5 || limpio.length > 150) {
        return 'La pista debe tener entre 5 y 150 caracteres.';
    }
    return null;
}

/**
 * Valida el usuario de login.
 * @param {string} valor
 * @returns {string|null}
 */
export function validarUsuarioCliente(valor) {
    const limpio = valor.trim();
    if (limpio.length === 0) return 'El usuario es obligatorio.';
    if (!REGEX_USUARIO.test(limpio)) {
        return 'Usuario invalido (letras, numeros, guiones, 3 a 30 caracteres).';
    }
    return null;
}

/**
 * Conecta un input con su elemento de error para validar en
 * tiempo real (on real time) mientras el usuario escribe.
 * @param {HTMLInputElement} input
 * @param {HTMLElement} elementoError
 * @param {(valor: string) => string|null} funcionValidadora
 * @param {() => void} [alValidar] callback opcional que se ejecuta con el resultado
 */
export function conectarValidacionTiempoReal(input, elementoError, funcionValidadora, alValidar) {
    const validar = () => {
        const error = funcionValidadora(input.value);
        if (error) {
            input.classList.add('is-invalid');
            input.classList.remove('is-valid');
            elementoError.textContent = error;
        } else {
            input.classList.remove('is-invalid');
            input.classList.add('is-valid');
            elementoError.textContent = '';
        }
        if (alValidar) alValidar(!error);
        return !error;
    };

    input.addEventListener('input', validar);
    return validar;
}
