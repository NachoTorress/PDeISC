/**
 * Android: el token de renovación se guarda cifrado en SecureStore para mantener la sesión al reabrir la app.
 */
import * as SecureStore from "expo-secure-store";
import type { SessionStorage } from "./authTypes";

const key = "expotec.refresh.v1";
export const sessionStorage: SessionStorage = {
  browser: false,
  read: () => SecureStore.getItemAsync(key),
  write: (token) => SecureStore.setItemAsync(key, token),
  clear: () => SecureStore.deleteItemAsync(key),
  lock: (action) => action(),
};
