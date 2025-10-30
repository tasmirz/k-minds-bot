export const emailConfig = {
  from: process.env.EMAIL_FROM || 'noreply@kminds',

  smtp: {
    host: process.env.SMTP_SERVER,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
},

  templates: {
    otp: {
      subject: 'Your Verification Code',
    },
  },

  enabled: process.env.EMAIL_ENABLED !== 'false',
}

if (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "test") {
  emailConfig.smtp.host = process.env.SMTP_SERVER_DEV;
  emailConfig.smtp.port = parseInt(process.env.SMTP_PORT_DEV || '587', 10);
  emailConfig.smtp.auth.user = process.env.SMTP_USER_DEV;
  emailConfig.smtp.auth.pass = process.env.SMTP_PASSWORD_DEV;
}