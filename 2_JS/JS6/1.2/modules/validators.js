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
 * Valida el usuario de login (letras, numeros, guiones y guion bajo).
 * @param {string} usuario
 * @returns {string|null}
 */
export function validarUsuarioLogin(usuario) {
    if (typeof usuario !== 'string' || usuario.trim().length === 0) {
        return 'El usuario es obligatorio.';
    }
    if (!/^[a-zA-Z0-9_.-]{3,30}$/.test(usuario.trim())) {
        return 'El usuario no tiene un formato valido.';
    }
    return null;
}

/**
 * Valida la palabra del banco de palabras: solo letras (con Ñ), sin
 * espacios ni numeros ni simbolos.
 * @param {string} palabra
 * @returns {string|null}
 */
export function validarPalabra(palabra) {
    if (typeof palabra !== 'string' || palabra.trim().length === 0) {
        return 'La palabra es obligatoria.';
    }
    const limpio = palabra.trim();
    if (limpio.length < 3 || limpio.length > 30) {
        return 'La palabra debe tener entre 3 y 30 letras.';
    }
    if (!/^[a-zA-ZÀ-ÖØ-öø-ÿñÑ]+$/.test(limpio)) {
        return 'La palabra solo puede contener letras, sin espacios ni numeros ni simbolos.';
    }
    return null;
}

/**
 * Valida la categoria de una palabra (letras y espacios).
 * @param {string} categoria
 * @returns {string|null}
 */
export function validarCategoria(categoria) {
    if (typeof categoria !== 'string' || categoria.trim().length === 0) {
        return 'La categoria es obligatoria.';
    }
    if (!/^[a-zA-ZÀ-ÖØ-öø-ÿñÑ ]{2,50}$/.test(categoria.trim())) {
        return 'La categoria solo puede contener letras y espacios.';
    }
    return null;
}

/**
 * Valida la pista de una palabra (texto libre, sin numeros sueltos raros).
 * @param {string} pista
 * @returns {string|null}
 */
export function validarPista(pista) {
    if (typeof pista !== 'string' || pista.trim().length === 0) {
        return 'La pista es obligatoria.';
    }
    if (pista.trim().length < 5 || pista.trim().length > 150) {
        return 'La pista debe tener entre 5 y 150 caracteres.';
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
