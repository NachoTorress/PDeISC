/**
 * modules/routes/logRoutes.js
 * -------------------------------------------------------
 * De donde viene: el panel de admin (scripts/adminLogs.js)
 *                  pide estos listados apenas el admin inicia
 *                  sesion, para mostrar el historial en pantalla.
 * A donde va:     ambas rutas pasan primero por requireAuth
 *                  (solo un admin logueado puede verlas) y
 *                  delegan la lectura a modules/logService.js.
 * -------------------------------------------------------
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { formatearFechaHora } from '../dateUtils.js';
import { obtenerLogsDescargas, obtenerLogsLogins } from '../logService.js';

const router = Router();

// Todas las rutas de este archivo requieren sesion de administrador.
router.use(requireAuth);

/**
 * GET /api/admin/logs/descargas
 * Devuelve el historial de PDFs descargados (score individual y
 * tabla de posiciones historica), mas recientes primero.
 */
router.get('/admin/logs/descargas', async (req, res) => {
    try {
        const logs = await obtenerLogsDescargas();
        res.json(logs.map((log) => ({ ...log, fechaFormateada: formatearFechaHora(log.fecha) })));
    } catch (error) {
        console.error('Error al obtener el log de descargas:', error);
        res.status(500).json({ error: 'No se pudo obtener el log de descargas.' });
    }
});

/**
 * GET /api/admin/logs/logins
 * Devuelve el historial de inicios de sesion del panel de
 * administracion, mas recientes primero.
 */
router.get('/admin/logs/logins', async (req, res) => {
    try {
        const logs = await obtenerLogsLogins();
        res.json(logs.map((log) => ({ ...log, fechaFormateada: formatearFechaHora(log.fecha) })));
    } catch (error) {
        console.error('Error al obtener el log de logins:', error);
        res.status(500).json({ error: 'No se pudo obtener el log de logins.' });
    }
});

export default router;
