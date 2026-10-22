import { transaction } from '../config/database.mjs';
import { HttpError } from '../lib/errors.mjs';

export function createRecoveryRepository(pool) {
  return {
    async issue(email, hash, expiresAt) {
      return transaction(pool, async db => {
        const [users] = await db.execute('SELECT id FROM users WHERE email = ? AND active = TRUE FOR UPDATE', [email]);
        if (!users.length) return false;
        await db.execute('UPDATE password_resets SET used_at = UTC_TIMESTAMP(3) WHERE user_id = ? AND used_at IS NULL', [users[0].id]);
        await db.execute('INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [hash, users[0].id, expiresAt]);
        return true;
      });
    },
    async revoke(hash) {
      await pool.execute('UPDATE password_resets SET used_at = UTC_TIMESTAMP(3) WHERE token_hash = ? AND used_at IS NULL', [hash]);
    },
    async consume(hash, passwordHash) {
      return transaction(pool, async db => {
        const invalid = () => new HttpError(400, 'RESET_INVALID', 'El enlace venció o ya fue utilizado. Solicitá uno nuevo.');
        const [tokens] = await db.execute('SELECT user_id AS userId FROM password_resets WHERE token_hash = ?', [hash]);
        if (!tokens.length) throw invalid();
        const id = tokens[0].userId;
        const [users] = await db.execute('SELECT email FROM users WHERE id = ? AND active = TRUE FOR UPDATE', [id]);
        if (!users.length) throw invalid();
        const [valid] = await db.execute('SELECT token_hash FROM password_resets WHERE token_hash = ? AND user_id = ? AND used_at IS NULL AND expires_at > UTC_TIMESTAMP(3) FOR UPDATE', [hash, id]);
        if (!valid.length) throw invalid();
        await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, id]);
        await db.execute('UPDATE password_resets SET used_at = UTC_TIMESTAMP(3) WHERE user_id = ? AND used_at IS NULL', [id]);
        await db.execute('UPDATE sessions SET revoked_at = UTC_TIMESTAMP(3) WHERE user_id = ? AND revoked_at IS NULL', [id]);
        return users[0].email;
      });
    },
  };
}
