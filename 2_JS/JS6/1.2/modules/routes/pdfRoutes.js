/**
 * modules/routes/pdfRoutes.js
 * -------------------------------------------------------
 * De donde viene: el boton "Descargar PDF" del front
 *                  (scripts/api.js) envia el resultado de
 *                  la partida actual por POST.
 * A donde va:     delega la construccion del archivo a
 *                  modules/pdfService.js, que escribe el
 *                  PDF directo en la respuesta HTTP.
 * -------------------------------------------------------
 */

import { Router } from 'express';
import { validarNombre, validarEntero } from '../validators.js';
import { generarPdfScore, generarPdfTablaPosiciones } from '../pdfService.js';
import { obtenerScores } from '../scoreService.js';

const router = Router();

/**
 * POST /api/pdf/generar
 * Genera un PDF de descarga con el score actual de la partida.
 * Body esperado: { nombre, tiempo, puntos, fecha }
 */
router.post('/pdf/generar', (req, res) => {
    const { nombre, tiempo, puntos, fecha } = req.body;

    const errorNombre = validarNombre(nombre);
    if (errorNombre) return res.status(400).json({ error: errorNombre });

    const errorTiempo = validarEntero(tiempo, { min: 0, max: 36000, campo: 'El tiempo' });
    if (errorTiempo) return res.status(400).json({ error: errorTiempo });

    const errorPuntos = validarEntero(puntos, { min: 0, max: 10000, campo: 'El puntaje' });
    if (errorPuntos) return res.status(400).json({ error: errorPuntos });

    generarPdfScore(res, {
        nombre: nombre.trim(),
        tiempo: Number(tiempo),
        puntos: Number(puntos),
        fecha: fecha ? new Date(fecha) : new Date(),
    });
});

/**
 * GET /api/pdf/tabla-posiciones
 * Genera un PDF de descarga con la tabla de posiciones historica completa
 * (todos los puntajes guardados hasta el momento).
 */
router.get('/pdf/tabla-posiciones', async (req, res) => {
    try {
        const scores = await obtenerScores();
        generarPdfTablaPosiciones(res, scores);
    } catch (error) {
        res.status(500).json({ error: 'No se pudo generar el PDF de la tabla de posiciones.' });
    }
});

export default router;
