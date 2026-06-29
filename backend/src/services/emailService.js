const nodemailer = require('nodemailer');

// Create transporter dynamically using env variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000
});

/**
 * Sends a verification OTP email to the user
 * 
 * @param {string} toEmail - The recipient's email address
 * @param {string} otpCode - The 6-digit verification code
 * @returns {Promise<boolean>}
 */
async function sendOtpEmail(toEmail, otpCode) {
  // If SMTP is not configured, we do not attempt to send real email, just log it.
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EMAIL-SERVICE] [MOCK/DEV] Real email NOT sent (SMTP env vars missing). OTP for ${toEmail}: ${otpCode}`);
    return false;
  }

  const fromEmail = process.env.SMTP_FROM || 'Word Power <no-reply@resend.dev>';
  
  const mailOptions = {
    from: fromEmail,
    to: toEmail,
    subject: 'Word Power Verification Code 🔑',
    text: `Welcome to Word Power! Your 6-digit verification code is: ${otpCode}. It will expire in 3 minutes.`,
    html: `
      <div style="background-color: #0F1117; color: #EDE8DC; padding: 32px; font-family: sans-serif; border: 1px solid #C9A24B; border-radius: 8px; max-width: 500px; margin: 0 auto;">
        <h2 style="color: #C9A24B; border-bottom: 1px solid rgba(201, 162, 75, 0.3); padding-bottom: 10px; margin-top: 0; font-family: serif;">
          Word Power App
        </h2>
        <p style="font-size: 15px; color: #B8B0A2;">
          Welcome to your vocabulary scholarship journey! Use the 6-digit OTP code below to verify your account:
        </p>
        <div style="background-color: rgba(20, 24, 38, 0.8); border: 1px solid rgba(201, 162, 75, 0.2); padding: 16px; text-align: center; border-radius: 4px; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #C9A24B;">
            ${otpCode}
          </span>
        </div>
        <p style="font-size: 13px; color: #80776A;">
          This code expires in 3 minutes. If you did not request this, please ignore this email.
        </p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EMAIL-SERVICE] Email sent successfully to ${toEmail}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL-SERVICE] Failed to send email to ${toEmail}:`, err);
    throw err;
  }
}

module.exports = {
  sendOtpEmail
};
