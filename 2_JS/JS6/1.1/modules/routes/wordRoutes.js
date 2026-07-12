/**
 * modules/routes/wordRoutes.js
 * -------------------------------------------------------
 * De donde viene: el front pide la palabra via fetch a
 *                  GET /api/palabra (scripts/api.js).
 * A donde va:     responde con una palabra aleatoria leida
 *                  desde la tabla "palabras" en MySQL
 *                  (modules/wordsService.js). Ya no hay
 *                  palabras hardcodeadas en el codigo.
 * -------------------------------------------------------
 */

import { Router } from 'express';
import { obtenerPalabraAleatoria } from '../wordsService.js';

const router = Router();

/**
 * GET /api/palabra
 * Devuelve una palabra aleatoria del banco de palabras (MySQL).
 */
router.get('/palabra', async (req, res) => {
    try {
        const palabraElegida = await obtenerPalabraAleatoria();
        if (!palabraElegida) {
            return res.status(404).json({ error: 'No hay palabras cargadas en el banco todavia.' });
        }
        res.json(palabraElegida);
    } catch (error) {
        console.error('Error al obtener palabra:', error);
        res.status(500).json({ error: 'No se pudo obtener una palabra para jugar.' });
    }
});

export default router;
