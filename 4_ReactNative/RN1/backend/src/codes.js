import { digest, equalDigest, newCode } from './security.js';
import { sendCode } from './mail.js';

// Genera un código de un solo uso. La transacción de creación se confirma antes de enviar correo.
export async function createCode(connection, userId, purpose) {
  const code = newCode();
  await connection.execute('UPDATE verification_codes SET consumed_at = NOW() WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL', [userId, purpose]);
  await connection.execute('INSERT INTO verification_codes (user_id, purpose, code_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))', [userId, purpose, digest(code)]);
  return code;
}

export async function deliverCode(email, code, purpose) {
  await sendCode(email, code, purpose);
}

// Valida el último código vigente y lo consume; limita intentos por código.
export async function consumeCode(connection, userId, purpose, value) {
  const [rows] = await connection.execute('SELECT id, code_hash, attempts, expires_at FROM verification_codes WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL ORDER BY id DESC LIMIT 1 FOR UPDATE', [userId, purpose]);
  const record = rows[0];
  if (!record || record.attempts >= 5 || new Date(record.expires_at) < new Date()) {
    throw Object.assign(new Error('Código vencido o inválido. Pedí uno nuevo.'), { status: 422 });
  }
  if (!equalDigest(record.code_hash, digest(value))) {
    await connection.execute('UPDATE verification_codes SET attempts = attempts + 1 WHERE id = ?', [record.id]);
    return false;
  }
  await connection.execute('UPDATE verification_codes SET consumed_at = NOW() WHERE id = ?', [record.id]);
  return true;
}
