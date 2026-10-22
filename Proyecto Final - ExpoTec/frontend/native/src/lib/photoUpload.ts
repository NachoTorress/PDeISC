import type { ImagePickerAsset } from "expo-image-picker";
import { put } from "@vercel/blob/client";

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
  const body = asset.file ?? (await (await fetch(asset.uri)).blob());
  validatePhoto(body.type, body.size);
  return body;
}
export async function uploadPhoto(
  body: Blob,
  purpose: PhotoPurpose,
  send: PhotoSender,
  progress: (percent: number) => void,
  signal: AbortSignal,
) {
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
  signal.throwIfAborted();
  await put(prepared.pathname, body, {
    access: "private",
    token: prepared.clientToken,
    contentType: body.type,
    abortSignal: signal,
    onUploadProgress: ({ percentage }) =>
      progress(Math.round(percentage * 0.9)),
  });
  signal.throwIfAborted();
  progress(95);
  const result = await send<{ imageUrl: string }>("/api/uploads/complete", {
    id: prepared.id,
  });
  signal.throwIfAborted();
  progress(100);
  return result.imageUrl;
}
