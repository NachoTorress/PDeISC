/**
 * Capa HTTP de la app: arma cada solicitud a la API REST, aplica un tiempo
 * máximo de espera y traduce las respuestas de error a `AuthError` con un
 * mensaje listo para mostrar en pantalla.
 */
import { AuthError } from "./authTypes";
import type { AuthRequest, HttpMethod } from "./authTypes";

/** Las cargas de fotos se procesan en el servidor y pueden tardar más. */
const slowPaths = /^\/api\/uploads\/[^/]+\/complete$/;

/**
 * Convierte un objeto en parámetros de URL para GET y DELETE.
 * Se omiten los valores `undefined` y `null`.
 */
export function queryString(body: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(body))
    if (value !== undefined && value !== null) params.set(key, String(value));
  const text = params.toString();
  return text ? `?${text}` : "";
}

/**
 * Crea la función de solicitudes contra la API.
 *
 * @param base Origen de la API (vacío en la web: usa el mismo origen y su proxy `/api`).
 * @param browser true en la web: envía cookies para la sesión HttpOnly.
 * @throws Error si el origen no es HTTPS (HTTP solo en desarrollo local).
 */
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
  return async <T>(
    path: string,
    body: object,
    token?: string,
    method: HttpMethod = "POST",
  ): Promise<T> => {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      slowPaths.test(path) ? 60000 : 15000,
    );
    // GET y DELETE no llevan cuerpo: sus datos viajan en la URL.
    const withoutBody = method === "GET" || method === "DELETE";
    try {
      const response = await fetch(
        `${base.replace(/\/$/, "")}${path}${withoutBody ? queryString(body) : ""}`,
        {
          method,
          headers: {
            ...(withoutBody ? {} : { "Content-Type": "application/json" }),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: browser ? "include" : "omit",
          ...(withoutBody ? {} : { body: JSON.stringify(body) }),
          signal: controller.signal,
        },
      );
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
      // Sin conexión, tiempo agotado o servidor caído: mensaje genérico y recuperable.
      throw new AuthError(
        "No pudimos conectar con ExpoTec. Revisá tu conexión y volvé a intentar.",
      );
    } finally {
      clearTimeout(timer);
    }
  };
}
