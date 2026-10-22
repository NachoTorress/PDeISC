import type { ImagePickerAsset } from "expo-image-picker";
import { selectedPhoto } from "./photoUpload";

export async function preparePhoto(asset: ImagePickerAsset): Promise<Blob> {
  if (asset.width * asset.height > 40_000_000)
    throw new Error(
      "La resolución de esta foto es demasiado grande. Elegí otra de hasta 40 megapíxeles.",
    );
  return selectedPhoto(asset);
}
