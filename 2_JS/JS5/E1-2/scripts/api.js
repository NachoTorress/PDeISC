/**
 * api.js
 * Encapsula todas las llamadas fetch al API REST de alumnos.
 * De dónde viene: se consume desde main.js y render.js.
 * A dónde va: pega contra /api/alumnos, servido por el propio server.js.
 */

const BASE_URL = '/api/alumnos';

/** Obtiene todos los alumnos. */
export async function obtenerAlumnos() {
  const respuesta = await fetch(BASE_URL);
  if (!respuesta.ok) throw new Error('No se pudieron obtener los alumnos.');
  return respuesta.json();
}

/** Crea un alumno nuevo. @param {{nombre:string, apellido:string, edad:number}} datos */
export async function crearAlumno(datos) {
  const respuesta = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) throw new Error(cuerpo.errores?.join(' ') || 'No se pudo crear el alumno.');
  return cuerpo;
}

/** Actualiza un alumno existente. */
export async function actualizarAlumno(id, datos) {
  const respuesta = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) throw new Error(cuerpo.errores?.join(' ') || 'No se pudo actualizar el alumno.');
  return cuerpo;
}

/** Elimina un alumno por id. */
export async function eliminarAlumno(id) {
  const respuesta = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' });
  const cuerpo = await respuesta.json();
  if (!respuesta.ok) throw new Error(cuerpo.error || 'No se pudo eliminar el alumno.');
  return cuerpo;
}
