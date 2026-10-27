/** Pruebas unitarias de `gallery.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import test from "node:test";
import assert from "node:assert/strict";
import { galleryPhotoErrors } from "./gallery";

test("galería valida enlaces y descripción antes de enviar", () => {
  const input = { imageUrl: "https://example.com/expo.jpg", caption: "Visitamos la exposición" };
  assert.deepEqual(galleryPhotoErrors(input), {});
  assert.deepEqual(galleryPhotoErrors({ ...input, imageUrl: ` ${input.imageUrl} ` }), {});
  for (const imageUrl of ["", "http://example.com/foto.jpg", "javascript:alert(1)", "https://name:secret@example.com/foto.jpg"])
    assert.ok(galleryPhotoErrors({ ...input, imageUrl }).imageUrl);
  for (const caption of ["", "Hola", "Una\nfoto", "x".repeat(401)])
    assert.ok(galleryPhotoErrors({ ...input, caption }).caption);
});
