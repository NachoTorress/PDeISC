/**
 * Utilidades de prueba: configuración, repositorio de cuentas en memoria y cliente HTTP con atajos REST (get, put, patch, del).
 */
import { randomUUID } from 'node:crypto';
import { HttpError, unauthorized } from '../src/lib/errors.mjs';
import { readConfig } from '../src/config/env.mjs';

export const testConfig = readConfig({ JWT_SECRET: 'test-secret-'.repeat(5), CORS_ORIGINS: 'http://localhost:8081' });

// Sustituye solo el almacenamiento; HTTP, validación, hash y JWT son los de producción.
export function memoryRepository() {
  const users = new Map(), sessions = new Map(), tokens = new Map();
  const publicUser = user => {
    const { passwordHash, active, ...value } = user;
    return structuredClone(value);
  };
  function open(user, hash, expiresAt) {
    const sessionId = randomUUID();
    sessions.set(sessionId, { userId: user.id, expiresAt, revoked: false });
    tokens.set(hash, { sessionId, used: false });
    return { user: publicUser(user), sessionId };
  }
  return {
    users, sessions, tokens,
    async ready() {},
    async consumeRate() { return 0; },
    async register(input, hash, expiresAt) {
      if ([...users.values()].some(user => user.email === input.email))
        throw new HttpError(409, 'EMAIL_REGISTERED', 'Ese correo ya está registrado.');
      const { accountType, ...account } = input;
      const user = { ...account, id: randomUUID(), roles: [accountType === 'guest' ? 'guest' : 'student'], active: true, createdAt: new Date().toISOString() };
      users.set(user.id, user);
      return open(user, hash, expiresAt);
    },
    async findCredentials(email) { return [...users.values()].find(user => user.email === email) ?? null; },
    async openSession(id, hash, expiresAt) { return open(users.get(id), hash, expiresAt); },
    async rotate(hash, next) {
      const token = tokens.get(hash), session = token && sessions.get(token.sessionId);
      if (!session || session.revoked || session.expiresAt <= new Date()) throw unauthorized();
      if (token.used) { session.revoked = true; throw unauthorized(); }
      token.used = true;
      tokens.set(next, { sessionId: token.sessionId, used: false });
      return { user: publicUser(users.get(session.userId)), sessionId: token.sessionId };
    },
    async session(userId, sessionId) {
      const session = sessions.get(sessionId), user = users.get(userId);
      if (!session || session.userId !== userId || session.revoked || session.expiresAt <= new Date() || !user?.active) throw unauthorized();
      return publicUser(user);
    },
    async logout(hash) {
      const token = tokens.get(hash);
      if (token) sessions.get(token.sessionId).revoked = true;
    },
    async listUsers({ limit, offset }) { return [...users.values()].slice(offset, offset + limit).map(publicUser); },
  };
}

export async function listen(app) {
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  return {
    base,
    close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())),
    /**
     * Envía una solicitud JSON a la API de prueba.
     * En GET y DELETE el objeto `body` se convierte en query string, igual que el cliente real.
     */
    async request(path, body = {}, accessToken, options = {}) {
      const method = options.method ?? 'POST';
      const withoutBody = ['OPTIONS', 'GET', 'DELETE'].includes(method);
      let url = `${base}${path}`;
      if (withoutBody && body && Object.keys(body).length) {
        const params = new URLSearchParams(Object.entries(body).map(([key, value]) => [key, String(value)]));
        url += (url.includes('?') ? '&' : '?') + params;
      }
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...options.headers },
        ...(withoutBody ? {} : { body: options.raw ?? JSON.stringify(body) }),
      });
      const text = await response.text();
      return { status: response.status, headers: response.headers, body: text ? JSON.parse(text) : null };
    },
    /** Atajos REST: mismos parámetros que request(), con el método ya indicado. */
    get(path, query, accessToken, options = {}) { return this.request(path, query, accessToken, { ...options, method: 'GET' }); },
    put(path, body, accessToken, options = {}) { return this.request(path, body, accessToken, { ...options, method: 'PUT' }); },
    patch(path, body, accessToken, options = {}) { return this.request(path, body, accessToken, { ...options, method: 'PATCH' }); },
    del(path, query, accessToken, options = {}) { return this.request(path, query, accessToken, { ...options, method: 'DELETE' }); },
  };
}
