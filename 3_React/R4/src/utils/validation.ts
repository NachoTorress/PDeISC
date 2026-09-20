/**
 * Utility module for form input validation rules and date calculations.
 * Source: Used by FormField and Admin forms.
 * Performs real-time checks for names, numbers, age calculations, and positive constraints.
 */

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
}

export function validateName(value: string): ValidationResult {
  if (!value || value.trim() === '') {
    return { isValid: false, errorMessage: 'El campo es obligatorio.' };
  }
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ' ]+$/;
  if (!nameRegex.test(value)) {
    return { isValid: false, errorMessage: 'No se permiten números ni símbolos (solo letras y apostrófes).' };
  }
  return { isValid: true, errorMessage: '' };
}

export function validateNumber(value: string | number, allowNegative = false): ValidationResult {
  const strVal = String(value).trim();
  if (strVal === '') {
    return { isValid: false, errorMessage: 'Este campo numérico es obligatorio.' };
  }
  if (!/^-?\d+$/.test(strVal)) {
    return { isValid: false, errorMessage: 'No se permiten letras ni caracteres especiales en campos numéricos.' };
  }
  const num = parseInt(strVal, 10);
  if (!allowNegative && num < 0) {
    return { isValid: false, errorMessage: 'No se permiten números negativos en este contexto.' };
  }
  return { isValid: true, errorMessage: '' };
}

export function validateBirthDateAndCalculateAge(birthDateStr: string): {
  age: number | null;
  result: ValidationResult;
} {
  if (!birthDateStr) {
    return { age: null, result: { isValid: false, errorMessage: 'La fecha de nacimiento es requerida.' } };
  }
  const birthDate = new Date(birthDateStr);
  const today = new Date();

  if (isNaN(birthDate.getTime())) {
    return { age: null, result: { isValid: false, errorMessage: 'Fecha de nacimiento inválida.' } };
  }
  if (birthDate > today) {
    return { age: null, result: { isValid: false, errorMessage: 'La fecha de nacimiento no puede ser futura.' } };
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age > 120) {
    return {
      age,
      result: { isValid: false, errorMessage: `La edad calculada (${age} años) supera el límite máximo de 120 años.` },
    };
  }

  return { age, result: { isValid: true, errorMessage: '' } };
}

export function formatDateDDMMAA(dateInput?: Date | string): string {
  const date = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(date.getTime())) return '01/01/24';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}
