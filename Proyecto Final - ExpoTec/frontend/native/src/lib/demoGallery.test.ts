import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { applyMutation } from "./model";
import { demoGalleryPhotos } from "./demoGallery";
import { parseSavedState } from "./persistence";
import { seed } from "./seed";

test("la galería agrega ejemplos a datos anteriores sin modificar proyectos ni el estado original", () => {
  const raw = JSON.stringify(seed);
  const restored = parseSavedState(raw);
  assert.ok(
    demoGalleryPhotos(restored).some((photo) => photo.status === "approved"),
  );
  assert.ok(
    demoGalleryPhotos(restored).some((photo) => photo.status === "pending"),
  );
  assert.deepEqual(restored, seed);
  assert.equal(JSON.stringify(seed), raw);
});

test("enviar una foto crea un aporte pendiente asociado al perfil y permite restaurarlo", () => {
  const submitted = applyMutation(
    seed,
    {
      type: "submitGalleryPhoto",
      imageUrl: "sample:electronics",
      caption: "Probamos los circuitos de la muestra.",
    },
    "student",
    () => "new-photo",
  );
  const photo = demoGalleryPhotos(submitted)[0];
  assert.equal(photo.id, "new-photo");
  assert.equal(photo.status, "pending");
  assert.equal(photo.authorRole, "student");
  assert.equal(photo.authorName, "Lucía Fernández");
  assert.equal(
    demoGalleryPhotos(seed).some((item) => item.id === photo.id),
    false,
  );
  assert.deepEqual(parseSavedState(JSON.stringify(submitted)), submitted);
});

test("una imagen JPEG elegida del dispositivo conserva sus bytes al enviar y recargar", () => {
  const bytes = readFileSync(
    new URL("../../assets/demo-gallery/robot.jpg", import.meta.url),
  );
  const imageUrl = `data:image/jpeg;base64,${bytes.toString("base64")}`;
  const state = applyMutation(
    seed,
    {
      type: "submitGalleryPhoto",
      imageUrl,
      caption: "Imagen de prueba elegida del dispositivo.",
    },
    "teacher",
    () => "file-photo",
  );
  const photo = demoGalleryPhotos(parseSavedState(JSON.stringify(state)))[0];
  assert.equal(photo.imageUrl, imageUrl);
  assert.equal(photo.authorName, "Martín García");
  assert.equal(photo.status, "pending");
});

test("invitados no envían fotos y sólo organización puede moderar", () => {
  assert.throws(
    () =>
      applyMutation(
        seed,
        {
          type: "submitGalleryPhoto",
          imageUrl: "sample:robot",
          caption: "Un robot de ejemplo.",
        },
        "guest",
      ),
    /permiso/,
  );
  for (const role of ["student", "teacher", "loans", "guest"] as const)
    assert.throws(
      () =>
        applyMutation(
          seed,
          {
            type: "reviewGalleryPhoto",
            id: "demo-circuit",
            decision: "approved",
            note: "",
          },
          role,
        ),
      /permiso/,
    );
});

test("aprobar publica la foto y retirarla exige un motivo que persiste", () => {
  const approved = applyMutation(
    seed,
    {
      type: "reviewGalleryPhoto",
      id: "demo-circuit",
      decision: "approved",
      note: "Lista para la muestra.",
    },
    "admin",
  );
  assert.equal(
    demoGalleryPhotos(approved).find((photo) => photo.id === "demo-circuit")
      ?.status,
    "approved",
  );
  assert.throws(
    () =>
      applyMutation(
        approved,
        {
          type: "reviewGalleryPhoto",
          id: "demo-circuit",
          decision: "rejected",
          note: "",
        },
        "admin",
      ),
    /entre 10/,
  );
  const rejected = applyMutation(
    approved,
    {
      type: "reviewGalleryPhoto",
      id: "demo-circuit",
      decision: "rejected",
      note: "Elegí una foto donde se vea el proyecto completo.",
    },
    "admin",
  );
  const photo = demoGalleryPhotos(
    parseSavedState(JSON.stringify(rejected)),
  ).find((item) => item.id === "demo-circuit");
  assert.equal(photo?.status, "rejected");
  assert.equal(
    photo?.reviewNote,
    "Elegí una foto donde se vea el proyecto completo.",
  );
  assert.equal(
    demoGalleryPhotos(seed).find((item) => item.id === "demo-circuit")?.status,
    "pending",
  );
});

test("rechaza archivos ajenos a imágenes, descripciones inválidas y datos guardados corruptos", () => {
  for (const imageUrl of [
    "javascript:alert(1)",
    "file:///foto.jpg",
    "data:image/png;base64,dGV4dA==",
    "sample:unknown",
  ])
    assert.throws(() =>
      applyMutation(
        seed,
        {
          type: "submitGalleryPhoto",
          imageUrl,
          caption: "Una imagen de prueba.",
        },
        "student",
      ),
    );
  for (const caption of ["", "hola", "foto\ncon salto"])
    assert.throws(() =>
      applyMutation(
        seed,
        { type: "submitGalleryPhoto", imageUrl: "sample:robot", caption },
        "student",
      ),
    );
  const state = applyMutation(
    seed,
    {
      type: "reviewGalleryPhoto",
      id: "demo-circuit",
      decision: "approved",
      note: "",
    },
    "admin",
  );
  state.galleryPhotos![0].imageUrl = "data:image/png;base64,dGV4dA==";
  assert.throws(() => parseSavedState(JSON.stringify(state)), /galleryPhotos/);
});
