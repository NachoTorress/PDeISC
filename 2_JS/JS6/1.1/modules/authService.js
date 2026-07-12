/**
 * modules/authService.js
 * -------------------------------------------------------
 * De donde viene: lo llama modules/routes/authRoutes.js con
 *                  el usuario/contraseña que llega del
 *                  formulario de login del panel de admin.
 * A donde va:     consulta la tabla "usuarios" en MySQL y
 *                  compara la contraseña con bcrypt (nunca
 *                  se guarda ni se compara en texto plano).
 * -------------------------------------------------------
 */

import bcrypt from 'bcryptjs';
import pool from './db.js';

/**
 * Verifica las credenciales de un usuario administrador.
 * @param {string} usuario
 * @param {string} contrasena
 * @returns {Promise<{id: number, usuario: string}|null>} el usuario si es valido, o null
 */
export async function verificarCredenciales(usuario, contrasena) {
    const [filas] = await pool.query(
        'SELECT id, usuario, password_hash FROM usuarios WHERE usuario = ?',
        [usuario]
    );

    const usuarioEncontrado = filas[0];
    if (!usuarioEncontrado) return null;

    const coincide = await bcrypt.compare(contrasena, usuarioEncontrado.password_hash);
    if (!coincide) return null;

    return { id: usuarioEncontrado.id, usuario: usuarioEncontrado.usuario };
}
