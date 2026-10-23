import type { ImagePickerAsset } from "expo-image-picker";
import { putPhoto } from "./blobUpload";
import { assertPhotoActive, localPhoto } from "./photoUploadBody";
import type { PhotoBody } from "./photoUploadBody";

export type PhotoPurpose = "gallery" | "project";
export type PhotoSender = <T>(endpoint: string, body: object) => Promise<T>;
export const photoTypes = ["image/jpeg", "image/png", "image/webp"];
export const maximumPhotoBytes = 10 * 1024 * 1024;
export function validatePhoto(type: string, size: number) {
  if (
    !photoTypes.includes(type) ||
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > maximumPhotoBytes
  )
    throw new Error("Elegí una foto JPG, PNG o WebP de hasta 10 MB.");
}
export function managedPhoto(value: string) {
  try {
    return /^\/api\/uploads\/[a-f0-9-]{36}\/image$/.test(
      new URL(value).pathname,
    );
  } catch {
    return false;
  }
}
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
    }>("/api/uploads/prepare", {
      purpose,
      size: body.size,
      contentType: body.type,
    });
    assertPhotoActive(signal);
    await putPhoto(prepared.pathname, body, {
      token: prepared.clientToken,
      signal,
      progress: (percentage) => progress(Math.round(percentage * 0.9)),
    });
    assertPhotoActive(signal);
    progress(95);
    const result = await send<{ imageUrl: string }>("/api/uploads/complete", {
      id: prepared.id,
    });
    assertPhotoActive(signal);
    progress(100);
    return result.imageUrl;
  } finally {
    if (localPhoto(body)) body.dispose();
  }
}
