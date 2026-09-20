import { createHttpError } from '../utils/httpError.js';
import { verifyToken } from '../utils/token.js';
import { getUserById } from '../services/userService.js';

export async function protect(req, _res, next) {
  try {
    const header = req.headers.authorization ?? '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      throw createHttpError(401, 'Token ausente o inválido.');
    }

    const payload = verifyToken(token);
    const user = await getUserById(payload.sub);

    if (!user || user.status !== 'active') {
      throw createHttpError(401, 'La sesión no es válida.');
    }

    req.user = user;
    next();
  } catch (error) {
    next(createHttpError(401, 'La sesión no es válida.'));
  }
}

