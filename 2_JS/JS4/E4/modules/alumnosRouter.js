/**
 * modules/alumnosRouter.js
 * Router Express que expone la API local /api/alumnos.
 * Entrada: peticiones GET / POST / PUT / DELETE desde el cliente
 * Salida: respuestas JSON con lista de alumnos o confirmaciones de operación
 * Ejercicio 4: API propia con Node.js
 */

import { Router } from "express";
import {
  getAlumnos,
  addAlumno,
  updateAlumno,
  deleteAlumno,
} from "./alumnosStore.js";

const router = Router();

/**
 * GET /api/alumnos
 * Devuelve la lista completa de alumnos.
 */
router.get("/", (req, res) => {
  res.json(getAlumnos());
});

/**
 * POST /api/alumnos
 * Crea un nuevo alumno.
 * Body esperado: { nombre: string, email: string, materia: string }
 */
router.post("/", (req, res) => {
  const { nombre, email, materia } = req.body;

  if (!nombre || !email || !materia) {
    return res.status(400).json({ error: "Faltan campos requeridos: nombre, email, materia." });
  }

  const nombreValido = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s']+$/.test(nombre.trim());
  if (!nombreValido) {
    return res.status(400).json({ error: "El nombre solo puede contener letras." });
  }

  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  if (!emailValido) {
    return res.status(400).json({ error: "El email no tiene un formato válido." });
  }

  const alumno = addAlumno({ nombre: nombre.trim(), email: email.trim(), materia: materia.trim() });
  if (!alumno) {
    return res.status(400).json({ error: "Ya existe un registro con el mismo email y materia." });
  }
  res.status(201).json(alumno);
});

/**
 * PUT /api/alumnos/:id
 * Modifica un alumno existente por su id.
 * Body esperado: { nombre?: string, email?: string, materia?: string }
 */
router.put("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const resultado = updateAlumno(id, req.body);

  if (!resultado) {
    return res.status(404).json({ error: `Alumno con id ${id} no encontrado.` });
  }

  res.json(resultado);
});

/**
 * DELETE /api/alumnos/:id
 * Elimina un alumno por su id.
 */
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const eliminado = deleteAlumno(id);

  if (!eliminado) {
    return res.status(404).json({ error: `Alumno con id ${id} no encontrado.` });
  }

  res.json({ mensaje: "Alumno eliminado correctamente.", id });
});

export default router;