/** Tipos y validaciones de la galería compartida. */
import { sharedLinkError } from "./sharedProjects";

/** Estado de moderación de una foto. */
export type GalleryStatus = "pending" | "approved" | "rejected";
/** Foto tal como la devuelve `GET /api/gallery`. */
export interface GalleryPhoto {
  id: string;
  imageUrl: string;
  caption: string;
  authorName: string;
  createdAt: string;
  status?: GalleryStatus;
  version?: number;
  updatedAt?: string;
  reviewNote?: string;
}
/** Texto visible de cada estado. */
export const galleryStatusLabel: Record<GalleryStatus, string> = {
  pending: "Pendiente de aprobación",
  approved: "Publicada",
  rejected: "No publicada",
};
/** Errores por campo del formulario de envío de fotos. */
export function galleryPhotoErrors(input: {
  imageUrl: string;
  caption: string;
}) {
  const errors: Record<string, string> = {};
  const urlError = input.imageUrl.trim()
    ? sharedLinkError(input.imageUrl.trim(), true)
    : "Elegí una foto o ingresá un enlace HTTPS.";
  if (urlError) errors.imageUrl = urlError;
  const caption = input.caption.trim();
  if (caption.length < 5 || caption.length > 400 || /[\p{Cc}]/u.test(caption))
    errors.caption =
      "Describí la foto con entre 5 y 400 caracteres, en una sola línea.";
  return errors;
}
