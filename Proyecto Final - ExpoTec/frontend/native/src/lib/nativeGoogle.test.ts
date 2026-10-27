/** Pruebas unitarias de `nativeGoogle.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import test from "node:test";
import assert from "node:assert/strict";
import { nativeGoogleAccess } from "./nativeGoogle";

const start = { id: "a1111111-1111-4111-8111-111111111111", nonce: "a".repeat(64), webClientId: "test.apps.googleusercontent.com" };

test("Google nativo entrega el token solo a la API y conserva la prueba privada", async () => {
  const requests: { path: string; body: object }[] = [];
  const query = async <T>(path: string, body: object): Promise<T> => {
    requests.push({ path, body });
    return (path.endsWith("/start") ? start : { id: start.id }) as T;
  };
  const id = await nativeGoogleAccess(query, "challenge", "private-proof", async () => ({
    configure(options) { assert.equal(options.nonce, start.nonce); assert.equal(options.autoSelectOnSignIn, false); },
    async checkPlayServices() {},
    async presentExplicitSignIn() { return { type: "success", data: { idToken: "signed-google-token" } }; },
  }));
  assert.equal(id, start.id);
  assert.deepEqual(requests, [
    { path: "/api/auth/social/google/native/start", body: { challenge: "challenge" } },
    { path: "/api/auth/social/google/native/verify", body: { id: start.id, proof: "private-proof", idToken: "signed-google-token" } },
  ]);
});

test("cancelar Google nativo no verifica ni inicia una sesión", async () => {
  let calls = 0;
  const id = await nativeGoogleAccess(async <T>() => { calls++; return start as T; }, "challenge", "proof", async () => ({
    configure() {}, async checkPlayServices() {},
    async presentExplicitSignIn() { return { type: "cancelled", data: null }; },
  }));
  assert.equal(id, null); assert.equal(calls, 1);
});
