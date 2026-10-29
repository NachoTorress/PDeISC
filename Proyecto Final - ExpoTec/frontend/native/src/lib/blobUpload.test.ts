/** Pruebas unitarias de `blobUpload.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import test from "node:test";
import assert from "node:assert/strict";
import { photoUploadRequest, putPhoto } from "./blobUpload";
import { preparePhoto } from "./preparePhoto";
import { uploadPhoto } from "./photoUpload";
import { photoResize } from "./photoUploadBody";
import type { LocalPhoto } from "./photoUploadBody";
import { AbortController as NativeAbortController } from "abort-controller/dist/abort-controller";

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

test("Android: tamaños de cámara grandes se reducen sin deformar ni ampliar fotos pequeñas", () => {
  assert.deepEqual(photoResize(4000, 3000), { width: 1600 });
  assert.deepEqual(photoResize(3000, 4000), { height: 1600 });
  assert.equal(photoResize(800, 600), null);
  assert.equal(photoResize(0, 0), null);
  assert.throws(() => photoResize(10000, 10000), /40 megapíxeles/);
});

test("Android: envía el archivo nativo por URI y completa la carga sólo después del PUT", async () => {
  const previous = globalThis.XMLHttpRequest;
  const actions: string[] = [];
  const headers: Record<string, string> = {};
  let sentBody: unknown;
  let disposed = false;
  class NativeRequest {
    upload = { onprogress: undefined as ((event: object) => void) | undefined };
    status = 201;
    onload?: () => void;
    open(method: string, url: string) {
      assert.equal(method, "PUT");
      assert.equal(new URL(url).hostname, "vercel.com");
    }
    setRequestHeader(key: string, value: string) {
      headers[key] = value;
    }
    send(value: unknown) {
      sentBody = value;
      actions.push("put");
      queueMicrotask(() => this.onload?.());
    }
  }
  globalThis.XMLHttpRequest = NativeRequest as unknown as typeof XMLHttpRequest;
  try {
    const controller = new NativeAbortController();
    assert.equal(
      "throwIfAborted" in controller.signal,
      false,
      "La prueba debe usar el AbortController de React Native, que no implementa throwIfAborted",
    );
    const photo: LocalPhoto = {
      uri: "file:///data/user/0/ar.edu.expotec.organizacion/cache/photo.jpg",
      type: "image/jpeg",
      size: 1234,
      dispose: () => {
        disposed = true;
      },
    };
    const result = await uploadPhoto(
      photo,
      "gallery",
      async <T>(endpoint: string, input: object) => {
        actions.push(endpoint);
        if (endpoint === "/api/uploads") {
          assert.deepEqual(input, {
            purpose: "gallery",
            contentType: "image/jpeg",
            size: 1234,
          });
          return {
            id: "image-id",
            pathname: pathname.replace(".png", ".jpg"),
            clientToken: token,
          } as T;
        }
        assert.equal(
          disposed,
          false,
          "No borrar el archivo mientras está subiendo",
        );
        return {
          imageUrl: "https://expotec.example/api/uploads/image-id/image",
        } as T;
      },
      () => {},
      controller.signal as unknown as AbortSignal,
    );
    assert.deepEqual(sentBody, { uri: photo.uri });
    assert.equal(headers["Content-Type"], "image/jpeg");
    assert.equal(headers["x-content-length"], "1234");
    assert.deepEqual(actions, [
      "/api/uploads",
      "put",
      "/api/uploads/image-id/complete",
    ]);
    assert.equal(result, "https://expotec.example/api/uploads/image-id/image");
    assert.equal(disposed, true);
  } finally {
    globalThis.XMLHttpRequest = previous;
  }
});

test("Android: un archivo ilegible no confirma ni filtra la foto temporal", async () => {
  const previous = globalThis.XMLHttpRequest;
  let disposed = false;
  class UnreadableRequest {
    upload = {};
    open() {}
    setRequestHeader() {}
    send() {
      throw new Error("file not found");
    }
  }
  globalThis.XMLHttpRequest =
    UnreadableRequest as unknown as typeof XMLHttpRequest;
  try {
    await assert.rejects(
      uploadPhoto(
        {
          uri: "file:///cache/photo.jpg",
          type: "image/jpeg",
          size: 1234,
          dispose: () => {
            disposed = true;
          },
        },
        "gallery",
        async <T>(endpoint: string) => {
          assert.equal(endpoint, "/api/uploads");
          return { id: "image-id", pathname, clientToken: token } as T;
        },
        () => {},
        new AbortController().signal,
      ),
      /leer la foto/,
    );
    assert.equal(disposed, true);
  } finally {
    globalThis.XMLHttpRequest = previous;
  }
});

test("Android: cancelar durante la preparación libera el archivo sin contactar la API", async () => {
  const controller = new NativeAbortController();
  controller.abort();
  let disposed = false;
  await assert.rejects(
    uploadPhoto(
      {
        uri: "file:///cache/photo.jpg",
        type: "image/jpeg",
        size: 12,
        dispose: () => {
          disposed = true;
        },
      },
      "gallery",
      async () => assert.fail("No iniciar una carga cancelada"),
      () => {},
      controller.signal as unknown as AbortSignal,
    ),
  );
  assert.equal(disposed, true);
});

test("Android: el AbortController nativo cancela el PUT activo y no confirma la carga", async () => {
  const previous = globalThis.XMLHttpRequest;
  const controller = new NativeAbortController();
  const actions: string[] = [];
  let disposed = false;
  class PendingRequest {
    upload = {};
    onabort?: () => void;
    open() {}
    setRequestHeader() {}
    send() {
      actions.push("put");
      queueMicrotask(() => controller.abort());
    }
    abort() {
      actions.push("abort");
      this.onabort?.();
    }
  }
  globalThis.XMLHttpRequest =
    PendingRequest as unknown as typeof XMLHttpRequest;
  try {
    await assert.rejects(
      uploadPhoto(
        {
          uri: "file:///cache/photo.jpg",
          type: "image/jpeg",
          size: 1234,
          dispose: () => {
            disposed = true;
          },
        },
        "gallery",
        async <T>(endpoint: string) => {
          actions.push(endpoint);
          return { id: "image-id", pathname, clientToken: token } as T;
        },
        () => {},
        controller.signal as unknown as AbortSignal,
      ),
      /cancelada/,
    );
    assert.deepEqual(actions, ["/api/uploads", "put", "abort"]);
    assert.equal(disposed, true);
  } finally {
    globalThis.XMLHttpRequest = previous;
  }
});
