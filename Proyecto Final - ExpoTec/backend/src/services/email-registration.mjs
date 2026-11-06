/** Alta web en dos pasos: código por correo y datos pendientes cifrados durante 20 minutos. */
import { createHash, randomInt, timingSafeEqual } from 'node:crypto';
import { EncryptJWT, jwtDecrypt } from 'jose';
import { hashPassword } from './crypto.mjs';
import { HttpError } from '../lib/errors.mjs';
import { objectBody } from '../validators/auth.mjs';

export function createEmailRegistration(repository, config, mailer) {
  const key = () => createHash('sha256').update('expotec-web-registration-v1\0').update(config.secret).digest();
  const digest = value => createHash('sha256').update(value).digest();
  const invalid = () => new HttpError(400, 'EMAIL_CODE_INVALID', 'El código no es correcto o venció. Revisá el correo o solicitá otro código.');
  return {
    async request(input) {
      if (!mailer?.registration) throw new HttpError(503, 'EMAIL_UNAVAILABLE', 'El envío de verificación no está disponible. Volvé a intentar en unos minutos.');
      if (await repository.findCredentials(input.email)) throw new HttpError(409, 'EMAIL_REGISTERED', 'Ese correo ya está registrado. Iniciá sesión o recuperá tu contraseña.');
      const code = String(randomInt(10000000, 100000000));
      const { password, ...account } = input;
      const verificationToken = await new EncryptJWT({ account: { ...account, passwordHash: await hashPassword(password) }, codeHash: digest(code).toString('base64url') })
        .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }).setIssuer('expotec-email-registration').setAudience('expotec-web').setIssuedAt().setExpirationTime('20m').encrypt(key());
      try { await mailer.registration(input.email, code); }
      catch { throw new HttpError(503, 'EMAIL_SEND_FAILED', 'No pudimos enviar el correo. Tu cuenta todavía no se creó. Volvé a intentar.'); }
      return { verificationToken, email: input.email, message: 'Enviamos un código a tu correo. Revisá también Spam y confirmalo para crear tu cuenta.' };
    },
    async verify(body) {
      objectBody(body, ['verificationToken', 'code']);
      if (typeof body.verificationToken !== 'string' || body.verificationToken.length > 4000 || typeof body.code !== 'string' || !/^\d{8}$/.test(body.code)) throw invalid();
      let payload;
      try { ({ payload } = await jwtDecrypt(body.verificationToken, key(), { issuer: 'expotec-email-registration', audience: 'expotec-web', keyManagementAlgorithms: ['dir'], contentEncryptionAlgorithms: ['A256GCM'] })); }
      catch { throw invalid(); }
      if (typeof payload.codeHash !== 'string' || !payload.account || typeof payload.account.email !== 'string') throw invalid();
      const expected = Buffer.from(payload.codeHash, 'base64url'), actual = digest(body.code);
      if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) throw invalid();
      return payload.account;
    },
  };
}
