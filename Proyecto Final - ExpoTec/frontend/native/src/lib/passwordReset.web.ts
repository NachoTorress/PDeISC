/** Lee y limpia el token `#reset=...` del enlace de recuperación en la web. */
let token: string | null = null;
if (typeof window !== "undefined") {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  if (hash.has("reset")) {
    token = hash.get("reset") ?? "";
    window.history.replaceState(
      null,
      "",
      window.location.pathname + window.location.search,
    );
  }
  // Un enlace abierto en la misma pestaña también debe iniciar una pantalla nueva.
  window.addEventListener("hashchange", () => {
    if (new URLSearchParams(window.location.hash.slice(1)).has("reset"))
      window.location.reload();
  });
}
export const passwordReset = {
  pending: () => token,
  clear: () => {
    token = null;
  },
};
