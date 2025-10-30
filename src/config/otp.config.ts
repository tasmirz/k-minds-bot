export const otpConfig = {
  expiresIn: parseInt(process.env.OTP_EXPIRES_IN || '10', 10) * 60 * 1000,

  cooldown: parseInt(process.env.OTP_COOLDOWN || '120', 10),

  length: 6,

  charset: '0123456789',

  maxAttempts: 3,
}
