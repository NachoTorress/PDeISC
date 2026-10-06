import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from './config.js';

export const randomToken = () => randomBytes(32).toString('base64url');
export const digest = (value) => createHmac('sha256', config.hmacSecret).update(value).digest('hex');
export const pkceChallenge = (verifier) => createHash('sha256').update(verifier).digest('base64url');
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0');
export const hashPassword = (value) => bcrypt.hash(value, 12);
export const comparePassword = (value, hash) => bcrypt.compare(value, hash);
export const issueJwt = (user) => jwt.sign({ sub: String(user.id), role: user.role_id, credential: digest(user.password_hash || '') }, config.jwtSecret, { expiresIn: '7d', issuer: 'acceso-api' });
export const verifyJwt = (token) => jwt.verify(token, config.jwtSecret, { issuer: 'acceso-api' });
export function equalDigest(a, b) {
  const first = Buffer.from(a, 'hex');
  const second = Buffer.from(b, 'hex');
  return first.length === second.length && timingSafeEqual(first, second);
}
