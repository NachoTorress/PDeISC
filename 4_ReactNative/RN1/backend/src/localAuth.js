import { Router } from 'express';
import { pool, transaction } from './db.js';
import { createCode, consumeCode, deliverCode } from './codes.js';
import { comparePassword, digest, hashPassword, verifyJwt } from './security.js';
import { checkAnswers, findByEmail, getLinkedProviders, saveAnswers, session, publicUser } from './users.js';
import { codeSchema, credentialSchema, email, loginSchema, parse, registerSchema, resetSchema } from './validation.js';

export const localAuth = Router();
const route = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
const badCode = () => Object.assign(new Error('Código incorrecto. Revisalo e intentá de nuevo.'), { status: 422 });

localAuth.post('/register', route(async (req, res) => {
  const data = parse(registerSchema, req.body);
  if (!process.env.SMTP_HOST) throw Object.assign(new Error('Configurá SMTP para habilitar el registro'), { status: 503 });
  const hash = await hashPassword(data.password);
  const answerHashes = await Promise.all(data.answers.map(async (item) => ({ ...item, hash: await hashPassword(item.answer.trim().toLowerCase()) })));
  const code = await transaction(async (db) => {
    if (await findByEmail(db, data.email, true)) throw Object.assign(new Error('Este correo ya tiene una cuenta. Iniciá sesión o activá contraseña local.'), { status: 409 });
    const [result] = await db.execute('INSERT INTO users (email, display_name, password_hash) VALUES (?, ?, ?)', [data.email, data.displayName, hash]);
    for (const item of answerHashes) await db.execute('INSERT INTO user_security_answers (user_id, question_id, answer_hash) VALUES (?, ?, ?)', [result.insertId, item.questionId, item.hash]);
    return createCode(db, result.insertId, 'verify_email');
  });
  await deliverCode(data.email, code, 'verify_email');
  res.status(201).json({ message: 'Te enviamos un código de seis dígitos.' });
}));

localAuth.post('/verify-email', route(async (req, res) => {
  const data = parse(codeSchema, req.body);
  const user = await transaction(async (db) => {
    const found = await findByEmail(db, data.email, true);
    if (!found) throw badCode();
    if (!(await consumeCode(db, found.id, 'verify_email', data.code))) return null;
    await db.execute('UPDATE users SET email_verified_at = NOW() WHERE id = ?', [found.id]);
    return { ...found, email_verified_at: new Date() };
  });
  if (!user) throw badCode();
  res.json(await session(user));
}));

localAuth.post('/login', route(async (req, res) => {
  const data = parse(loginSchema, req.body);
  const [matches] = await pool.execute('SELECT * FROM users WHERE email = ? LIMIT 1', [data.identifier]);
  const user = matches[0];
  if (!user || !user.password_hash || !(await comparePassword(data.password, user.password_hash))) {
    throw Object.assign(new Error('Correo o contraseña incorrectos.'), { status: 401 });
  }
  if (!user.email_verified_at) throw Object.assign(new Error('Verificá tu correo antes de ingresar.'), { status: 403, code: 'EMAIL_UNVERIFIED' });
  res.json(await session(user));
}));

localAuth.post('/request-code', route(async (req, res) => {
  const parsedEmail = parse(email, req.body.email);
  const purpose = req.body.purpose;
  if (!['verify_email', 'activate_local', 'reset_password'].includes(purpose)) throw Object.assign(new Error('Operación inválida'), { status: 422 });
  const user = await findByEmail(pool, parsedEmail);
  const allowed = user && ((purpose === 'verify_email' && !user.email_verified_at) ||
    (purpose === 'activate_local' && !user.password_hash && user.email_verified_at) ||
    (purpose === 'reset_password' && user.password_hash && user.email_verified_at));
  if (allowed) {
    if (!process.env.SMTP_HOST) throw Object.assign(new Error('Correo no configurado'), { status: 503 });
    const code = await transaction((db) => createCode(db, user.id, purpose));
    await deliverCode(user.email, code, purpose);
  }
  res.json({ message: 'Si corresponde, enviamos un código al correo.' });
}));

localAuth.post('/activate-local', route(async (req, res) => {
  const data = parse(credentialSchema, req.body);
  const hash = await hashPassword(data.password);
  const user = await transaction(async (db) => {
    const found = await findByEmail(db, data.email, true);
    if (!found || found.password_hash || !found.email_verified_at) throw badCode();
    if (!(await consumeCode(db, found.id, 'activate_local', data.code))) return null;
    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, found.id]);
    await saveAnswers(db, found.id, data.answers);
    return { ...found, password_hash: hash };
  });
  if (!user) throw badCode();
  res.json(await session(user));
}));

localAuth.post('/reset-password', route(async (req, res) => {
  const data = parse(resetSchema, req.body);
  const hash = await hashPassword(data.password);
  const changed = await transaction(async (db) => {
    const user = await findByEmail(db, data.email, true);
    if (!user || !user.password_hash || !(await checkAnswers(db, user.id, data.answers))) throw badCode();
    if (!(await consumeCode(db, user.id, 'reset_password', data.code))) return false;
    await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, user.id]);
    return true;
  });
  if (!changed) throw badCode();
  res.json({ message: 'Contraseña actualizada. Ya podés ingresar.' });
}));

localAuth.post('/me', route(async (req, res) => {
  const token = req.headers.authorization?.replace(/^Bearer /, '');
  if (!token) throw Object.assign(new Error('Sesión inválida'), { status: 401 });
  const payload = verifyJwt(token);
  const [rows] = await pool.execute('SELECT * FROM users WHERE id = ?', [payload.sub]);
  if (!rows[0] || payload.credential !== digest(rows[0].password_hash || '')) {
    throw Object.assign(new Error('Sesión inválida'), { status: 401 });
  }
  res.json({ user: publicUser(rows[0], await getLinkedProviders(rows[0].id)) });
}));
