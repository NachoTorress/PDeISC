/** Prepara la foto en Android: la reduce y comprime antes de subirla. */
import type { ImagePickerAsset } from "expo-image-picker";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import type { ImageManipulatorContext, ImageRef } from "expo-image-manipulator";
import { maximumPhotoBytes, validatePhoto } from "./photoUpload";
import { photoResize } from "./photoUploadBody";
import type { LocalPhoto } from "./photoUploadBody";

/** Borra un archivo temporal sin interrumpir si falla. */
function discardPhoto(file?: File) {
  try {
    if (file?.exists) file.delete();
  } catch {
    // El sistema puede haber retirado este archivo de caché.
  }
}

/** Devuelve un JPEG temporal listo para subir. */
export async function preparePhoto(
  asset: ImagePickerAsset,
): Promise<LocalPhoto> {
  if (!/^(?:file|content):\/\//.test(asset.uri))
    throw new Error(
      "No pudimos abrir esa foto. Volvé a elegirla de la galería.",
    );
  if (asset.fileSize !== undefined && asset.fileSize > maximumPhotoBytes)
    throw new Error("Elegí una foto de hasta 10 MB.");
  const resize = photoResize(asset.width, asset.height);
  const contexts: ImageManipulatorContext[] = [];
  const images: ImageRef[] = [];
  let saved: File | undefined;
  try {
    const context = ImageManipulator.manipulate(asset.uri);
    contexts.push(context);
    if (resize) context.resize(resize);
    let image = await context.renderAsync();
    images.push(image);
    // Algunos proveedores no informan dimensiones al seleccionar la foto.
    const decodedResize = photoResize(image.width, image.height);
    if (decodedResize) {
      const reduced = ImageManipulator.manipulate(image).resize(decodedResize);
      contexts.push(reduced);
      image = await reduced.renderAsync();
      images.push(image);
    }
    const result = await image.saveAsync({
      format: SaveFormat.JPEG,
      compress: 0.85,
    });
    saved = new File(result.uri);
    const size = saved.size ?? 0;
    validatePhoto("image/jpeg", size);
    const photo = saved;
    return {
      uri: result.uri,
      type: "image/jpeg",
      size,
      dispose: () => discardPhoto(photo),
    };
  } catch (cause) {
    discardPhoto(saved);
    if (cause instanceof Error && /10 MB|40 megapíxeles/.test(cause.message))
      throw cause;
    throw new Error(
      "No pudimos preparar esa foto. Elegí otra imagen de la galería.",
    );
  } finally {
    images.reverse().forEach((image) => image.release());
    contexts.reverse().forEach((context) => context.release());
  }
}
