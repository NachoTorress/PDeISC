/**
 * reglas.js
 * Reglas de validación de campos, compartidas por el formulario de alta
 * (validation.js) y por el modo edición de las tarjetas (render.js).
 */

const SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÑáéíóúñ' ]+$/;

export const reglas = {
  nombre: (valor) => {
    if (!valor.trim()) return 'El nombre es obligatorio.';
    if (!SOLO_LETRAS.test(valor.trim())) return 'Solo se permiten letras, espacios y apóstrofes.';
    return null;
  },
  apellido: (valor) => {
    if (!valor.trim()) return 'El apellido es obligatorio.';
    if (!SOLO_LETRAS.test(valor.trim())) return 'Solo se permiten letras, espacios y apóstrofes.';
    return null;
  },
  edad: (valor) => {
    if (valor === '') return 'La edad es obligatoria.';
    const numero = Number(valor);
    if (!Number.isInteger(numero)) return 'La edad debe ser un número entero.';
    if (numero < 0) return 'La edad no puede ser negativa.';
    if (numero > 120) return 'La edad no puede ser mayor a 120.';
    return null;
  },
};
