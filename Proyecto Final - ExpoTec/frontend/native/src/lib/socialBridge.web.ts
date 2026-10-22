import { browserMobileReturn } from "./mobileSocial";
const key = "expotec-social-flow";
type Pending = {
  id?: string;
  proof: string;
  expiresAt: number;
  returned?: boolean;
};
function read(): Pending | null {
  try {
    const raw = window.sessionStorage.getItem(key);
    const value = raw ? (JSON.parse(raw) as Pending) : null;
    if (
      !value ||
      typeof value.proof !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(value.proof) ||
      !Number.isFinite(value.expiresAt) ||
      value.expiresAt <= Date.now()
    )
      return null;
    return value;
  } catch {
    return null;
  }
}
// Solo el identificador vuelve en la URL; la prueba permanece en esta pestaña.
function captureReturn() {
  if (typeof window === "undefined") return false;
  const hash = new URLSearchParams(window.location.hash.slice(1));
  if (!hash.has("social")) return false;
  try {
    if (browserMobileReturn(window.sessionStorage, hash.get("social") ?? "")) {
      window.location.replace(
        `/mobile-auth.html#social=${encodeURIComponent(hash.get("social")!)}`,
      );
      return false;
    }
  } catch {
    /* El acceso web informa el almacenamiento no disponible. */
  }
  const value = read(),
    id = hash.get("social");
  try {
    if (value && value.id === id)
      window.sessionStorage.setItem(
        key,
        JSON.stringify({ ...value, returned: true }),
      );
  } catch {
    /* El formulario mostrará que no pudo recuperar el acceso temporal. */
  }
  window.history.replaceState(
    null,
    "",
    window.location.pathname + window.location.search,
  );
  return true;
}
export let hasSocialReturn = captureReturn();
export const socialBridge = {
  async restore() {},
  async start(
    provider: string,
    query: <T>(path: string, body: object) => Promise<T>,
  ): Promise<void> {
    const { challenge } = await socialBridge.begin();
    const result = await query<{ id: string; url: string }>(
      "/api/auth/browser/social/start",
      { provider, challenge },
    );
    socialBridge.redirect(result.id, result.url);
  },
  pending(): { id: string; proof: string } | null {
    const value = read();
    return value?.returned && value.id
      ? { id: value.id, proof: value.proof }
      : null;
  },
  clear() {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      /* No conservar el flujo en memoria si el navegador bloqueó el almacenamiento. */
    }
    hasSocialReturn = false;
  },
  async begin() {
    const bytes = window.crypto.getRandomValues(new Uint8Array(32));
    const proof = window
      .btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const hash = await window.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(proof),
    );
    const challenge = Array.from(new Uint8Array(hash), (value) =>
      value.toString(16).padStart(2, "0"),
    ).join("");
    window.sessionStorage.setItem(
      key,
      JSON.stringify({ proof, expiresAt: Date.now() + 10 * 60 * 1000 }),
    );
    return { proof, challenge };
  },
  redirect(id: string, url: string) {
    const value = read();
    if (!value)
      throw new Error(
        "No pudimos conservar el acceso temporal. Permití el almacenamiento de esta pestaña.",
      );
    const target = new URL(url);
    if (
      target.protocol !== "https:" ||
      !["accounts.google.com", "discord.com", "github.com"].includes(
        target.hostname,
      )
    )
      throw new Error("La dirección de acceso no es válida.");
    window.sessionStorage.setItem(key, JSON.stringify({ ...value, id }));
    window.location.assign(target.href);
  },
};
