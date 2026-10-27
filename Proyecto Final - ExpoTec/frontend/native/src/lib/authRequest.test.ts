/** Pruebas unitarias de `authRequest.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import test from "node:test";
import assert from "node:assert/strict";
import { createAuthRequest } from "./authRequest";

test("guardar una foto admite su procesamiento sin ampliar el tiempo de las otras consultas", async () => {
  const oldFetch = globalThis.fetch;
  const oldTimer = globalThis.setTimeout;
  const timers: number[] = [];
  globalThis.setTimeout = ((callback: () => void, delay: number) => {
    timers.push(delay);
    return oldTimer(callback, delay);
  }) as typeof setTimeout;
  globalThis.fetch = async () => new Response(JSON.stringify({ imageUrl: "https://expotec.example/photo" }), { status: 200 });
  try {
    const request = createAuthRequest("https://expotec.example", false);
    await request("/api/uploads/photo-id/complete", {}, "session");
    await request("/api/uploads", {}, "session");
    await request("/api/auth/session", {}, "session", "GET");
    assert.deepEqual(timers, [60000, 15000, 15000]);
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.setTimeout = oldTimer;
  }
});

test("GET y DELETE envían sus datos como parámetros de la URL y sin cuerpo", async () => {
  const oldFetch = globalThis.fetch;
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  try {
    const request = createAuthRequest("https://expotec.example", false);
    await request("/api/inventory", { limit: 25, offset: 0, archived: false, skip: undefined }, "session", "GET");
    await request("/api/spaces/id", { version: 3 }, "session", "DELETE");
    await request("/api/spaces/id", { name: "Aula" }, "session", "PUT");
    assert.equal(calls[0].url, "https://expotec.example/api/inventory?limit=25&offset=0&archived=false");
    assert.equal(calls[0].init.method, "GET");
    assert.equal(calls[0].init.body, undefined);
    assert.equal(calls[1].url, "https://expotec.example/api/spaces/id?version=3");
    assert.equal(calls[1].init.method, "DELETE");
    assert.equal(calls[2].init.method, "PUT");
    assert.equal(calls[2].init.body, JSON.stringify({ name: "Aula" }));
  } finally {
    globalThis.fetch = oldFetch;
  }
});
