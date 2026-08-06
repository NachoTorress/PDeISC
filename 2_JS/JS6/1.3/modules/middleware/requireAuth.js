/**
 * modules/middleware/requireAuth.js
 * -------------------------------------------------------
 * De donde viene: Express llama a este middleware antes de
 *                  cualquier ruta protegida (admin de palabras
 *                  y admin de scores).
 * A donde va:     si la sesion (cookie) tiene un usuario
 *                  logueado, deja pasar la peticion (next());
 *                  si no, corta con 401.
 * -------------------------------------------------------
 */

/**
 * Exige que exista una sesion de administrador activa.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requireAuth(req, res, next) {
    if (req.session && req.session.usuarioId) {
        return next();
    }
    res.status(401).json({ error: 'Tenes que iniciar sesion para hacer esto.' });
}
