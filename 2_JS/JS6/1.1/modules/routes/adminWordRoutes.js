/**
 * modules/routes/adminWordRoutes.js
 * -------------------------------------------------------
 * De donde viene: el panel de admin (scripts/adminWords.js)
 *                  llama a estas rutas para listar, crear,
 *                  editar y borrar palabras del banco.
 * A donde va:     todas pasan primero por requireAuth (si no
 *                  hay sesion, cortan con 401); luego delegan
 *                  a modules/wordsService.js.
 * -------------------------------------------------------
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { validarPalabra, validarCategoria, validarPista } from '../validators.js';
import {
    obtenerPalabras,
    obtenerPalabraPorId,
    crearPalabra,
    actualizarPalabra,
    eliminarPalabra,
    existePalabra,
} from '../wordsService.js';

const router = Router();

// Todas las rutas de este archivo requieren sesion de administrador.
router.use(requireAuth);

/**
 * GET /api/admin/palabras
 * Devuelve el banco de palabras completo.
 */
router.get('/admin/palabras', async (req, res) => {
    try {
        const palabras = await obtenerPalabras();
        res.json(palabras);
    } catch (error) {
        console.error('Error al obtener palabras:', error);
        res.status(500).json({ error: 'No se pudo obtener el banco de palabras.' });
    }
});

/**
 * POST /api/admin/palabra
 * Crea una palabra nueva. Body: { palabra, categoria, pista }
 */
router.post('/admin/palabra', async (req, res) => {
    const { palabra, categoria, pista } = req.body;

    const errorPalabra = validarPalabra(palabra);
    if (errorPalabra) return res.status(400).json({ error: errorPalabra });

    const errorCategoria = validarCategoria(categoria);
    if (errorCategoria) return res.status(400).json({ error: errorCategoria });

    const errorPista = validarPista(pista);
    if (errorPista) return res.status(400).json({ error: errorPista });

    const palabraNormalizada = palabra.trim().toUpperCase();

    try {
        if (await existePalabra(palabraNormalizada)) {
            return res.status(409).json({ error: 'Esa palabra ya existe en el banco.' });
        }

        const id = await crearPalabra({
            palabra: palabraNormalizada,
            categoria: categoria.trim(),
            pista: pista.trim(),
        });
        const palabraCreada = await obtenerPalabraPorId(id);
        res.status(201).json(palabraCreada);
    } catch (error) {
        console.error('Error al crear palabra:', error);
        res.status(500).json({ error: 'No se pudo crear la palabra.' });
    }
});

/**
 * PUT /api/admin/palabra/:id
 * Edita una palabra existente.
 */
router.put('/admin/palabra/:id', async (req, res) => {
    const { id } = req.params;
    const { palabra, categoria, pista } = req.body;

    const errorPalabra = validarPalabra(palabra);
    if (errorPalabra) return res.status(400).json({ error: errorPalabra });

    const errorCategoria = validarCategoria(categoria);
    if (errorCategoria) return res.status(400).json({ error: errorCategoria });

    const errorPista = validarPista(pista);
    if (errorPista) return res.status(400).json({ error: errorPista });

    const palabraNormalizada = palabra.trim().toUpperCase();

    try {
        const existente = await obtenerPalabraPorId(id);
        if (!existente) return res.status(404).json({ error: 'La palabra no existe.' });

        if (await existePalabra(palabraNormalizada, id)) {
            return res.status(409).json({ error: 'Ya existe otra palabra igual en el banco.' });
        }

        await actualizarPalabra(id, {
            palabra: palabraNormalizada,
            categoria: categoria.trim(),
            pista: pista.trim(),
        });
        const palabraActualizada = await obtenerPalabraPorId(id);
        res.json(palabraActualizada);
    } catch (error) {
        console.error('Error al actualizar palabra:', error);
        res.status(500).json({ error: 'No se pudo actualizar la palabra.' });
    }
});

/**
 * DELETE /api/admin/palabra/:id
 */
router.delete('/admin/palabra/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const existente = await obtenerPalabraPorId(id);
        if (!existente) return res.status(404).json({ error: 'La palabra no existe.' });

        await eliminarPalabra(id);
        res.json({ mensaje: 'Palabra eliminada correctamente.' });
    } catch (error) {
        console.error('Error al eliminar palabra:', error);
        res.status(500).json({ error: 'No se pudo eliminar la palabra.' });
    }
});

export default router;
