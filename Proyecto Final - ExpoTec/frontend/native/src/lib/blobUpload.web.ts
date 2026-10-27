/** Subida directa de fotos desde el navegador con el cliente oficial de Vercel Blob. */
import { put } from "@vercel/blob/client";
import type { PhotoUploadOptions } from "./blobUpload";
import type { PhotoBody } from "./photoUploadBody";
import { localPhoto } from "./photoUploadBody";

/** Sube el archivo con el token temporal entregado por la API. */
export async function putPhoto(
  pathname: string,
  body: PhotoBody,
  options: PhotoUploadOptions,
) {
  if (localPhoto(body)) throw new Error("Volvé a elegir la foto desde este navegador.");
  await put(pathname, body, {
    access: "private",
    token: options.token,
    contentType: body.type,
    abortSignal: options.signal,
    onUploadProgress: ({ percentage }) => options.progress(percentage),
  });
}
