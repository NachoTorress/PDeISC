import { comparePassword, hashPassword, issueJwt } from './security.js';
import { pool } from './db.js';

export const publicUser = (user, linkedProviders = []) => ({
  id: String(user.id), email: user.email, displayName: user.display_name,
  role: user.role_id === 1 ? 'admin' : 'user', createdAt: user.created_at,
  linkedProviders
});

export async function getLinkedProviders(userId) {
  const [rows] = await pool.execute('SELECT provider FROM oauth_identities WHERE user_id = ?', [userId]);
  return rows.map((row) => row.provider);
}

export const session = async (user) => ({
  token: issueJwt(user),
  user: publicUser(user, await getLinkedProviders(user.id))
});

export async function findByEmail(db, email, lock = false) {
  const [rows] = await db.execute(`SELECT * FROM users WHERE email = ?${lock ? ' FOR UPDATE' : ''}`, [email]);
  return rows[0];
}

export async function saveAnswers(db, userId, items) {
  await db.execute('DELETE FROM user_security_answers WHERE user_id = ?', [userId]);
  for (const item of items) {
    await db.execute('INSERT INTO user_security_answers (user_id, question_id, answer_hash) VALUES (?, ?, ?)',
      [userId, item.questionId, await hashPassword(item.answer.trim().toLowerCase())]);
  }
}

export async function checkAnswers(db, userId, items) {
  const [rows] = await db.execute('SELECT question_id, answer_hash FROM user_security_answers WHERE user_id = ?', [userId]);
  if (rows.length !== 2) return false;
  for (const item of items) {
    const row = rows.find((record) => record.question_id === item.questionId);
    if (!row || !(await comparePassword(item.answer.trim().toLowerCase(), row.answer_hash))) return false;
  }
  return true;
}
