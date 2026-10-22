(async () => {
  const key = "expotec-mobile-flow";
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
  const params = new URLSearchParams(location.hash.slice(1));
  const message = document.getElementById("message");
  const button = document.getElementById("return");
  history.replaceState(null, "", location.pathname);
  try {
    if (params.has("social")) {
      const saved = JSON.parse(sessionStorage.getItem(key) ?? "null");
      const id = params.get("social");
      if (
        !saved ||
        !uuid.test(id) ||
        saved.id !== id ||
        !uuid.test(saved.flowId) ||
        !Number.isFinite(saved.expiresAt) ||
        saved.expiresAt <= Date.now()
      )
        throw Error();
      const target = `expotec://auth?${new URLSearchParams({ social: id, flow: saved.flowId })}`;
      button.href = target;
      button.hidden = false;
      message.textContent = "Volvé a la app para completar el ingreso.";
      sessionStorage.removeItem(key);
      try {
        location.replace(target);
      } catch {
        /* El botón permite volver si el navegador bloquea la apertura automática. */
      }
      return;
    }
    const provider = params.get("provider"),
      challenge = params.get("challenge"),
      flowId = params.get("flow");
    if (
      !["google", "discord", "github"].includes(provider) ||
      !/^[a-f0-9]{64}$/.test(challenge ?? "") ||
      !uuid.test(flowId ?? "")
    )
      throw Error();
    const response = await fetch("/api/auth/browser/social/start", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider, challenge }),
    });
    if (!response.ok) throw Error();
    const result = await response.json();
    const target = new URL(result.url);
    const hosts = {
      google: "accounts.google.com",
      discord: "discord.com",
      github: "github.com",
    };
    if (
      !uuid.test(result.id) ||
      target.protocol !== "https:" ||
      target.hostname !== hosts[provider] ||
      target.username ||
      target.password ||
      target.port
    )
      throw Error();
    sessionStorage.setItem(
      key,
      JSON.stringify({
        id: result.id,
        flowId,
        expiresAt: Date.now() + 10 * 60 * 1000,
      }),
    );
    location.replace(target.href);
  } catch {
    message.textContent =
      "No pudimos completar el acceso. Cerrá esta ventana y volvé a intentarlo desde ExpoTec.";
    button.hidden = true;
  }
})();
