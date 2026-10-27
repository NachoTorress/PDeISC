/** Prepara la foto en el navegador (archivo elegido como Blob). */
import type { ImagePickerAsset } from "expo-image-picker";
import { selectedPhoto } from "./photoUpload";

export async function preparePhoto(asset: ImagePickerAsset): Promise<Blob> {
  const file = await selectedPhoto(asset);
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width * bitmap.height > 40_000_000)
      throw new Error(
        "La resolución de esta foto es demasiado grande. Elegí otra de hasta 40 megapíxeles.",
      );
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("No pudimos preparar la foto. Volvé a elegirla.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) =>
          value
            ? resolve(value)
            : reject(new Error("No pudimos preparar la foto.")),
        "image/jpeg",
        0.85,
      ),
    );
  } finally {
    bitmap.close();
  }
}
