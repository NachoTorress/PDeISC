import { AuthError } from "./authTypes";
import type { AuthRequest } from "./authTypes";

export function createAuthRequest(base: string, browser: boolean): AuthRequest {
  if (base) {
    const url = new URL(base);
    const local = ["localhost", "127.0.0.1", "10.0.2.2"].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      !(url.protocol === "https:" || (local && url.protocol === "http:"))
    )
      throw new Error(
        "La URL de la API debe ser un origen HTTPS; HTTP solo en desarrollo local.",
      );
  }
  return async <T>(path: string, body: object, token?: string): Promise<T> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`${base.replace(/\/$/, "")}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: browser ? "include" : "omit",
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (response.status === 204) return undefined as T;
      const data = await response.json().catch(() => null);
      if (!response.ok)
        throw new AuthError(
          response.status === 429
            ? "Demasiados intentos. Esperá unos minutos antes de volver a probar."
            : (data?.error?.message ??
                "No pudimos completar la operación. Probá nuevamente."),
          response.status,
          data?.error?.fields,
        );
      if (!data)
        throw new AuthError(
          "La API devolvió una respuesta no válida. Revisá su dirección.",
        );
      return data as T;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(
        "No pudimos conectar con ExpoTec. Revisá tu conexión y volvé a intentar.",
      );
    } finally {
      clearTimeout(timer);
    }
  };
}
