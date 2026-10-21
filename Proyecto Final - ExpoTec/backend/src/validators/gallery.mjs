import { HttpError } from '../lib/errors.mjs';
import { objectBody, pagination } from './auth.mjs';
import { httpsLinkError } from './projects.mjs';
import { spaceVersion } from './spaces.mjs';

export function galleryQuery(body, admin = false) {
  objectBody(body, ['limit', 'offset', ...(admin ? ['status'] : [])]);
  const { status, ...page } = body;
  const result = pagination(page);
  if (admin) {
    result.status = status ?? 'pending';
    if (!['pending', 'approved', 'rejected', 'all'].includes(result.status))
      throw new HttpError(400, 'VALIDATION_ERROR', 'Elegí un estado válido para la galería.');
  }
  return result;
}

export function galleryPhoto(body) {
  objectBody(body, ['imageUrl', 'caption']);
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : body.imageUrl;
  const caption = typeof body.caption === 'string' ? body.caption.trim().normalize('NFC') : '';
  const fields = {};
  const error = httpsLinkError(imageUrl, true);
  if (error) fields.imageUrl = error;
  if (caption.length < 5 || caption.length > 400 || /[\p{Cc}]/u.test(caption))
    fields.caption = 'Describí la foto con entre 5 y 400 caracteres, en una sola línea.';
  if (Object.keys(fields).length) throw new HttpError(400, 'VALIDATION_ERROR', 'Revisá los datos de la foto.', fields);
  return { imageUrl, caption };
}

export function galleryReview(body) {
  objectBody(body, ['version', 'decision', 'note']);
  const version = spaceVersion(body.version);
  const note = typeof body.note === 'string' ? body.note.trim().normalize('NFC') : '';
  if (!['approved', 'rejected'].includes(body.decision) ||
      (body.note !== undefined && typeof body.note !== 'string') || note.length > 1000 ||
      (body.decision === 'rejected' && note.length < 10))
    throw new HttpError(400, 'VALIDATION_ERROR', 'Para rechazar o retirar una foto indicá un motivo de 10 a 1000 caracteres.');
  return { version, decision: body.decision, note };
}
