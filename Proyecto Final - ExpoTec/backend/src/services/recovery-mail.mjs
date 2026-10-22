import nodemailer from 'nodemailer';

export function createRecoveryMailer(config) {
  const { smtp } = config;
  const transport = nodemailer.createTransport({
    host: smtp.host, port: smtp.port, secure: smtp.port === 465, requireTLS: true,
    auth: { user: smtp.user, pass: smtp.password },
    tls: { minVersion: 'TLSv1.2', rejectUnauthorized: true },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 15000,
    disableFileAccess: true, disableUrlAccess: true,
  });
  const send = (email, subject, text) => transport.sendMail({ from: { name: 'ExpoTec', address: smtp.user }, to: email, subject, text });
  return {
    verify: () => transport.verify(),
    request: (email, url) => send(email, 'Recuperá tu contraseña de ExpoTec', `Recibimos un pedido para recuperar tu acceso a ExpoTec.\n\nAbrí este enlace y elegí una contraseña nueva:\n${url}\n\nEl enlace vence en 20 minutos y se puede usar una sola vez. Si pediste más de uno, usá el último.\n\nSi no hiciste este pedido, podés ignorar este correo. Tu contraseña no cambió.`),
    changed: email => send(email, 'Tu contraseña de ExpoTec fue actualizada', 'Tu contraseña de ExpoTec se actualizó y cerramos las sesiones anteriores.\n\nSi no hiciste este cambio, solicitá una recuperación desde la página de ExpoTec.'),
  };
}
