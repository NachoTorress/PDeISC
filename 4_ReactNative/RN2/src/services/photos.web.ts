/** Expo Camera entrega una imagen data URI en web; se conserva junto al registro. */
export async function persistPhoto(uri: string, _id: string): Promise<string> {
  if (!uri.startsWith('data:image/')) throw new Error('La cámara no devolvió una imagen válida.');
  return uri;
}

export async function removePhoto(_uri: string): Promise<void> {}
