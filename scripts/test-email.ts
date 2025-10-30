import { EmailService } from '../src/modules/email/email.service';
import { emailConfig } from '../src/config/email.config';
import * as dotenv from 'dotenv';
import { Logger } from '@nestjs/common';

// Load environment variables
dotenv.config();

const logger = new Logger('EmailTest');

async function testEmail() {
  // Log the configuration being used
  logger.log('Email Configuration:');
  logger.log(`- SMTP Server: ${emailConfig.smtp.host}:${emailConfig.smtp.port}`);
  logger.log(`- Secure: ${emailConfig.smtp.secure}`);
  logger.log(`- Auth: ${emailConfig.smtp.auth.user ? 'Configured' : 'Not Configured'}`);
  logger.log(`- From: ${emailConfig.from}`);
  logger.log(`- Enabled: ${emailConfig.enabled ? 'Yes' : 'No'}`);

  if (!emailConfig.enabled) {
    logger.error('Email is disabled in configuration. Check your .env file.');
    return;
  }

  const emailService = new EmailService();
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';
  
  try {
    logger.log(`\nSending test email to: ${testEmail}`);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const result = await emailService.sendOtpEmail(testEmail, otp);
    
    if (result) {
      logger.log('✅ Email sent successfully!');
      logger.log(`📧 Check your inbox for OTP: ${otp}`);
    } else {
      logger.error('❌ Failed to send email. Check the logs above for errors.');
    }
  } catch (error) {
    logger.error('❌ Error sending test email:', error);
  }
}

testEmail().catch(console.error);
