import { HttpError } from '../lib/errors.mjs';
import { objectBody, userId } from './auth.mjs';
import { spaceVersion } from './spaces.mjs';

function invalid(fields) {
  if (Object.keys(fields).length) throw new HttpError(400, 'VALIDATION_ERROR', 'Revisá los datos del proyecto.', fields);
}
export function httpsLinkError(value, required = false, kind = '') {
  if (typeof value !== 'string' || value.length > 2048) return 'Usá un enlace de hasta 2048 caracteres.';
  if (!value) return required ? 'Ingresá un enlace HTTPS.' : '';
  try {
    const url = new URL(value);
    if (!/^https:\/\//i.test(value) || url.protocol !== 'https:' || url.username || url.password || /[\s\p{Cc}]/u.test(value)) throw new Error();
    if (kind === 'github' && (!['github.com', 'www.github.com'].includes(url.hostname) || !/^\/[^/]+\/[^/]+(?:\/|$)/.test(url.pathname)))
      return 'Usá un repositorio de github.com con usuario y proyecto.';
    if (kind === 'video' && !/\.(mp4|webm)$/i.test(url.pathname)) return 'Usá un enlace directo a un video MP4 o WebM.';
    return '';
  } catch { return 'Usá una URL HTTPS completa, sin credenciales ni espacios.'; }
}
export function proposalBody(body, editing = false) {
  objectBody(body, ['name', 'description', 'course', 'imageUrl', 'videoUrl', 'isSoftwareProject', 'githubUrl', 'websiteUrl', 'memberIds', 'teacherIds', 'subjects', 'boothId', ...(editing ? ['version'] : [])]);
  const fields = {}, result = {};
  for (const [key, min, max] of [['name', 2, 120], ['description', 20, 5000], ['course', 2, 100]]) {
    result[key] = typeof body[key] === 'string' ? body[key].trim().normalize('NFC') : '';
    if (result[key].length < min || result[key].length > max || (key !== 'description' && /[\p{Cc}]/u.test(result[key])))
      fields[key] = `Usá entre ${min} y ${max} caracteres.`;
  }
  for (const [key, kind] of [['imageUrl', 'image'], ['videoUrl', 'video'], ['githubUrl', 'github'], ['websiteUrl', 'website']]) {
    result[key] = typeof body[key] === 'string' ? body[key].trim() : body[key];
    const error = httpsLinkError(result[key], key === 'imageUrl', kind);
    if (error) fields[key] = error;
  }
  if (typeof body.isSoftwareProject !== 'boolean') fields.isSoftwareProject = 'Indicá si es un proyecto informático.';
  result.isSoftwareProject = body.isSoftwareProject;
  if (!body.isSoftwareProject && (result.githubUrl || result.websiteUrl)) fields.isSoftwareProject = 'Activá proyecto informático para agregar esos enlaces.';
  for (const [key, max] of [['memberIds', 12], ['teacherIds', 5]]) {
    if (!Array.isArray(body[key]) || !body[key].length || body[key].length > max || new Set(body[key]).size !== body[key].length)
      fields[key] = `Elegí entre 1 y ${max} cuentas distintas.`;
    else {
      try { result[key] = body[key].map(userId); }
      catch { fields[key] = 'Las cuentas seleccionadas no son válidas.'; }
    }
  }
  if (!Array.isArray(body.subjects) || !body.subjects.length || body.subjects.length > 10 || body.subjects.some(value => typeof value !== 'string')) fields.subjects = 'Agregá entre 1 y 10 materias.';
  else {
    result.subjects = body.subjects.map(value => value.trim().normalize('NFC'));
    const keys = result.subjects.map(value => value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase());
    if (result.subjects.some(value => value.length < 2 || value.length > 80 || /\p{Cc}/u.test(value)) || new Set(keys).size !== keys.length)
      fields.subjects = 'Usá materias distintas de 2 a 80 caracteres.';
  }
  try { result.boothId = userId(body.boothId); } catch { fields.boothId = 'Elegí un puesto habilitado.'; }
  invalid(fields);
  if (editing) result.version = spaceVersion(body.version);
  return result;
}
export function reviewBody(body) {
  objectBody(body, ['version', 'action', 'note']);
  const version = spaceVersion(body.version);
  const note = typeof body.note === 'string' ? body.note.trim().normalize('NFC') : '';
  if ((body.note !== undefined && typeof body.note !== 'string') || !['approve', 'changes', 'reopen'].includes(body.action) || note.length > 2000 || (body.action !== 'approve' && note.length < 10))
    throw new HttpError(400, 'VALIDATION_ERROR', 'Elegí una revisión válida. Para solicitar cambios o reabrir, indicá un motivo de 10 a 2000 caracteres.');
  return { version, action: body.action, note };
}
export function personBody(body) {
  objectBody(body, ['email', 'role']);
  if (typeof body.email !== 'string' || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim()) || !['student', 'teacher'].includes(body.role))
    throw new HttpError(400, 'VALIDATION_ERROR', 'Ingresá el correo exacto de una cuenta y el tipo de participante.');
  return { email: body.email.trim().toLowerCase(), role: body.role };
}
