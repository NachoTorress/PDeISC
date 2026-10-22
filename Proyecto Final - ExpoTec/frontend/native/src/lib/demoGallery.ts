import type { DemoState, Role } from "./types";
import type { GalleryPhoto, GalleryStatus } from "./gallery";
import { projectImageFromBase64 } from "../components/projectImage";

export interface DemoGalleryPhoto extends GalleryPhoto {
  authorRole: Exclude<Role, "guest">;
  status: GalleryStatus;
}

export const demoGalleryAuthors: Record<Role, string> = {
  student: "Lucía Fernández",
  teacher: "Martín García",
  loans: "Responsable de elementos",
  admin: "Administrador de ejemplo",
  guest: "Invitado",
};

const examples: DemoGalleryPhoto[] = [
  {
    id: "demo-robot",
    imageUrl: "sample:robot",
    caption: "Robótica: imagen de ejemplo para recorrer la galería.",
    authorName: demoGalleryAuthors.student,
    authorRole: "student",
    createdAt: "2026-10-13",
    status: "approved",
  },
  {
    id: "demo-electronics-public",
    imageUrl: "sample:electronics",
    caption: "Circuitos y componentes: otra imagen de ejemplo de la galería.",
    authorName: demoGalleryAuthors.loans,
    authorRole: "loans",
    createdAt: "2026-10-13",
    status: "approved",
  },
  {
    id: "demo-circuit",
    imageUrl: "sample:electronics",
    caption: "Electrónica: un aporte de ejemplo pendiente de revisión.",
    authorName: demoGalleryAuthors.student,
    authorRole: "student",
    createdAt: "2026-10-13",
    status: "pending",
  },
  {
    id: "demo-review",
    imageUrl: "sample:robot",
    caption: "Otro encuadre de ejemplo para consultar la devolución.",
    authorName: demoGalleryAuthors.teacher,
    authorRole: "teacher",
    createdAt: "2026-10-13",
    status: "rejected",
    reviewNote: "Elegí otra foto donde se vea mejor el trabajo presentado.",
  },
];

/** Los dispositivos con datos anteriores reciben los ejemplos sin reemplazar sus proyectos. */
export function demoGalleryPhotos(state: DemoState): DemoGalleryPhoto[] {
  return state.galleryPhotos ?? examples;
}

export function demoGalleryImageError(
  image: string,
  allowExample = false,
): string {
  if (allowExample && ["sample:robot", "sample:electronics"].includes(image))
    return "";
  const encoded = /^data:image\/(?:jpeg|png|webp);base64,(.+)$/.exec(image);
  if (!encoded || projectImageFromBase64(encoded[1]).image !== image)
    return "Elegí una imagen PNG, JPG o WebP de hasta 2 MB.";
  return "";
}

export function demoCaptionError(caption: string): string {
  return caption.trim().length < 5 ||
    caption.trim().length > 400 ||
    /[\p{Cc}]/u.test(caption)
    ? "Describí la foto con entre 5 y 400 caracteres, en una sola línea."
    : "";
}
