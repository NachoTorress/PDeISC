import test from "node:test";
import assert from "node:assert/strict";

test("el enlace de recuperación se retira de la dirección y solo permanece en memoria", async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "window");
  const token = "a".repeat(43);
  let replaced = "";
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      addEventListener: () => {},
      location: { hash: `#reset=${token}`, pathname: "/", search: "" },
      history: {
        replaceState: (_state: unknown, _title: string, url: string) => {
          replaced = url;
        },
      },
    },
  });
  try {
    const { passwordReset } = await import("./passwordReset.web");
    assert.equal(passwordReset.pending(), token);
    assert.equal(replaced, "/");
    assert.equal(replaced.includes(token), false);
    passwordReset.clear();
    assert.equal(passwordReset.pending(), null);
  } finally {
    if (original) Object.defineProperty(globalThis, "window", original);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
