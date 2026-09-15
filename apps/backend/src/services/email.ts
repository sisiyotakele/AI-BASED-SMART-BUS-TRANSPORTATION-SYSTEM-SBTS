import nodemailer from 'nodemailer';
import { config } from '@/config';
import { logger } from '@/common/logger';

let cachedTransporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<{ transporter: nodemailer.Transporter | null; isEthereal: boolean }> {
  // If SMTP is explicitly configured with credentials, use it
  if (config.email.provider === 'smtp' && config.email.host && config.email.user && config.email.password) {
    if (!cachedTransporter) {
      cachedTransporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port || 587,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
        tls: {
          rejectUnauthorized: false, // Prevents self-signed cert issues in dev
        },
      });
    }
    return { transporter: cachedTransporter, isEthereal: false };
  }

  // Fallback for development/testing: try auto-creating Ethereal test inbox
  try {
    const testAccount = await nodemailer.createTestAccount();
    const etherealTransporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    return { transporter: etherealTransporter, isEthereal: true };
  } catch (err: any) {
    logger.warn('⚠️ Could not connect to Ethereal test mailer (network proxy/cert). Falling back to console logger.');
    return { transporter: null, isEthereal: false };
  }
}

export async function sendPasswordResetEmail(recipient: string, resetToken: string) {
  const resetUrl = `${config.email.passengerAppUrl || 'http://localhost:5175'}/reset-password?token=${encodeURIComponent(resetToken)}`;

  try {
    const { transporter, isEthereal } = await getTransporter();

    if (!transporter) {
      console.log('\n======================================================');
      console.log(`📨 [PASSWORD RESET EMAIL FOR: ${recipient}]`);
      console.log(`🔗 Click to Reset: ${resetUrl}`);
      console.log('⏰ Valid for: 15 minutes');
      console.log('======================================================\n');
      logger.info('Password reset link logged to console (SMTP not configured)', { recipient });
      return;
    }

    const fromAddress = config.email.from || '"Sheger Bus Support" <support@sbts.local>';

    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject: '🔐 Reset Your Sheger Bus Password',
      text: `Hello,\n\nWe received a request to reset the password for your Sheger Bus account.\n\nPlease open the link below to set a new password (valid for 15 minutes):\n${resetUrl}\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nSheger Bus Team`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 12px;">
          <div style="background-color: #1B2A4A; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; letter-spacing: 1px;">SHEGER BUS</h1>
          </div>
          <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <h2 style="color: #0f172a; margin-top: 0; font-size: 20px;">Password Reset Request</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              We received a request to reset your password for your Sheger Bus Passenger account. Click the button below to choose a new password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #1B2A4A; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
                Reset My Password
              </a>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
              Or copy and paste this link into your browser:<br/>
              <a href="${resetUrl}" style="color: #3b82f6; word-break: break-all;">${resetUrl}</a>
            </p>
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;" />
            <p style="color: #94a3b8; font-size: 11px; margin: 0;">
              ⚠️ This password reset link is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      `,
    });

    logger.info('✅ Password reset email sent successfully', {
      recipient,
      messageId: info.messageId,
      isEthereal,
    });

    if (isEthereal) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('\n======================================================');
      console.log('📨 [DEV EMAIL PREVIEW] Real email generated:');
      console.log(`🔗 Preview in Browser: ${previewUrl}`);
      console.log(`🔑 Direct Reset Link:  ${resetUrl}`);
      console.log('======================================================\n');
    }
  } catch (error: any) {
    logger.error('❌ Failed to send password reset email', {
      recipient,
      error: error?.message || error,
    });
    console.log(`\n⚠️ [EMAIL FALLBACK] Direct Password Reset URL for ${recipient}:\n${resetUrl}\n`);
  }
}