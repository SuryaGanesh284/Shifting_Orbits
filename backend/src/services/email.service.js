const nodemailer = require('nodemailer');
const logger = console;

let transporter = null;

const createTransporter = async () => {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === 'test') {
    transporter = {
      sendMail: async (mailOptions) => {
        return { messageId: 'test-' + Date.now() };
      }
    };
    return transporter;
  }

  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
    logger.info(`[Email] Configured SMTP transporter with user: ${user}`);
  } else {
    // If no credentials provided, use ethereal test account or fallback console logger
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      logger.info(`[Email] Using Ethereal test mailer: ${testAccount.user}`);
    } catch (err) {
      logger.warn('[Email] Could not create Ethereal account, falling back to mock transport');
      transporter = {
        sendMail: async (mailOptions) => {
          logger.info(`[Email Mock] To: ${mailOptions.to}, Subject: ${mailOptions.subject}`);
          return { messageId: 'mock-' + Date.now() };
        }
      };
    }
  }

  return transporter;
};

/**
 * Send OTP Verification Email
 */
const sendOtpEmail = async (toEmail, otpCode, userName = 'Student') => {
  const mailer = await createTransporter();
  const fromAddress = process.env.EMAIL_FROM || process.env.EMAIL_USER || '"Shifting Orbits Foundation" <noreply@shiftingorbits.org>';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { background: #1a1a1a; padding: 32px 24px; text-align: center; }
          .header h1 { color: #ffffff; font-size: 20px; margin: 0; font-weight: 800; letter-spacing: -0.5px; }
          .badge { display: inline-block; background: #AAFF00; color: #1a1a1a; font-weight: 900; font-size: 11px; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .content { padding: 36px 32px; text-align: center; }
          .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
          .message { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 28px; }
          .otp-box { background: #f8fafc; border: 2px dashed #AAFF00; border-radius: 16px; padding: 20px; margin: 0 auto 28px; display: inline-block; min-width: 220px; }
          .otp-code { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #0f172a; font-family: monospace; }
          .expiry-note { font-size: 12px; color: #64748b; margin-top: 6px; }
          .security-tip { font-size: 12px; color: #94a3b8; line-height: 1.5; border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: left; }
          .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="badge">Shifting Orbits Foundation</div>
            <h1>Email Verification</h1>
          </div>
          <div class="content">
            <p class="greeting">Hello ${userName}, 👋</p>
            <p class="message">
              Thank you for joining the Shifting Orbits Foundation platform! Please use the 6-digit verification code below to verify your email and activate your account.
            </p>
            <div class="otp-box">
              <div class="otp-code">${otpCode}</div>
              <div class="expiry-note">⏱️ Code expires in 10 minutes</div>
            </div>
            <div class="security-tip">
              <strong>Security Notice:</strong> If you did not request this registration, please safely ignore this email. Never share your verification code with anyone.
            </div>
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Shifting Orbits Foundation. Empowering student pathways.
          </div>
        </div>
      </body>
    </html>
  `;

  const mailOptions = {
    from: fromAddress,
    to: toEmail,
    subject: `${otpCode} is your Shifting Orbits verification code`,
    text: `Your Shifting Orbits Foundation verification code is: ${otpCode}. It expires in 10 minutes.`,
    html: htmlContent
  };

  try {
    const info = await mailer.sendMail(mailOptions);
    logger.info(`[Email] OTP sent to ${toEmail}. MessageId: ${info.messageId}`);
    
    // Log in console for quick developer convenience
    console.log('\n=============================================================');
    console.log(`✉️  EMAIL OTP DISPATCHED TO: ${toEmail}`);
    console.log(`🔑  VERIFICATION CODE:       ${otpCode}`);
    console.log('=============================================================\n');

    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;
    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    logger.error(`[Email Error] Failed to send email to ${toEmail}:`, error);
    console.log('\n=============================================================');
    console.log(`⚠️  FALLBACK LOCAL OTP FOR: ${toEmail}`);
    console.log(`🔑  VERIFICATION CODE:     ${otpCode}`);
    console.log('=============================================================\n');
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendOtpEmail
};
