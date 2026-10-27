/** Pruebas unitarias de `mobileSocial.ts` (se ejecutan con `npm test` usando node:test y tsx). */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import {
  mobileSocialResult,
  browserMobileReturn,
  mobileSocialKey,
} from "./mobileSocial";

const id = "11111111-1111-4111-8111-111111111111";
const flow = "22222222-2222-4222-8222-222222222222";
const url = `expotec://auth?social=${id}&flow=${flow}`;
const bootstrap = readFileSync(
  new URL("../../public/mobile-auth.js", import.meta.url),
  "utf8",
);

async function browserPage(
  hash: string,
  records: Map<string, string>,
  providerUrl = "https://accounts.google.com/o/oauth2/auth",
) {
  let redirected = "";
  const message = { textContent: "" },
    button = { hidden: true, href: "" };
  let submitted: { body?: string; credentials?: string } = {};
  await runInNewContext(bootstrap, {
    URL,
    URLSearchParams,
    Date,
    location: {
      hash,
      pathname: "/mobile-auth.html",
      replace(value: string) {
        redirected = value;
      },
    },
    history: { replaceState() {} },
    document: {
      getElementById: (name: string) => (name === "message" ? message : button),
    },
    sessionStorage: {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => records.set(key, value),
      removeItem: (key: string) => records.delete(key),
    },
    fetch: async (
      path: string,
      options: { body?: string; credentials?: string },
    ) => {
      assert.equal(path, "/api/auth/browser/social/start");
      submitted = options;
      return { ok: true, json: async () => ({ id, url: providerUrl }) };
    },
  });
  return { redirected, message, button, submitted };
}

test("el puente publicado conserva cookies y devuelve cada proveedor a la app sin enviar la prueba privada", async () => {
  for (const [provider, host] of [
    ["google", "accounts.google.com"],
    ["discord", "discord.com"],
    ["github", "github.com"],
  ]) {
    const records = new Map<string, string>();
    const challenge = "a".repeat(64);
    const start = await browserPage(
      `#provider=${provider}&challenge=${challenge}&flow=${flow}`,
      records,
      `https://${host}/oauth`,
    );
    assert.equal(start.redirected, `https://${host}/oauth`);
    assert.deepEqual(JSON.parse(start.submitted!.body!), {
      provider,
      challenge,
    });
    assert.equal(start.submitted!.credentials, "include");
    assert.equal(start.submitted!.body!.includes('"proof"'), false);
    const returned = await browserPage(`#social=${id}`, records);
    assert.equal(returned.redirected, url);
    assert.equal(returned.button.href, url);
    assert.equal(returned.button.hidden, false);
    assert.equal(records.size, 0);
  }
});

test("el puente móvil rechaza un proveedor suplantado y un retorno ajeno", async () => {
  const records = new Map<string, string>();
  const hostile = await browserPage(
    `#provider=google&challenge=${"a".repeat(64)}&flow=${flow}`,
    records,
    "https://accounts.google.com.evil.example/oauth",
  );
  assert.equal(hostile.redirected, "");
  assert.equal(records.size, 0);
  const unrelated = await browserPage(`#social=${id}`, records);
  assert.equal(unrelated.redirected, "");
  assert.equal(unrelated.button.hidden, true);
});
test("el regreso móvil exige destino exacto, flujo propio y un único identificador", () => {
  assert.equal(mobileSocialResult(url, flow), id);
  for (const invalid of [
    url.replace("expotec:", "https:"),
    url.replace("//auth", "//evil.example"),
    url.replace("//auth", "//auth/path"),
    url + `&social=${id}`,
    url + `&flow=${flow}`,
    url + "#secret",
    "invalid",
    url.replace(id, "bad"),
  ])
    assert.equal(mobileSocialResult(invalid, flow), null);
  assert.equal(mobileSocialResult(url, id), null);
});
test("el navegador sólo devuelve a Android el flujo registrado, vigente y correspondiente", () => {
  let saved = JSON.stringify({
    id,
    flowId: flow,
    expiresAt: Date.now() + 60000,
  });
  const storage = {
    getItem(key: string) {
      assert.equal(key, mobileSocialKey);
      return saved;
    },
  };
  assert.equal(browserMobileReturn(storage, id), true);
  assert.equal(browserMobileReturn(storage, flow), false);
  for (const record of [
    "null",
    "invalid",
    JSON.stringify({ id, flowId: flow, expiresAt: 0 }),
    JSON.stringify({ id, flowId: "invalid", expiresAt: Date.now() + 60000 }),
  ]) {
    saved = record;
    assert.equal(browserMobileReturn(storage, id), false);
  }
});
