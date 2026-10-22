import test from "node:test";
import assert from "node:assert/strict";
import { photoUploadRequest, putPhoto } from "./blobUpload";
import { preparePhoto } from "./preparePhoto";

const pathname =
  "incoming/11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.png";
const token = "vercel_blob_client_teststore_scoped";
const body = new Blob(["photo"], { type: "image/png" });

test("Android: conserva el tipo indicado por el selector y limita la resolución antes de leer", async () => {
  const asset = {
    uri: "file:///selected.jpg",
    width: 100,
    height: 80,
    mimeType: "image/jpeg",
    file: new File(["photo"], "selected.jpg"),
  };
  const photo = await preparePhoto(asset);
  assert.equal(photo.type, "image/jpeg");
  assert.equal(photo.size, 5);
  await assert.rejects(
    preparePhoto({ ...asset, width: 10000, height: 10000 }),
    /40 megapíxeles/,
  );
});

test("Android: la foto usa PUT privado y un permiso temporal en el destino fijo", () => {
  const request = photoUploadRequest(pathname, token, body);
  assert.equal(new URL(request.url).origin, "https://vercel.com");
  assert.equal(new URL(request.url).searchParams.get("pathname"), pathname);
  assert.equal(new URL(request.url).searchParams.has("token"), false);
  assert.equal(request.headers.Authorization, `Bearer ${token}`);
  assert.equal(request.headers["x-vercel-blob-access"], "private");
  assert.equal(request.headers["x-content-length"], "5");
  assert.equal(request.headers["x-content-type"], "image/png");
  for (const invalid of ["vercel_blob_rw_store_secret", "", "other-token"])
    assert.throws(() => photoUploadRequest(pathname, invalid, body));
  for (const invalid of [
    "https://evil.example/photo",
    "../photo.png",
    "images/other.jpg",
  ])
    assert.throws(() => photoUploadRequest(invalid, token, body));
});

test("Android: cancelar antes de subir no inicia una petición", async () => {
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    putPhoto(pathname, body, {
      token,
      signal: controller.signal,
      progress: () => assert.fail("No debe comenzar la carga"),
    }),
  );
});
