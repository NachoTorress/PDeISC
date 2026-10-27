/**
 * Servicio de recuperación de contraseña: emite enlaces de un solo uso que
 * vencen a los 20 minutos y cambia la contraseña revocando las sesiones.
 */
import { randomBytes } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { waitUntil } from '@vercel/functions';
import { hashPassword, tokenHash } from './crypto.mjs';

/** Mensaje único de respuesta: no revela si el correo tiene cuenta. */
export const recoveryMessage = 'Si ese correo tiene una cuenta activa, recibirá un enlace para recuperar la contraseña. Revisá también Spam.';

/** Crea el servicio de recuperación. */
export function createRecoveryService(repository, mailer, config, logger = console, defer = waitUntil) {
  return {
    /** Genera el token y envía el correo en segundo plano con una demora mínima uniforme. */
    async request(email) {
      const minimum = delay(200);
      const token = randomBytes(32).toString('base64url');
      const hash = tokenHash(token);
      const issued = await repository.issue(email, hash, new Date(Date.now() + 20 * 60 * 1000));
      if (issued) {
        const url = `${config.webOrigin}/#reset=${token}`;
        // La respuesta no espera al SMTP: no revela por su duración si existe la cuenta.
        defer(mailer.request(email, url).catch(async () => {
          logger.error({ code: 'RESET_MAIL_FAILED' });
          await repository.revoke(hash).catch(() => logger.error({ code: 'RESET_REVOKE_FAILED' }));
        }));
      }
      await minimum;
      return { message: recoveryMessage };
    },
    /** Cambia la contraseña con un token válido y avisa por correo. */
    async complete(input) {
      const email = await repository.consume(tokenHash(input.token), await hashPassword(input.password));
      defer(mailer.changed(email).catch(() => logger.error({ code: 'RESET_NOTICE_FAILED' })));
      return { message: 'Tu contraseña se actualizó. Volvé a iniciar sesión con la nueva contraseña.' };
    },
  };
}
