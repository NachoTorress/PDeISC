import type { SessionStorage } from "./authTypes";

export const sessionStorage: SessionStorage = {
  browser: true,
  read: async () => null,
  write: async () => {},
  clear: async () => {},
  // Serializa también entre pestañas para no reutilizar una renovación rotada.
  lock: (action) =>
    typeof navigator !== "undefined" && navigator.locks
      ? navigator.locks.request("expotec-session", action)
      : action(),
};
