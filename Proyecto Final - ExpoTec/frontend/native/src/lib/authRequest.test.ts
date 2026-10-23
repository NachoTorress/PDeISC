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
    await request("/api/uploads/complete", { id: "photo" }, "session");
    await request("/api/uploads/prepare", {}, "session");
    await request("/api/auth/session", {}, "session");
    assert.deepEqual(timers, [60000, 15000, 15000]);
  } finally {
    globalThis.fetch = oldFetch;
    globalThis.setTimeout = oldTimer;
  }
});
