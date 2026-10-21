import { randomUUID } from 'node:crypto';
import { transaction } from '../config/database.mjs';
import { HttpError, unauthorized } from '../lib/errors.mjs';

const userColumns = 'id, email, first_name AS firstName, last_name AS lastName, active, created_at AS createdAt';

export function createAuthRepository(pool) {
  async function publicUser(db, id) {
    const [rows] = await db.execute(`SELECT ${userColumns} FROM users WHERE id = ?`, [id]);
    if (!rows[0] || !rows[0].active) throw unauthorized();
    const [assigned] = await db.execute('SELECT role_code AS code FROM user_roles WHERE user_id = ? ORDER BY role_code', [id]);
    const { active, ...user } = rows[0];
    return { ...user, roles: assigned.map(row => row.code) };
  }

  async function addSession(db, userId, hash, expiresAt) {
    const id = randomUUID();
    await db.execute('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)', [id, userId, expiresAt]);
    await db.execute('INSERT INTO refresh_tokens (token_hash, session_id) VALUES (?, ?)', [hash, id]);
    return id;
  }

  return {
    async ready() { await pool.execute('SELECT 1'); },
    async getUser(id) {
      const [rows] = await pool.execute('SELECT id FROM users WHERE id = ? AND active = TRUE', [id]);
      if (!rows.length) throw new HttpError(404, 'USER_NOT_FOUND', 'No encontramos ese usuario activo.');
      return { ...await publicUser(pool, id), active: true };
    },
    async register(input, hash, expiresAt) {
      try {
        return await transaction(pool, async db => {
          const id = randomUUID();
          await db.execute('INSERT INTO users (id, email, first_name, last_name, password_hash) VALUES (?, ?, ?, ?, ?)',
            [id, input.email, input.firstName, input.lastName, input.passwordHash]);
          await db.execute('INSERT INTO user_roles (user_id, role_code) VALUES (?, ?)', [id, input.accountType === 'guest' ? 'guest' : 'student']);
          const sessionId = await addSession(db, id, hash, expiresAt);
          return { user: await publicUser(db, id), sessionId };
        });
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY')
          throw new HttpError(409, 'EMAIL_REGISTERED', 'Ese correo ya está registrado.');
        throw error;
      }
    },
    async findCredentials(email) {
      const [rows] = await pool.execute('SELECT id, password_hash AS passwordHash, active FROM users WHERE email = ?', [email]);
      return rows[0] ?? null;
    },
    async openSession(userId, hash, expiresAt) {
      return transaction(pool, async db => {
        // Bloquear también al usuario evita abrir una sesión durante una baja futura.
        await db.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
        const user = await publicUser(db, userId);
        return { user, sessionId: await addSession(db, userId, hash, expiresAt) };
      });
    },
    async rotate(oldHash, nextHash) {
      const result = await transaction(pool, async db => {
        const [rows] = await db.execute(`SELECT s.id, s.user_id AS userId,
          s.revoked_at AS revokedAt, t.used_at AS usedAt FROM sessions s
          JOIN refresh_tokens t ON t.session_id = s.id WHERE t.token_hash = ?
          AND s.expires_at > UTC_TIMESTAMP(3) FOR UPDATE`, [oldHash]);
        const session = rows[0];
        if (!session || session.revokedAt) return null;
        if (session.usedAt) {
          // La revocación debe confirmarse, incluso cuando la respuesta será 401.
          await db.execute('UPDATE sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE id = ?', [session.id]);
          return null;
        }
        const user = await publicUser(db, session.userId);
        await db.execute('UPDATE refresh_tokens SET used_at = UTC_TIMESTAMP(3) WHERE token_hash = ?', [oldHash]);
        await db.execute('INSERT INTO refresh_tokens (token_hash, session_id) VALUES (?, ?)', [nextHash, session.id]);
        return { user, sessionId: session.id };
      });
      if (!result) throw unauthorized();
      return result;
    },
    async session(userId, sessionId) {
      const [rows] = await pool.execute(`SELECT id FROM sessions WHERE id = ? AND user_id = ?
        AND revoked_at IS NULL AND expires_at > UTC_TIMESTAMP(3)`, [sessionId, userId]);
      if (!rows.length) throw unauthorized();
      return publicUser(pool, userId);
    },
    async logout(hash) {
      await pool.execute(`UPDATE sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE id IN
        (SELECT session_id FROM refresh_tokens WHERE token_hash = ?) AND revoked_at IS NULL`, [hash]);
    },
    async consumeRate(bucket, limit, windowSeconds) {
      return transaction(pool, async db => {
        // El upsert adquiere un bloqueo exclusivo incluso si la fila ya existe.
        await db.execute(`INSERT INTO auth_rate_limits (bucket, attempts, expires_at) VALUES (?, 0, UTC_TIMESTAMP(3))
          ON DUPLICATE KEY UPDATE bucket = bucket`, [bucket]);
        const [rows] = await db.execute('SELECT attempts, expires_at AS expiresAt, UTC_TIMESTAMP(3) AS nowAt FROM auth_rate_limits WHERE bucket = ? FOR UPDATE', [bucket]);
        const { attempts, expiresAt, nowAt } = rows[0];
        if (expiresAt <= nowAt) {
          await db.execute('UPDATE auth_rate_limits SET attempts = 1, expires_at = ? WHERE bucket = ?',
            [new Date(nowAt.getTime() + windowSeconds * 1000), bucket]);
          return 0;
        }
        if (attempts >= limit) return Math.max(1, Math.ceil((expiresAt - nowAt) / 1000));
        await db.execute('UPDATE auth_rate_limits SET attempts = attempts + 1 WHERE bucket = ?', [bucket]);
        return 0;
      });
    },
    async listUsers({ limit, offset, search = '' }) {
      const [rows] = await pool.query(`SELECT ${userColumns} FROM users
        ${search ? "WHERE LOCATE(?, CONCAT(first_name, ' ', last_name, ' ', email)) > 0" : ''}
        ORDER BY created_at, id LIMIT ? OFFSET ?`, [...(search ? [search] : []), limit, offset]);
      if (!rows.length) return [];
      const [assigned] = await pool.execute(`SELECT user_id AS userId, role_code AS code FROM user_roles
        WHERE user_id IN (${rows.map(() => '?').join(',')}) ORDER BY role_code`, rows.map(row => row.id));
      const grouped = new Map(rows.map(row => [row.id, []]));
      for (const role of assigned) grouped.get(role.userId).push(role.code);
      return rows.map(row => ({ ...row, active: Boolean(row.active), roles: grouped.get(row.id) }));
    },
    async setRoles(id, roles, actorId, expectedRoles) {
      return transaction(pool, async db => {
        // Serializa cambios de permisos: no pueden quitarse dos últimos administradores a la vez.
        await db.execute("SELECT code FROM roles WHERE code = 'admin' FOR UPDATE");
        const [actor] = await db.execute("SELECT ur.user_id FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE ur.user_id = ? AND ur.role_code = 'admin' AND u.active = TRUE", [actorId]);
        if (!actor.length) throw new HttpError(403, 'FORBIDDEN', 'Necesitás permiso de administrador.');
        const [users] = await db.execute('SELECT id FROM users WHERE id = ? AND active = TRUE FOR UPDATE', [id]);
        if (!users.length) throw new HttpError(404, 'USER_NOT_FOUND', 'No encontramos ese usuario.');
        if (expectedRoles !== undefined) {
          const [current] = await db.execute('SELECT role_code AS code FROM user_roles WHERE user_id = ? ORDER BY role_code', [id]);
          if (current.map(row => row.code).sort().join(',') !== [...expectedRoles].sort().join(','))
            throw new HttpError(409, 'ROLES_CHANGED', 'Otra persona modificó los permisos. Conservá tu selección y recargá la cuenta antes de guardar.');
        }
        const [admins] = await db.execute("SELECT ur.user_id FROM user_roles ur JOIN users u ON u.id = ur.user_id WHERE ur.role_code = 'admin' AND u.active = TRUE");
        if (!roles.includes('admin') && admins.length === 1 && admins[0].user_id === id)
          throw new HttpError(409, 'LAST_ADMIN', 'Debe quedar al menos un administrador activo.');
        await db.execute('DELETE FROM user_roles WHERE user_id = ?', [id]);
        for (const role of roles) await db.execute('INSERT INTO user_roles (user_id, role_code) VALUES (?, ?)', [id, role]);
        return publicUser(db, id);
      });
    },
  };
}
