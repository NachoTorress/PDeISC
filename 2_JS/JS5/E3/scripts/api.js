/**
 * api.js
 * Consume la API REST expuesta por el proyecto 1 (alumnos-api).
 * De dónde viene: se llama desde main.js al cargar la página.
 * A dónde va: pega contra API_URL (debe coincidir con el puerto
 * en el que esté corriendo alumnos-api).
 */

const API_URL = 'http://localhost:3001/api/alumnos';

/** Obtiene todos los alumnos desde la API del proyecto 1. */
export async function obtenerAlumnos() {
  const respuesta = await fetch(API_URL);
  if (!respuesta.ok) throw new Error('La API respondió con un error.');
  return respuesta.json();
}
