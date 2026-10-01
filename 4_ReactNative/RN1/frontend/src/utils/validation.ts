import type { Answer } from '../types';

export const emailError = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? '' : 'Ingresá un correo válido.';
export const nameError = (value: string) => /^[\p{L}]+(?:[ '\u2019][\p{L}]+)*$/u.test(value.trim()) && value.trim().length >= 2
  ? '' : 'Usá solo letras, espacios y apóstrofes.';
export const passwordError = (value: string) => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)
  ? '' : 'Usá 8 caracteres o más, con letras y números.';
export const codeError = (value: string) => /^\d{6}$/.test(value) ? '' : 'Ingresá exactamente seis dígitos.';
export const answersValid = (answers: Answer[]) => answers.length === 2 && answers[0].questionId !== answers[1].questionId && answers.every((item) => item.answer.trim().length >= 2);
