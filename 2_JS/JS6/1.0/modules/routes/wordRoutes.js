/**
 * modules/routes/wordRoutes.js
 * -------------------------------------------------------
 * De donde viene: el front pide la palabra via fetch a
 *                  GET /api/palabra (scripts/api.js).
 * A donde va:     responde con la palabra elegida por
 *                  modules/words.js.
 * -------------------------------------------------------
 */

import { Router } from 'express';
import { obtenerPalabraAleatoria } from '../words.js';

const router = Router();

/**
 * GET /api/palabra
 * Devuelve una palabra aleatoria del banco de palabras.
 */
router.get('/palabra', (req, res) => {
    const palabraElegida = obtenerPalabraAleatoria();
    res.json(palabraElegida);
});

export default router;
