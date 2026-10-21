import { sharedLinkError } from "./sharedProjects";

export type GalleryStatus = "pending" | "approved" | "rejected";
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
export const galleryStatusLabel: Record<GalleryStatus, string> = {
  pending: "Pendiente de aprobación",
  approved: "Publicada",
  rejected: "No publicada",
};
export function galleryPhotoErrors(input: { imageUrl: string; caption: string }) {
  const errors: Record<string, string> = {};
  const urlError = sharedLinkError(input.imageUrl.trim(), true);
  if (urlError) errors.imageUrl = urlError;
  const caption = input.caption.trim();
  if (caption.length < 5 || caption.length > 400 || /[\p{Cc}]/u.test(caption))
    errors.caption = "Describí la foto con entre 5 y 400 caracteres, en una sola línea.";
  return errors;
}
