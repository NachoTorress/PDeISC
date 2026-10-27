/** Imagen de proyecto a partir de datos base64 (vista previa local). */
const alphabet =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Verifica bytes y cabecera real antes de construir el data URI que guarda el proyecto. */
export function projectImageFromBase64(data: string): {
  image: string;
  error: string;
} {
  const invalid = {
    image: "",
    error: "Elegí una imagen PNG, JPG o WebP de hasta 2 MB.",
  };
  if (!data || data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data))
    return invalid;
  const bytes =
    (data.length * 3) / 4 -
    (data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0);
  if (bytes > 2 * 1024 * 1024) return invalid;
  const header: number[] = [];
  for (let offset = 0; offset < Math.min(data.length, 16); offset += 4) {
    const values = [...data.slice(offset, offset + 4)].map((character) =>
      alphabet.indexOf(character),
    );
    header.push((values[0] << 2) | (values[1] >> 4));
    if (values[2] >= 0) header.push(((values[1] & 15) << 4) | (values[2] >> 2));
    if (values[3] >= 0) header.push(((values[2] & 3) << 6) | values[3]);
  }
  const matches = (signature: number[], offset = 0) =>
    signature.every((byte, index) => header[offset + index] === byte);
  const mime = matches([0xff, 0xd8, 0xff])
    ? "image/jpeg"
    : matches([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ? "image/png"
      : matches([0x52, 0x49, 0x46, 0x46]) &&
          matches([0x57, 0x45, 0x42, 0x50], 8)
        ? "image/webp"
        : "";
  return mime ? { image: `data:${mime};base64,${data}`, error: "" } : invalid;
}
