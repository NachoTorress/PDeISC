export type LocalPhoto = {
  uri: string;
  type: "image/jpeg";
  size: number;
  dispose: () => void;
};

export type PhotoBody = Blob | LocalPhoto;

export function localPhoto(body: PhotoBody): body is LocalPhoto {
  return "uri" in body;
}

export function assertPhotoActive(signal: Pick<AbortSignal, "aborted">) {
  if (!signal.aborted) return;
  const error = new Error("Carga cancelada.");
  error.name = "AbortError";
  throw error;
}

export function photoResize(width: number, height: number) {
  if (width * height > 40_000_000)
    throw new Error(
      "La resolución de esta foto es demasiado grande. Elegí otra de hasta 40 megapíxeles.",
    );
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    return null;
  if (Math.max(width, height) <= 1600) return null;
  return width >= height ? { width: 1600 } : { height: 1600 };
}
