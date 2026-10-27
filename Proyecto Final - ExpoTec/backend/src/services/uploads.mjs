/**
 * Servicio de carga de imágenes: autoriza la subida directa a Vercel Blob,
 * valida el contenido real, lo optimiza a JPEG y controla quién puede verlo.
 */
import { randomUUID } from 'node:crypto';
import { get, put, del } from '@vercel/blob';
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';
import sharp from 'sharp';
import { HttpError } from '../lib/errors.mjs';
import { objectBody, userId } from '../validators/auth.mjs';
import { managedImageId } from '../repositories/uploads.mjs';

/** Tamaño máximo aceptado: 10 MB. */
export const maximumImageBytes = 10 * 1024 * 1024;
export const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];
const unavailable = () => new HttpError(404, 'IMAGE_NOT_FOUND', 'No encontramos esa imagen o no tenés acceso.');
const invalid = () => new HttpError(422, 'IMAGE_INVALID', 'Elegí una foto JPG, PNG o WebP válida de hasta 10 MB.');
/** Valida el formato real y reduce la imagen a JPEG de hasta 1600 px. */
export async function optimizeImage(bytes) {
  if (!bytes.length || bytes.length > maximumImageBytes) throw invalid();
  try {
    const input = sharp(bytes, { limitInputPixels: 40_000_000, animated: false, failOn: 'warning' });
    const metadata = await input.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages ?? 1) > 1) throw invalid();
    const output = await input.rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    if (output.length > 2 * 1024 * 1024) throw invalid();
    return output;
  } catch { throw invalid(); }
}

/** Acceso al almacenamiento privado de Vercel Blob. */
export const blobStorage = {
  enabled: () => Boolean(process.env.BLOB_READ_WRITE_TOKEN),
  token: options => generateClientTokenFromReadWriteToken(options),
  async read(pathname, maximum = maximumImageBytes) {
    const result = await get(pathname, { access: 'private', useCache: false, abortSignal: AbortSignal.timeout(20000) });
    if (!result || result.statusCode !== 200) throw unavailable();
    if (result.blob.size > maximum) { await result.stream.cancel(); throw invalid(); }
    const chunks = []; let size = 0;
    for await (const chunk of result.stream) {
      size += chunk.length;
      if (size > maximum) throw invalid();
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  },
  write: (pathname, bytes) => put(pathname, bytes, { access: 'private', contentType: 'image/jpeg', addRandomSuffix: false, allowOverwrite: false }),
  remove: paths => del(paths),
};

/** Crea el servicio de cargas. */
export function createUploadsService(repository, config, storage = blobStorage) {
  const origin = config.social?.webOrigin ?? config.origins[0];
  return {
    /** Autoriza una carga y entrega un token temporal de 10 minutos. */
    async prepare(body, user) {
      objectBody(body, ['purpose', 'contentType', 'size']);
      if (!['gallery', 'project'].includes(body.purpose) || !imageTypes.includes(body.contentType) ||
          !Number.isSafeInteger(body.size) || body.size < 1 || body.size > maximumImageBytes) throw invalid();
      if (body.purpose === 'project' && !user.roles.includes('student'))
        throw new HttpError(403, 'FORBIDDEN', 'Necesitás una cuenta de alumno para subir fotos de proyectos.');
      if (!storage.enabled()) throw new HttpError(503, 'UPLOADS_UNAVAILABLE', 'La carga de fotos todavía no está disponible. Podés usar un enlace.');
      const id = randomUUID(), ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[body.contentType];
      const image = { id, ownerId: user.id, purpose: body.purpose, rawPath: `incoming/${user.id}/${id}.${ext}`, imagePath: `images/${id}.jpg`, imageUrl: `${origin}/api/uploads/${id}/image` };
      const clientToken = await storage.token({ pathname: image.rawPath, maximumSizeInBytes: maximumImageBytes,
        allowedContentTypes: [body.contentType], addRandomSuffix: false, allowOverwrite: false, validUntil: Date.now() + 10 * 60 * 1000 });
      await repository.create(image);
      return { id, pathname: image.rawPath, clientToken };
    },
    /** Procesa la carga y devuelve la URL definitiva de la imagen. */
    async complete(body, user) {
      objectBody(body, ['id']);
      const image = await repository.get(userId(body.id));
      if (!image || image.ownerId !== user.id) throw unavailable();
      if (image.status === 'ready') return { imageUrl: image.imageUrl };
      if (!(await repository.claim(image.id, user.id))) throw new HttpError(409, 'UPLOAD_CHANGED', 'Esta carga venció o ya está en proceso. Volvé a elegir la foto.');
      try {
        const bytes = await optimizeImage(await storage.read(image.rawPath));
        await storage.write(image.imagePath, bytes);
        await repository.finish(image.id, 'ready');
        await storage.remove([image.rawPath]).catch(() => {});
        return { imageUrl: image.imageUrl };
      } catch (error) {
        await repository.finish(image.id, 'failed');
        await storage.remove([image.rawPath, image.imagePath]).catch(() => {});
        if (error instanceof HttpError) throw error;
        throw new HttpError(503, 'UPLOAD_FAILED', 'No pudimos guardar la foto. Volvé a elegirla e intentá de nuevo.');
      }
    },
    /** Vista previa privada en base64 para el autor o administración. */
    async preview(body, user) {
      objectBody(body, ['imageUrl']);
      const id = managedImageId(body.imageUrl);
      if (!id) throw unavailable();
      const image = await repository.get(id);
      if (!image || image.status !== 'ready' || image.imageUrl !== body.imageUrl || !(await repository.mayRead(image, user))) throw unavailable();
      return { image: `data:image/jpeg;base64,${(await storage.read(image.imagePath, 2 * 1024 * 1024)).toString('base64')}` };
    },
    /** Bytes de una imagen publicada. */
    async publicImage(id) {
      const image = await repository.publicImage(userId(id));
      if (!image) throw unavailable();
      return storage.read(image.imagePath, 2 * 1024 * 1024);
    },
  };
}
