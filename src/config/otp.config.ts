export const otpConfig = {
  // expiresIn is in seconds (default 600 = 10 minutes)
  expiresIn: parseInt(process.env.OTP_EXPIRES_IN || '600', 10),
  // cooldown is in seconds (default 120 = 2 minutes)
  cooldown: parseInt(process.env.OTP_COOLDOWN || '120', 10),
  length: 6,
  charset: '0123456789',
  maxAttempts: 3,
}
