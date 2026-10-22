export const mobileSocialReturn = "expotec://auth";
export const mobileSocialOrigin = "https://expotec-web-gn19.vercel.app";
export const mobileSocialKey = "expotec-mobile-flow";
export const socialFlowId =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

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
