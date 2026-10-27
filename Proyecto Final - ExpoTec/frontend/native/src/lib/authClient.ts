/**
 * Cliente de sesión de ExpoTec.
 *
 * Mantiene el token de acceso (15 minutos) en memoria y el de renovación en
 * almacenamiento seguro (SecureStore en Android, cookie HttpOnly en la web).
 * Antes de cada llamada autenticada renueva el acceso si está por vencer y,
 * ante un 401, reintenta una vez tras renovar. Todas las operaciones de sesión
 * se ejecutan en serie para que dos pantallas no roten el mismo token a la vez.
 */
import { AuthError } from "./authTypes";
import type {
  AccountSession,
  AccountUser,
  AuthRequest,
  Credentials,
  HttpMethod,
  SessionStorage,
} from "./authTypes";

/**
 * Crea el cliente de sesión.
 *
 * @param request Función HTTP creada por `createAuthRequest`.
 * @param storage Almacenamiento del token de renovación según la plataforma.
 * @param changed Se llama con la cuenta actual (o null) cada vez que cambia la sesión.
 */
export function createAuthClient(
  request: AuthRequest,
  storage: SessionStorage,
  changed: (user: AccountUser | null) => void,
) {
  let session: AccountSession | null = null;
  let expiresAt = 0;
  let queue: Promise<unknown> = Promise.resolve();
  /** La web usa las rutas `/browser/` que guardan la renovación en cookie. */
  const path = (action: string) =>
    `/api/auth/${storage.browser ? "browser/" : ""}${action}`;

  /** Encola una acción para que las operaciones de sesión no se superpongan. */
  function serial<T>(action: () => Promise<T>): Promise<T> {
    const next = queue.then(() => storage.lock(action));
    queue = next.catch(() => {});
    return next;
  }
  /** Olvida la sesión en memoria y en el almacenamiento. */
  async function forget() {
    session = null;
    expiresAt = 0;
    changed(null);
    await storage.clear();
  }
  /** Guarda una sesión nueva; si no se puede guardar de forma segura, la revoca. */
  async function remember(next: AccountSession) {
    try {
      if (!storage.browser) {
        if (!next.refreshToken) throw new Error("Falta la renovación.");
        await storage.write(next.refreshToken);
      }
    } catch {
      await request(path("logout"), { refreshToken: next.refreshToken }).catch(
        () => {},
      );
      await forget();
      throw new AuthError(
        "No pudimos guardar la sesión de forma segura. Volvé a ingresar.",
      );
    }
    session = next;
    expiresAt = Date.now() + next.expiresIn * 1000;
    changed(next.user);
  }
  /** Pide un token de acceso nuevo con el de renovación (que también se rota). */
  async function renew() {
    const refreshToken = storage.browser ? null : await storage.read();
    if (!storage.browser && !refreshToken) {
      await forget();
      return;
    }
    try {
      await remember(
        await request<AccountSession>(
          path("refresh"),
          storage.browser ? {} : { refreshToken },
        ),
      );
    } catch (error) {
      if (error instanceof AuthError && error.status === 401) await forget();
      else throw error;
    }
  }
  /** Ejecuta una llamada con el token de acceso, renovándolo si hace falta. */
  async function authorized<T>(
    endpoint: string,
    body: object,
    method: HttpMethod,
  ): Promise<T> {
    // Se renueva 30 segundos antes del vencimiento para no enviar un token a punto de expirar.
    if (!session || expiresAt <= Date.now() + 30000) await renew();
    if (!session)
      throw new AuthError("Tu sesión venció. Volvé a ingresar.", 401);
    try {
      return await request<T>(endpoint, body, session.accessToken, method);
    } catch (error) {
      if (!(error instanceof AuthError) || error.status !== 401) throw error;
      await renew();
      if (!session)
        throw new AuthError("Tu sesión venció. Volvé a ingresar.", 401);
      try {
        return await request<T>(endpoint, body, session.accessToken, method);
      } catch (retryError) {
        if (retryError instanceof AuthError && retryError.status === 401)
          await forget();
        throw retryError;
      }
    }
  }
  return {
    /** Cierra la sesión local después de cambiar la contraseña (el servidor ya la revocó). */
    forgetAfterRecovery: () => serial(forget),
    /** Llamada pública, sin token (muestra, galería, presentación, accesos). */
    query: <T>(endpoint: string, body: object = {}, method: HttpMethod = "POST") =>
      request<T>(endpoint, body, undefined, method),
    /** Llamada autenticada con la sesión actual. */
    send: <T>(endpoint: string, body: object = {}, method: HttpMethod = "POST") =>
      serial(() => authorized<T>(endpoint, body, method)),
    /** Recupera la sesión guardada al abrir la app (sesión persistente). */
    restore: () => serial(renew),
    /** Termina un ingreso o alta con Google, Discord o GitHub. */
    completeSocial: (input: object) =>
      serial(async () => {
        await remember(
          await request<AccountSession>(path("social/complete"), input),
        );
      }),
    /** Registro (`register` true) o ingreso con correo y contraseña. */
    signIn: (input: Credentials, register: boolean) =>
      serial(async () => {
        await remember(
          await request<AccountSession>(
            path(register ? "register" : "login"),
            input,
          ),
        );
      }),
    /** Comprueba con el servidor que la sesión sigue vigente y actualiza los permisos. */
    verify: () =>
      serial(async () => {
        let result: { user: AccountUser };
        try {
          result = await authorized("/api/auth/session", {}, "GET");
        } catch (error) {
          if (!(error instanceof AuthError) || error.status !== 401)
            throw error;
          return false;
        }
        if (!session) return false;
        session = { ...session, user: result.user };
        changed(result.user);
        return true;
      }),
    /** Cierra la sesión en el servidor y en el dispositivo. */
    signOut: () =>
      serial(async () => {
        const refreshToken = storage.browser ? null : await storage.read();
        if (storage.browser || refreshToken) {
          try {
            await request(
              path("logout"),
              storage.browser ? {} : { refreshToken },
            );
          } catch (error) {
            // Si ya estaba vencida, igual se olvida en el dispositivo.
            if (!(error instanceof AuthError) || error.status !== 401)
              throw error;
          }
        }
        await forget();
      }),
  };
}
