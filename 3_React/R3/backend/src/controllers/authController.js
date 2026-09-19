import { createHttpError } from '../utils/httpError.js';
import { comparePassword } from '../utils/password.js';
import { signToken } from '../utils/token.js';
import {
  hasValidationErrors,
  validateLoginPayload,
  validateUserPayload,
} from '../validators/authValidators.js';
import {
  createUser,
  getUserById,
  getUserWithPasswordByEmail,
} from '../services/userService.js';

function buildAuthResponse(user) {
  return {
    user,
    token: signToken(user),
  };
}

export async function register(req, res, next) {
  try {
    const { data, errors } = validateUserPayload(req.body, {
      requirePassword: true,
    });

    if (hasValidationErrors(errors)) {
      throw createHttpError(422, 'Revisá los datos del formulario.', errors);
    }

    const user = await createUser(data);
    res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { data, errors } = validateLoginPayload(req.body);

    if (hasValidationErrors(errors)) {
      throw createHttpError(422, 'Revisá los datos del formulario.', errors);
    }

    const account = await getUserWithPasswordByEmail(data.email);

    if (!account || account.status !== 'active') {
      throw createHttpError(401, 'Credenciales inválidas.');
    }

    const passwordMatches = await comparePassword(data.password, account.password_hash);

    if (!passwordMatches) {
      throw createHttpError(401, 'Credenciales inválidas.');
    }

    const user = await getUserById(account.user_id);
    res.json(buildAuthResponse(user));
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await getUserById(req.user.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export function logout(_req, res) {
  res.json({ message: 'Sesión cerrada correctamente.' });
}

