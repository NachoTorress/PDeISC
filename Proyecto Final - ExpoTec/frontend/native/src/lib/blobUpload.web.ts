import { put } from "@vercel/blob/client";
import type { PhotoUploadOptions } from "./blobUpload";

export async function putPhoto(
  pathname: string,
  body: Blob,
  options: PhotoUploadOptions,
) {
  await put(pathname, body, {
    access: "private",
    token: options.token,
    contentType: body.type,
    abortSignal: options.signal,
    onUploadProgress: ({ percentage }) => options.progress(percentage),
  });
}
