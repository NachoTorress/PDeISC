/**
 * Estado global de autenticación con Context API.
 * Expone la cuenta actual, si la sesión ya se restauró, el último error y el
 * cliente de API. Restaura la sesión guardada al abrir la app (sesión
 * persistente) y la vuelve a verificar al regresar a primer plano.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { createAuthClient } from "../lib/authClient";
import { createAuthRequest } from "../lib/authRequest";
import { sessionStorage } from "../lib/sessionStorage";
import type { AccountUser } from "../lib/authTypes";

type Client = ReturnType<typeof createAuthClient>;
interface AuthValue {
  user: AccountUser | null;
  ready: boolean;
  error: string;
  client: Client;
  retry: () => Promise<void>;
}
/** Contexto con la sesión; null fuera del proveedor. */
const AuthContext = createContext<AuthValue | null>(null);

/** Proveedor que crea el cliente de API una sola vez y mantiene la sesión. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const instance = useRef<Client | null>(null);
  if (!instance.current) {
    const base =
      process.env.EXPO_PUBLIC_API_URL ??
      (Platform.OS === "web" ? "" : "https://expotec-api-gn19.vercel.app");
    instance.current = createAuthClient(
      createAuthRequest(base, Platform.OS === "web"),
      sessionStorage,
      (value) => {
        setUser(value);
        setError("");
      },
    );
  }
  const client = instance.current;
  const retry = useCallback(async () => {
    setReady(false);
    setError("");
    try {
      await client.restore();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "No pudimos recuperar la sesión.",
      );
    } finally {
      setReady(true);
    }
  }, [client]);
  useEffect(() => {
    void retry();
  }, [retry]);
  useEffect(() => {
    const verify = () => {
      if (user)
        void client
          .verify()
          .then(() => setError(""))
          .catch(() =>
            setError(
              "No pudimos comprobar la conexión. Reintentá desde el menú de cuenta de la barra superior.",
            ),
          );
    };
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") verify();
    });
    if (Platform.OS === "web") window.addEventListener("focus", verify);
    return () => {
      subscription.remove();
      if (Platform.OS === "web") window.removeEventListener("focus", verify);
    };
  }, [client, user]);
  return (
    <AuthContext.Provider value={{ user, ready, error, client, retry }}>
      {children}
    </AuthContext.Provider>
  );
}
/** Acceso a la sesión desde cualquier componente. */
export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Falta AuthProvider.");
  return value;
}
