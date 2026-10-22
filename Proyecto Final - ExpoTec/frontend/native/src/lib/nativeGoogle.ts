import { AuthError } from "./authTypes";
import { socialFlowId } from "./mobileSocial";

type Query = <T>(path: string, body: object) => Promise<T>;
type Google = {
  configure: (options: { webClientId: string; nonce: string; autoSelectOnSignIn: boolean }) => void;
  checkPlayServices: () => Promise<void>;
  presentExplicitSignIn: () => Promise<{ type: string; data: { idToken: string } | null }>;
};

export async function nativeGoogleAccess(query: Query, challenge: string, proof: string, load: () => Promise<Google>) {
  const start = await query<{ id: string; nonce: string; webClientId: string }>("/api/auth/social/google/native/start", { challenge });
  if (!socialFlowId.test(start.id) || !/^[a-f0-9]{64}$/.test(start.nonce) ||
      !/^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(start.webClientId))
    throw new Error("No pudimos preparar el acceso de Google.");
  try {
    const google = await load();
    google.configure({ webClientId: start.webClientId, nonce: start.nonce, autoSelectOnSignIn: false });
    await google.checkPlayServices();
    const result = await google.presentExplicitSignIn();
    if (result.type === "cancelled") return null;
    if (result.type !== "success" || !result.data?.idToken)
      throw new Error("Google no devolvió una cuenta.");
    const verified = await query<{ id: string }>("/api/auth/social/google/native/verify", { id: start.id, proof, idToken: result.data.idToken });
    if (verified.id !== start.id) throw new Error("El acceso no corresponde a esta sesión.");
    return start.id;
  } catch (cause) {
    if (cause instanceof AuthError) throw cause;
    const code = cause && typeof cause === "object" && "code" in cause ? String(cause.code) : "";
    if (code === "SIGN_IN_CANCELLED") return null;
    throw new Error(code === "PLAY_SERVICES_NOT_AVAILABLE"
      ? "Actualizá los Servicios de Google Play para ingresar con Google."
      : code === "DEVELOPER_ERROR"
        ? "El acceso de Google todavía no está habilitado para esta versión de la app."
        : "No pudimos iniciar Google en este dispositivo. Volvé a intentarlo.");
  }
}
