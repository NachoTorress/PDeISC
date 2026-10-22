import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { Linking, Platform } from "react-native";
import { nativeGoogleAccess } from "./nativeGoogle";
import {
  mobileSocialOrigin,
  mobileSocialReturn,
  mobileSocialResult,
  socialFlowId,
} from "./mobileSocial";

type Flow = { flowId: string; proof: string; expiresAt: number; id?: string };
const key = "expotec.social.v1";
let flow: Flow | null = null;
let cleanup = Promise.resolve();
export let hasSocialReturn = false;
async function capture(value: string) {
  if (!flow || flow.expiresAt <= Date.now())
    throw new Error("Este acceso venció. Volvé a iniciarlo.");
  const id = mobileSocialResult(value, flow.flowId);
  if (!id)
    throw new Error("El regreso a ExpoTec no corresponde a este acceso.");
  flow = { ...flow, id };
  await SecureStore.setItemAsync(key, JSON.stringify(flow));
  hasSocialReturn = true;
}
export const socialBridge = {
  async restore() {
    try {
      const saved = JSON.parse((await SecureStore.getItemAsync(key)) ?? "null");
      if (
        !saved ||
        !socialFlowId.test(saved.flowId) ||
        !/^[A-Za-z0-9_-]{43}$/.test(saved.proof) ||
        !Number.isFinite(saved.expiresAt) ||
        saved.expiresAt <= Date.now() ||
        (saved.id && !socialFlowId.test(saved.id))
      )
        return;
      flow = saved;
      const url = await Linking.getInitialURL();
      if (url?.startsWith(mobileSocialReturn)) await capture(url);
      hasSocialReturn = Boolean(flow?.id);
    } catch {
      flow = null;
    }
  },
  pending(): { id: string; proof: string } | null {
    return flow?.id && flow.expiresAt > Date.now()
      ? { id: flow.id, proof: flow.proof }
      : null;
  },
  clear() {
    flow = null;
    hasSocialReturn = false;
    cleanup = SecureStore.deleteItemAsync(key).catch(() => {});
  },
  async begin() {
    await cleanup;
    const bytes = await Crypto.getRandomBytesAsync(32);
    const proof = btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const challenge = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      proof,
    );
    flow = {
      flowId: Crypto.randomUUID(),
      proof,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
    await SecureStore.setItemAsync(key, JSON.stringify(flow));
    return { proof, challenge };
  },
  async start(provider: string, query: <T>(path: string, body: object) => Promise<T>) {
    if (!["google", "discord", "github"].includes(provider))
      throw new Error("Ese proveedor no está disponible.");
    const { challenge, proof } = await socialBridge.begin();
    if (provider === "google" && Platform.OS === "android") {
      try {
        const id = await nativeGoogleAccess(query, challenge, proof, async () => {
          const { GoogleOneTapSignIn } = await import("react-native-nitro-google-signin");
          return GoogleOneTapSignIn;
        });
        if (!id) { socialBridge.clear(); return; }
        if (!flow || flow.proof !== proof || flow.expiresAt <= Date.now())
          throw new Error("Este acceso venció. Volvé a iniciarlo.");
        flow = { ...flow, id };
        await SecureStore.setItemAsync(key, JSON.stringify(flow));
        hasSocialReturn = true;
      } catch (error) {
        socialBridge.clear();
        throw error;
      }
      return;
    }
    const hash = new URLSearchParams({
      provider,
      challenge,
      flow: flow!.flowId,
    });
    try {
      const result = await WebBrowser.openAuthSessionAsync(
        `${mobileSocialOrigin}/mobile-auth.html#${hash}`,
        mobileSocialReturn,
      );
      if (result.type === "success") await capture(result.url);
      else socialBridge.clear();
    } catch (error) {
      socialBridge.clear();
      throw error;
    }
  },
  redirect() {
    throw new Error("Iniciá el acceso desde los botones de ExpoTec.");
  },
};
