import { Directory, File, Paths } from 'expo-file-system';
import { isOwnedPhotoUri } from '../utils/validation';

const photoDirectory = new Directory(Paths.document, 'pulso-photos');

/** Copia de la caché de cámara al almacenamiento privado permanente de la app. */
export async function persistPhoto(uri: string, id: string): Promise<string> {
  photoDirectory.create({ idempotent: true, intermediates: true });
  const destination = new File(photoDirectory, `${id}.jpg`);
  new File(uri).copy(destination);
  return destination.uri;
}

/** Solo elimina archivos que pertenecen a Pulso; nunca acepta rutas externas. */
export async function removePhoto(uri: string): Promise<void> {
  if (!isOwnedPhotoUri(uri, photoDirectory.uri)) return;
  const file = new File(uri);
  if (file.exists) file.delete();
}
