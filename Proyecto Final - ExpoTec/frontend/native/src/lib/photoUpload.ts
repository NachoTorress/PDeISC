/** Carga de fotos a la API: validación, permiso, subida directa y procesamiento en el servidor. */
import type { ImagePickerAsset } from "expo-image-picker";
import { putPhoto } from "./blobUpload";
import { assertPhotoActive, localPhoto } from "./photoUploadBody";
import type { PhotoBody } from "./photoUploadBody";
import type { ApiCall } from "./authTypes";

/** Destino de la foto: galería o proyecto. */
export type PhotoPurpose = "gallery" | "project";
export type PhotoSender = ApiCall;
/** Formatos aceptados. */
export const photoTypes = ["image/jpeg", "image/png", "image/webp"];
export const maximumPhotoBytes = 10 * 1024 * 1024;
/** Valida formato y tamaño (hasta 10 MB). */
export function validatePhoto(type: string, size: number) {
  if (
    !photoTypes.includes(type) ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > maximumPhotoBytes
  )
    throw new Error("Elegí una foto JPG, PNG o WebP de hasta 10 MB.");
}
/** Indica si una URL es una imagen subida a ExpoTec. */
export function managedPhoto(value: string) {
  try {
    return /^\/api\/uploads\/[a-f0-9-]{36}\/image$/.test(
      new URL(value).pathname,
    );
  } catch {
    return false;
  }
}
/** Obtiene el archivo elegido en el selector de imágenes. */
export async function selectedPhoto(asset: ImagePickerAsset): Promise<Blob> {
  let body = asset.file ?? (await (await fetch(asset.uri)).blob());
  if (
    (!body.type || body.type === "application/octet-stream") &&
    asset.mimeType
  )
    body = body.slice(0, body.size, asset.mimeType);
  validatePhoto(body.type, body.size);
  return body;
}
/**
 * Sube una foto: `POST /api/uploads` (permiso), subida directa al almacenamiento
 * y `POST /api/uploads/:id/complete`. Devuelve la URL definitiva.
 */
export async function uploadPhoto(
  body: PhotoBody,
  purpose: PhotoPurpose,
  send: PhotoSender,
  progress: (percent: number) => void,
  signal: AbortSignal,
) {
  try {
    assertPhotoActive(signal);
    validatePhoto(body.type, body.size);
    const prepared = await send<{
      id: string;
      pathname: string;
      clientToken: string;
    }>("/api/uploads", {
      purpose,
      size: body.size,
      contentType: body.type,
    }, "POST");
    assertPhotoActive(signal);
    await putPhoto(prepared.pathname, body, {
      token: prepared.clientToken,
      signal,
      progress: (percentage) => progress(Math.round(percentage * 0.9)),
    });
    assertPhotoActive(signal);
    progress(95);
    // El servidor valida el contenido real, lo optimiza y devuelve la URL definitiva.
    const result = await send<{ imageUrl: string }>(
      `/api/uploads/${prepared.id}/complete`,
      {},
      "POST",
    );
    assertPhotoActive(signal);
    progress(100);
    return result.imageUrl;
  } finally {
    if (localPhoto(body)) body.dispose();
  }
}
