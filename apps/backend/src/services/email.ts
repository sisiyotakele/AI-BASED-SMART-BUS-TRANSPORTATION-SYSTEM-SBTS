import nodemailer from 'nodemailer';
import { config } from '@/config';

const transporter = config.email.host && config.email.user && config.email.password
  ? nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: { user: config.email.user, pass: config.email.password },
    })
  : null;

export async function sendPasswordResetEmail(recipient: string, resetToken: string) {
  if (config.email.provider !== 'smtp' || !transporter) {
    throw new Error('SMTP email is not configured. Set EMAIL_PROVIDER=smtp and SMTP credentials.');
  }

  const resetUrl = `${config.email.passengerAppUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;
  await transporter.sendMail({
    from: config.email.from,
    to: recipient,
    subject: 'Reset your Sheger Bus password',
    text: `Reset your password by opening this link (valid for 15 minutes): ${resetUrl}`,
    html: `<p>We received a request to reset your Sheger Bus password.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 15 minutes.</p>`,
  });
}