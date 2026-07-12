/**
 * modules/routes/authRoutes.js
 * -------------------------------------------------------
 * De donde viene: el front del panel de admin
 *                  (scripts/adminAuth.js) llama a estas rutas
 *                  desde el formulario de login y el boton
 *                  de logout.
 * A donde va:     usa modules/authService.js para verificar
 *                  credenciales contra MySQL, y guarda el
 *                  estado de sesion en la cookie que maneja
 *                  express-session (configurado en server.js).
 * -------------------------------------------------------
 */

import { Router } from 'express';
import { verificarCredenciales } from '../authService.js';
import { validarUsuarioLogin } from '../validators.js';

const router = Router();

/**
 * POST /api/auth/login
 * Body esperado: { usuario, contrasena }
 * Si las credenciales son correctas, guarda la sesion en la cookie.
 */
router.post('/auth/login', async (req, res) => {
    const { usuario, contrasena } = req.body;

    const errorUsuario = validarUsuarioLogin(usuario);
    if (errorUsuario) return res.status(400).json({ error: errorUsuario });

    if (typeof contrasena !== 'string' || contrasena.length === 0) {
        return res.status(400).json({ error: 'La contraseña es obligatoria.' });
    }

    try {
        const usuarioValido = await verificarCredenciales(usuario.trim(), contrasena);
        if (!usuarioValido) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        // Regeneramos la sesion para evitar "session fixation".
        req.session.regenerate((error) => {
            if (error) {
                console.error('Error al regenerar sesion:', error);
                return res.status(500).json({ error: 'No se pudo iniciar sesion.' });
            }
            req.session.usuarioId = usuarioValido.id;
            req.session.usuario = usuarioValido.usuario;
            res.json({ usuario: usuarioValido.usuario });
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'No se pudo iniciar sesion.' });
    }
});

/**
 * POST /api/auth/logout
 * Destruye la sesion actual y limpia la cookie.
 */
router.post('/auth/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error('Error al cerrar sesion:', error);
            return res.status(500).json({ error: 'No se pudo cerrar sesion.' });
        }
        res.clearCookie('ahorcado.sid');
        res.json({ mensaje: 'Sesion cerrada correctamente.' });
    });
});

/**
 * GET /api/auth/sesion
 * Le permite al front saber si ya hay una sesion activa
 * (por ejemplo, al recargar la pagina del admin).
 */
router.get('/auth/sesion', (req, res) => {
    if (req.session && req.session.usuarioId) {
        return res.json({ autenticado: true, usuario: req.session.usuario });
    }
    res.json({ autenticado: false });
});

/**
 * POST /api/auth/olvide-password
 * No permite resetear la contraseña de verdad: solo informa
 * que hay que contactar a la administracion del sistema.
 */
router.post('/auth/olvide-password', (req, res) => {
    res.json({
        mensaje: 'Para recuperar el acceso a tu cuenta, contactate con la administracion del sistema.',
    });
});

export default router;
