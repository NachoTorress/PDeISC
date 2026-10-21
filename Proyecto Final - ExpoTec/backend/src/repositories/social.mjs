import { randomUUID } from 'node:crypto';
import { transaction } from '../config/database.mjs';
import { HttpError, unauthorized } from '../lib/errors.mjs';
import { publicUser, addSession } from './auth.mjs';
import { socialFailure } from '../services/social-providers.mjs';

const columns = 'id, provider, status, subject, email';
export function createSocialRepository(pool) {
  async function flow(db, id, proofHash, lock = false) {
    const [rows] = await db.execute(`SELECT ${columns} FROM social_flows WHERE id = ? AND proof_hash = ? AND expires_at > UTC_TIMESTAMP(3)${lock ? ' FOR UPDATE' : ''}`, [id, proofHash]);
    if (!rows[0] || rows[0].status !== 'verified') throw socialFailure();
    return rows[0];
  }
  return {
    async start(input) {
      await pool.execute(`INSERT INTO social_flows (id, provider, state_hash, proof_hash, binding_hash, verifier, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [input.id, input.provider, input.stateHash, input.proofHash, input.bindingHash, input.verifier, input.expiresAt]);
    },
    async claim(provider, stateHash, bindingHash) {
      return transaction(pool, async db => {
        const [rows] = await db.execute(`SELECT id, verifier FROM social_flows WHERE provider = ? AND state_hash = ? AND binding_hash = ? AND status = 'started' AND expires_at > UTC_TIMESTAMP(3) FOR UPDATE`, [provider, stateHash, bindingHash]);
        if (!rows[0]) throw socialFailure();
        await db.execute("UPDATE social_flows SET status = 'processing', verifier = NULL WHERE id = ?", [rows[0].id]);
        return rows[0];
      });
    },
    async verified(id, identity) {
      const [result] = await pool.execute(`UPDATE social_flows SET status = 'verified', subject = ?, email = ? WHERE id = ? AND status = 'processing' AND expires_at > UTC_TIMESTAMP(3)`, [identity.subject, identity.email, id]);
      if (result.affectedRows !== 1) throw socialFailure();
    },
    async failed(id) {
      await pool.execute("UPDATE social_flows SET status = 'failed', subject = NULL, email = NULL, verifier = NULL WHERE id = ? AND status = 'processing'", [id]);
    },
    inspect: (id, proofHash) => flow(pool, id, proofHash),
    async mode(identity) {
      const [linked] = await pool.execute('SELECT user_id FROM social_identities WHERE provider = ? AND subject = ?', [identity.provider, identity.subject]);
      if (linked.length) return 'login';
      const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [identity.email]);
      return users.length ? 'link' : 'signup';
    },
    async complete(input, hash, expiresAt) {
      try {
        return await transaction(pool, async db => {
          const current = await flow(db, input.id, input.proofHash, true);
          // Serializa altas y vinculaciones de cada proveedor incluso cuando aún no hay identidad.
          await db.execute('SELECT code FROM social_providers WHERE code = ? FOR UPDATE', [current.provider]);
          const [linked] = await db.execute('SELECT user_id AS userId FROM social_identities WHERE provider = ? AND subject = ? FOR UPDATE', [current.provider, current.subject]);
          let userId = linked[0]?.userId;
          if (userId) {
            if (input.mode !== 'login') throw new HttpError(409, 'SOCIAL_CHANGED', 'La cuenta cambió. Volvé a iniciar el acceso.');
            await db.execute('SELECT id FROM users WHERE id = ? FOR UPDATE', [userId]);
          } else {
            const [users] = await db.execute('SELECT id, active, password_hash AS passwordHash FROM users WHERE email = ? FOR UPDATE', [current.email]);
            const account = users[0];
            if (account) {
              if (input.mode !== 'link') throw new HttpError(409, 'SOCIAL_CHANGED', 'Ese correo ya tiene cuenta. Volvé a iniciar el acceso para vincularla.');
              if (!account.active || account.id !== input.accountId || account.passwordHash !== input.expectedPasswordHash) throw unauthorized();
              userId = account.id;
            } else {
              if (input.mode !== 'signup') throw socialFailure();
              userId = randomUUID();
              await db.execute('INSERT INTO users (id, email, first_name, last_name, password_hash) VALUES (?, ?, ?, ?, ?)', [userId, current.email, input.firstName, input.lastName, input.passwordHash]);
              await db.execute('INSERT INTO user_roles (user_id, role_code) VALUES (?, ?)', [userId, input.accountType]);
            }
            await db.execute('INSERT INTO social_identities (provider, subject, user_id) VALUES (?, ?, ?)', [current.provider, current.subject, userId]);
          }
          const user = await publicUser(db, userId);
          const sessionId = await addSession(db, userId, hash, expiresAt);
          await db.execute("UPDATE social_flows SET status = 'consumed', subject = NULL, email = NULL WHERE id = ?", [current.id]);
          return { user, sessionId };
        });
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'SOCIAL_CONFLICT', 'Esa cuenta ya está registrada o tiene otro acceso del mismo proveedor. Ingresá con tu contraseña.');
        throw error;
      }
    },
  };
}
