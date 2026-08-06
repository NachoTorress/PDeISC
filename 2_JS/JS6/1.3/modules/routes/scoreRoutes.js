/**
 * modules/routes/scoreRoutes.js
 * -------------------------------------------------------
 * De donde viene: el front (scripts/api.js) llama a estas
 *                  rutas para guardar, listar, editar y
 *                  borrar puntajes de la tabla de posiciones.
 * A donde va:     valida los datos (modules/validators.js) y
 *                  delega el acceso a datos a
 *                  modules/scoreService.js.
 * -------------------------------------------------------
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { validarNombre, validarEntero } from '../validators.js';
import { formatearFecha } from '../dateUtils.js';
import {
    crearScore,
    obtenerScores,
    obtenerScorePorId,
    actualizarScore,
    eliminarScore,
} from '../scoreService.js';

const router = Router();

/**
 * GET /api/scores
 * Devuelve la tabla de posiciones completa, con la fecha
 * ya formateada como DD/MM/AA para mostrar directo en el front.
 */
router.get('/scores', async (req, res) => {
    try {
        const scores = await obtenerScores();
        const scoresFormateados = scores.map((s) => ({
            ...s,
            fechaFormateada: formatearFecha(s.fecha),
        }));
        res.json(scoresFormateados);
    } catch (error) {
        console.error('Error al obtener scores:', error);
        res.status(500).json({ error: 'No se pudo obtener la tabla de posiciones.' });
    }
});

/**
 * POST /api/score
 * Crea un nuevo puntaje. Body esperado: { nombre, tiempo, puntos }
 */
router.post('/score', async (req, res) => {
    const { nombre, tiempo, puntos } = req.body;

    const errorNombre = validarNombre(nombre);
    if (errorNombre) return res.status(400).json({ error: errorNombre });

    const errorTiempo = validarEntero(tiempo, { min: 0, max: 36000, campo: 'El tiempo' });
    if (errorTiempo) return res.status(400).json({ error: errorTiempo });

    const errorPuntos = validarEntero(puntos, { min: 0, max: 10000, campo: 'El puntaje' });
    if (errorPuntos) return res.status(400).json({ error: errorPuntos });

    try {
        const id = await crearScore({ nombre: nombre.trim(), tiempo: Number(tiempo), puntos: Number(puntos) });
        const scoreCreado = await obtenerScorePorId(id);
        res.status(201).json({ ...scoreCreado, fechaFormateada: formatearFecha(scoreCreado.fecha) });
    } catch (error) {
        console.error('Error al crear score:', error);
        res.status(500).json({ error: 'No se pudo guardar el puntaje.' });
    }
});

/**
 * PUT /api/score/:id
 * Edita el nombre y/o los puntos de un registro existente.
 * Requiere sesion de administrador.
 */
router.put('/score/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    const { nombre, puntos } = req.body;

    const errorNombre = validarNombre(nombre);
    if (errorNombre) return res.status(400).json({ error: errorNombre });

    const errorPuntos = validarEntero(puntos, { min: 0, max: 10000, campo: 'El puntaje' });
    if (errorPuntos) return res.status(400).json({ error: errorPuntos });

    try {
        const existente = await obtenerScorePorId(id);
        if (!existente) return res.status(404).json({ error: 'El puntaje no existe.' });

        await actualizarScore(id, { nombre: nombre.trim(), puntos: Number(puntos) });
        const actualizado = await obtenerScorePorId(id);
        res.json({ ...actualizado, fechaFormateada: formatearFecha(actualizado.fecha) });
    } catch (error) {
        console.error('Error al actualizar score:', error);
        res.status(500).json({ error: 'No se pudo actualizar el puntaje.' });
    }
});

/**
 * DELETE /api/score/:id
 * Elimina un registro puntual de la tabla de posiciones.
 * Requiere sesion de administrador.
 */
router.delete('/score/:id', requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const existente = await obtenerScorePorId(id);
        if (!existente) return res.status(404).json({ error: 'El puntaje no existe.' });

        await eliminarScore(id);
        res.json({ mensaje: 'Puntaje eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar score:', error);
        res.status(500).json({ error: 'No se pudo eliminar el puntaje.' });
    }
});

export default router;
