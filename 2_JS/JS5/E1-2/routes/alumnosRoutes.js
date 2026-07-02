/**
 * alumnosRoutes.js
 * Define el API REST del recurso "alumnos".
 * De dónde viene: se monta en server.js bajo el prefijo /api/alumnos.
 * A dónde va: delega la lógica de datos a modules/alumnosModel.js
 * y las validaciones a modules/validators.js.
 */

import { Router } from 'express';
import * as AlumnosModel from '../modules/alumnosModel.js';
import { validarAlumno } from '../modules/validators.js';

export const router = Router();

/** GET /api/alumnos -> lista completa de alumnos */
router.get('/', async (req, res) => {
  try {
    const alumnos = await AlumnosModel.obtenerTodos();
    res.json(alumnos);
   } catch (error) {
  console.error('Error al obtener alumnos:', error);
  res.status(500).json({ error: 'No se pudieron obtener los alumnos.' });
}
  
});

/** GET /api/alumnos/:id -> un alumno puntual */
router.get('/:id', async (req, res) => {
  try {
    const alumno = await AlumnosModel.obtenerPorId(req.params.id);
    if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });
    res.json(alumno);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el alumno.' });
  }
});

/** POST /api/alumnos -> crea un alumno nuevo */
router.post('/', async (req, res) => {
  const { valido, errores } = validarAlumno(req.body);
  if (!valido) return res.status(400).json({ errores });

  try {
    const nuevoAlumno = await AlumnosModel.crear(req.body);
    res.status(201).json(nuevoAlumno);
  } catch (error) {
    res.status(500).json({ error: 'No se pudo crear el alumno.' });
  }
});

/** PUT /api/alumnos/:id -> actualiza un alumno existente */
router.put('/:id', async (req, res) => {
  const { valido, errores } = validarAlumno(req.body);
  if (!valido) return res.status(400).json({ errores });

  try {
    const alumnoActualizado = await AlumnosModel.actualizar(req.params.id, req.body);
    if (!alumnoActualizado) return res.status(404).json({ error: 'Alumno no encontrado.' });
    res.json(alumnoActualizado);
  } catch (error) {
    res.status(500).json({ error: 'No se pudo actualizar el alumno.' });
  }
});

/** DELETE /api/alumnos/:id -> elimina un alumno */
router.delete('/:id', async (req, res) => {
  try {
    const eliminado = await AlumnosModel.eliminar(req.params.id);
    if (!eliminado) return res.status(404).json({ error: 'Alumno no encontrado.' });
    res.json({ mensaje: 'Alumno eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ error: 'No se pudo eliminar el alumno.' });
  }
});
