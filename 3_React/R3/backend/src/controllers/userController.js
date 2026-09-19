import { createHttpError } from '../utils/httpError.js';
import {
  hasValidationErrors,
  validateUserPayload,
} from '../validators/authValidators.js';
import {
  createUser,
  deleteUser,
  getUserById,
  listUsers,
  updateUser,
} from '../services/userService.js';

function ensureCanRead(actor, targetId) {
  if (actor.role !== 'admin' && Number(actor.id) !== Number(targetId)) {
    throw createHttpError(403, 'No tenés permisos para ver ese usuario.');
  }
}

function ensureCanWrite(actor, targetId) {
  if (actor.role !== 'admin' && Number(actor.id) !== Number(targetId)) {
    throw createHttpError(403, 'No tenés permisos para modificar ese usuario.');
  }
}

export async function index(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      const user = await getUserById(req.user.id);
      res.json({ users: [user] });
      return;
    }

    const users = await listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
}

export async function show(req, res, next) {
  try {
    ensureCanRead(req.user, req.params.id);
    const user = await getUserById(req.params.id);

    if (!user) {
      throw createHttpError(404, 'Usuario no encontrado.');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function store(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw createHttpError(403, 'Solo administradores pueden crear usuarios desde el panel.');
    }

    const { data, errors } = validateUserPayload(req.body, {
      requirePassword: true,
      allowRole: true,
      allowStatus: true,
    });

    if (hasValidationErrors(errors)) {
      throw createHttpError(422, 'Revisá los datos del formulario.', errors);
    }

    const user = await createUser(data);
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
}

export async function update(req, res, next) {
  try {
    ensureCanWrite(req.user, req.params.id);

    const isAdmin = req.user.role === 'admin';
    const { data, errors } = validateUserPayload(req.body, {
      partial: true,
      allowRole: isAdmin,
      allowStatus: isAdmin,
    });

    if (hasValidationErrors(errors)) {
      throw createHttpError(422, 'Revisá los datos del formulario.', errors);
    }

    if (!isAdmin) {
      delete data.role;
      delete data.status;
    }

    const user = await updateUser(req.params.id, data);
    res.json({ user });
  } catch (error) {
    next(error);
  }
}

export async function destroy(req, res, next) {
  try {
    if (req.user.role !== 'admin') {
      throw createHttpError(403, 'Solo administradores pueden eliminar usuarios.');
    }

    await deleteUser(req.params.id, req.user.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

