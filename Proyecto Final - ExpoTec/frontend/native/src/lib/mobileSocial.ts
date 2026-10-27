/** Retorno del acceso social a la app Android mediante el enlace `expotec://auth`. */
/** Enlace profundo al que vuelve el navegador después de Discord o GitHub. */
export const mobileSocialReturn = "expotec://auth";
export const mobileSocialOrigin = "https://expotec-web-gn19.vercel.app";
export const mobileSocialKey = "expotec-mobile-flow";
/** Formato válido del identificador de flujo (UUID). */
export const socialFlowId =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

/** Valida el enlace de retorno y devuelve el id del flujo, o null si no corresponde. */
export function mobileSocialResult(
  value: string,
  flowId: string,
): string | null {
  try {
    const url = new URL(value);
    if (
      url.origin !== "null" ||
      url.protocol !== "expotec:" ||
      url.hostname !== "auth" ||
      url.pathname ||
      url.username ||
      url.password ||
      url.port ||
      url.hash
    )
      return null;
    if (
      url.searchParams.getAll("flow").length !== 1 ||
      url.searchParams.getAll("social").length !== 1 ||
      url.searchParams.get("flow") !== flowId
    )
      return null;
    const id = url.searchParams.get("social") ?? "";
    return socialFlowId.test(id) ? id : null;
  } catch {
    return null;
  }
}

/** Indica si la página web debe devolver el flujo a la app. */
export function browserMobileReturn(
  storage: Pick<Storage, "getItem">,
  id: string,
): boolean {
  try {
    const flow = JSON.parse(storage.getItem(mobileSocialKey) ?? "null");
    return (
      socialFlowId.test(id) &&
      flow?.id === id &&
      socialFlowId.test(flow.flowId) &&
      Number.isFinite(flow.expiresAt) &&
      flow.expiresAt > Date.now()
    );
  } catch {
    return false;
  }
}
