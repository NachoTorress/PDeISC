import test from "node:test";
import assert from "node:assert/strict";
import { createAuthClient } from "./authClient";
import { AuthError } from "./authTypes";
import type {
  AccountSession,
  AccountUser,
  AuthRequest,
  SessionStorage,
} from "./authTypes";

const user: AccountUser = {
  id: "account",
  email: "alumna@example.com",
  firstName: "Lucía",
  lastName: "Fernández",
  roles: ["student"],
  createdAt: "2026-10-19",
};
const session: AccountSession = {
  user,
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
};

test("el acceso social web adopta la sesión en memoria sin guardar tokens en el navegador", async () => {
  const body = { id: "flow", proof: "temporary", mode: "login" };
  const app = setup(async (path, input) => {
    assert.equal(path, "/api/auth/browser/social/complete");
    assert.deepEqual(input, body);
    return { ...session, refreshToken: undefined };
  }, true);
  await app.client.completeSocial(body);
  assert.deepEqual(app.user(), user);
  assert.equal(app.saved(), "previous");
});
function setup(
  handler: (path: string, body: object, token?: string) => Promise<unknown>,
  browser = false,
) {
  let saved: string | null = "previous";
  let current: AccountUser | null = null;
  const storage: SessionStorage = {
    browser,
    read: async () => saved,
    write: async (value) => {
      saved = value;
    },
    clear: async () => {
      saved = null;
    },
    lock: async (action) => action(),
  };
  const client = createAuthClient(handler as AuthRequest, storage, (value) => {
    current = value;
  });
  return { client, storage, saved: () => saved, user: () => current };
}

test("restaura y rota; una revocación borra la sesión pero una desconexión permite reintentar", async () => {
  let fail = 0;
  const app = setup(async () => {
    if (fail) throw new AuthError("Sin conexión", fail);
    return session;
  });
  await app.client.restore();
  assert.equal(app.saved(), "refresh");
  assert.deepEqual(app.user(), user);
  fail = 503;
  await assert.rejects(app.client.restore());
  assert.equal(app.saved(), "refresh");
  fail = 401;
  await app.client.restore();
  assert.equal(app.saved(), null);
  assert.equal(app.user(), null);
});

test("restauración y cierre simultáneos se ejecutan en orden, sin resucitar la cuenta", async () => {
  const calls: string[] = [];
  const app = setup(async (path) => {
    calls.push(path);
    return session;
  });
  await Promise.all([app.client.restore(), app.client.signOut()]);
  assert.deepEqual(calls, ["/api/auth/refresh", "/api/auth/logout"]);
  assert.equal(app.user(), null);
  assert.equal(app.saved(), null);
});

test("verifica permisos actuales y renueva una sola vez ante acceso vencido", async () => {
  let rejected = false;
  const calls: string[] = [];
  const app = setup(async (path, _body, token) => {
    calls.push(path);
    if (path.endsWith("/session")) {
      assert.equal(token, "access");
      if (!rejected) {
        rejected = true;
        throw new AuthError("Vencido", 401);
      }
      return { user: { ...user, roles: ["student", "teacher"] } };
    }
    return session;
  });
  await app.client.restore();
  await app.client.verify();
  assert.deepEqual(app.user()?.roles, ["student", "teacher"]);
  assert.deepEqual(calls, [
    "/api/auth/refresh",
    "/api/auth/session",
    "/api/auth/refresh",
    "/api/auth/session",
  ]);
});

test("web usa cookie sin leer ni escribir tokens en almacenamiento del cliente", async () => {
  const app = setup(async (path, body) => {
    assert.match(path, /\/browser\//);
    assert.deepEqual(body, {});
    return { ...session, refreshToken: undefined };
  }, true);
  app.storage.read = app.storage.write = async () => {
    throw new Error("No debe acceder");
  };
  await app.client.restore();
  await app.client.signOut();
  assert.equal(app.user(), null);
});

test("fallo del almacenamiento seguro revoca la sesión recién creada", async () => {
  const calls: string[] = [];
  const app = setup(async (path) => {
    calls.push(path);
    return session;
  });
  app.storage.write = async () => {
    throw new Error("Almacenamiento bloqueado");
  };
  await assert.rejects(
    app.client.signIn({ email: user.email, password: "password" }, false),
    /forma segura/,
  );
  assert.deepEqual(calls, ["/api/auth/login", "/api/auth/logout"]);
  assert.equal(app.user(), null);
});

test("no informa cierre exitoso si el servidor no pudo revocar la sesión", async () => {
  const app = setup(async (path) => {
    if (path.endsWith("/logout")) throw new AuthError("Sin conexión", 503);
    return session;
  });
  await app.client.restore();
  await assert.rejects(app.client.signOut());
  assert.deepEqual(app.user(), user);
  assert.equal(app.saved(), "refresh");
});

test("una sesión revocada no se informa como verificada", async () => {
  let revoked = false;
  const app = setup(async () => {
    if (revoked) throw new AuthError("Sesión revocada", 401);
    return session;
  });
  await app.client.restore();
  revoked = true;
  assert.equal(await app.client.verify(), false);
  assert.equal(app.user(), null);
  assert.equal(app.saved(), null);
});

test("las consultas públicas no envían acceso y un conflicto de guardado no se reintenta", async () => {
  let writes = 0;
  const app = setup(async (path, body, token) => {
    if (path.endsWith("/refresh")) return session;
    if (path.endsWith("/query")) {
      assert.equal(token, undefined);
      return { spaces: [] };
    }
    assert.equal(token, "access");
    assert.deepEqual(body, { version: 4 });
    writes++;
    throw new AuthError("Otra persona modificó el espacio", 409);
  });
  await app.client.restore();
  await app.client.query("/api/spaces/query");
  await assert.rejects(
    app.client.send("/api/spaces/space/save", { version: 4 }),
    (error) => error instanceof AuthError && error.status === 409,
  );
  assert.equal(writes, 1);
  assert.equal(app.saved(), "refresh");
});

test("una escritura sin sesión no llega al endpoint protegido", async () => {
  const app = setup(async () => {
    throw new Error("No debe enviar solicitudes");
  });
  await app.storage.clear();
  await assert.rejects(
    app.client.send("/api/spaces/create", {}),
    (error) => error instanceof AuthError && error.status === 401,
  );
});
