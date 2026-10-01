import nodemailer from 'nodemailer';

// El código solo se envía al correo configurado; nunca se registra en consola.
export async function sendCode(email, code, purpose) {
  if (!process.env.SMTP_HOST) throw Object.assign(new Error('El correo no está configurado'), { status: 503 });
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
  });
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: purpose === 'reset_password' ? 'Recuperá tu contraseña' : 'Verificá tu correo',
    text: `Tu código de verificación es ${code}. Vence en 10 minutos. Si no lo solicitaste, ignorá este mensaje.`
  });
  transporter.close();
}
