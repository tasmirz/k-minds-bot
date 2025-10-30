export const emailConfig = {
  from: process.env.EMAIL_FROM || 'noreply@kminds.com',

  smtp: {
    host: process.env.SMTP_SERVER || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '9a0a74001@smtp-brevo.com',
      pass: process.env.SMTP_PASSWORD || '',
    },
  },

  templates: {
    otp: {
      subject: 'Your Verification Code',
    },
  },

  enabled: process.env.EMAIL_ENABLED !== 'false',
}
