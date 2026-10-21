import { AuthError } from "./authTypes";
import type {
  AccountSession,
  AccountUser,
  AuthRequest,
  Credentials,
  SessionStorage,
} from "./authTypes";

export function createAuthClient(
  request: AuthRequest,
  storage: SessionStorage,
  changed: (user: AccountUser | null) => void,
) {
  let session: AccountSession | null = null;
  let expiresAt = 0;
  let queue: Promise<unknown> = Promise.resolve();
  const path = (action: string) =>
    `/api/auth/${storage.browser ? "browser/" : ""}${action}`;
  function serial<T>(action: () => Promise<T>): Promise<T> {
    const next = queue.then(() => storage.lock(action));
    queue = next.catch(() => {});
    return next;
  }
  async function forget() {
    session = null;
    expiresAt = 0;
    changed(null);
    await storage.clear();
  }
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
  async function authorized<T>(endpoint: string, body: object): Promise<T> {
    if (!session || expiresAt <= Date.now() + 30000) await renew();
    if (!session)
      throw new AuthError("Tu sesión venció. Volvé a ingresar.", 401);
    try {
      return await request<T>(endpoint, body, session.accessToken);
    } catch (error) {
      if (!(error instanceof AuthError) || error.status !== 401) throw error;
      await renew();
      if (!session)
        throw new AuthError("Tu sesión venció. Volvé a ingresar.", 401);
      try {
        return await request<T>(endpoint, body, session.accessToken);
      } catch (retryError) {
        if (retryError instanceof AuthError && retryError.status === 401)
          await forget();
        throw retryError;
      }
    }
  }
  return {
    query: <T>(endpoint: string, body: object = {}) =>
      request<T>(endpoint, body),
    send: <T>(endpoint: string, body: object) =>
      serial(() => authorized<T>(endpoint, body)),
    restore: () => serial(renew),
    completeSocial: (input: object) => serial(async () => {
      await remember(await request<AccountSession>(path("social/complete"), input));
    }),
    signIn: (input: Credentials, register: boolean) =>
      serial(async () => {
        await remember(
          await request<AccountSession>(
            path(register ? "register" : "login"),
            input,
          ),
        );
      }),
    verify: () =>
      serial(async () => {
        let result: { user: AccountUser };
        try {
          result = await authorized("/api/auth/session", {});
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
            if (!(error instanceof AuthError) || error.status !== 401)
              throw error;
          }
        }
        await forget();
      }),
  };
}
