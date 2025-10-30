export const emailConfig = {
  from: process.env.EMAIL_FROM || 'noreply@kminds',

  smtp: {
    host: process.env.SMTP_SERVER,
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    secure: true,
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
console.log(emailConfig.smtp.auth.pass)
// emailConfig.smtp.auth.pass has "" at start and end; trim them
if (emailConfig.smtp.auth.pass) {
  emailConfig.smtp.auth.pass = emailConfig.smtp.auth.pass.replace(/^"+|"+$/g, '')
}
console.log(emailConfig.smtp.auth.pass)
