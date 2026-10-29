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
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ imageUrl: "https://expotec.example/photo" }),
      { status: 200 },
    );
  try {
    const request = createAuthRequest("https://expotec.example", false);
    await request("/api/uploads/photo-id/complete", {}, "session");
    await request("/api/uploads", {}, "session");
    await request("/api/auth/session", {}, "session");
    assert.deepEqual(timers, [60000, 15000, 15000]);
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.setTimeout = oldTimer;
  }
});

test("todas las solicitudes envían sus datos como JSON en el cuerpo, nunca en la URL", async () => {
  const oldFetch = globalThis.fetch;
  const calls: { url: string; init: RequestInit }[] = [];
  globalThis.fetch = async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  try {
    const request = createAuthRequest("https://expotec.example", false);
    await request(
      "/api/inventory/query",
      { limit: 25, offset: 0, archived: false },
      "session",
    );
    await request("/api/spaces/id", { version: 3 }, "session", "DELETE");
    await request("/api/spaces/id", { name: "Aula" }, "session", "PUT");
    assert.equal(calls[0].url, "https://expotec.example/api/inventory/query");
    assert.equal(calls[0].init.method, "POST");
    assert.equal(
      calls[0].init.body,
      JSON.stringify({ limit: 25, offset: 0, archived: false }),
    );
    assert.equal(calls[1].url, "https://expotec.example/api/spaces/id");
    assert.equal(calls[1].init.method, "DELETE");
    assert.equal(calls[1].init.body, JSON.stringify({ version: 3 }));
    assert.equal(calls[2].init.method, "PUT");
    assert.equal(calls[2].init.body, JSON.stringify({ name: "Aula" }));
    assert.ok(calls.every((call) => call.init.method !== "GET"));
  } finally {
    globalThis.fetch = oldFetch;
  }
});
