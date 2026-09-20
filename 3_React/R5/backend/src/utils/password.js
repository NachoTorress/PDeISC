import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

/**
 * Origen: datos recibidos por registro o alta de usuario.
 * Destino: columna password_hash de user_accounts.
 */
export function hashPassword(password) {
  return bcrypt.hash(password, env.saltRounds);
}

/**
 * Origen: login de usuario.
 * Destino: comparacion segura contra el hash guardado.
 */
export function comparePassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

