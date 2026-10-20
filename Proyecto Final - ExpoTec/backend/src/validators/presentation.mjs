import { objectBody, userId } from './auth.mjs';
import { HttpError } from '../lib/errors.mjs';

export function presentationQuery(body) {
  objectBody(body, ['limit', 'after']);
  const limit = body.limit === undefined ? 100 : body.limit;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100)
    throw new HttpError(400, 'VALIDATION_ERROR', 'La página admite entre 1 y 100 proyectos.');
  return { limit, after: body.after === undefined ? undefined : userId(body.after) };
}
