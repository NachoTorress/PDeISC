import test from "node:test";
import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { socialBridge } from "./socialBridge.web";

test("la prueba social queda en la pestaña, vence y nunca viaja al proveedor", async () => {
  const records = new Map<string, string>();
  let redirected = "";
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      crypto: webcrypto,
      btoa,
      sessionStorage: {
        getItem: (key: string) => records.get(key) ?? null,
        setItem: (key: string, value: string) => records.set(key, value),
        removeItem: (key: string) => records.delete(key),
      },
      location: {
        assign: (url: string) => {
          redirected = url;
        },
      },
    },
  });
  try {
    const start = await socialBridge.begin();
    assert.match(start.proof, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(
      start.challenge,
      createHash("sha256").update(start.proof).digest("hex"),
    );
    assert.equal(socialBridge.pending(), null);
    assert.throws(() =>
      socialBridge.redirect("id", "https://github.com.evil.example/login"),
    );
    socialBridge.redirect(
      "id",
      "https://github.com/login/oauth/authorize?state=example",
    );
    assert.equal(redirected.includes(start.proof), false);
    const stored = JSON.parse(records.get("expotec-social-flow")!);
    records.set(
      "expotec-social-flow",
      JSON.stringify({ ...stored, returned: true }),
    );
    assert.deepEqual(socialBridge.pending(), { id: "id", proof: start.proof });
    records.set(
      "expotec-social-flow",
      JSON.stringify({ ...stored, returned: true, expiresAt: 0 }),
    );
    assert.equal(socialBridge.pending(), null);
    socialBridge.clear();
    assert.equal(records.size, 0);
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
