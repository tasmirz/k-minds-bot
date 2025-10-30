import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { createTransport } from 'nodemailer';
import { emailConfig } from '../../config/email.config';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    if (emailConfig.enabled) {
      this.initializeTransporter();
    } else {
      this.logger.warn('Email service is disabled. No emails will be sent.');
    }
  }

  private initializeTransporter() {
    // Check if we have required SMTP credentials
    const { host, port, secure, auth } = emailConfig.smtp;
    
    // Debug log the configuration being used
    this.logger.debug('SMTP Configuration:', {
      host,
      port,
      secure,
      hasAuth: !!(auth?.user && auth?.pass),
      emailEnabled: emailConfig.enabled
    });
    
    if (!auth.user || !auth.pass) {
      this.logger.warn('SMTP credentials not provided. Email sending will be disabled.');
      emailConfig.enabled = false;
      return;
    }

    const smtpConfig = {
      host,
      port,
      secure,
      auth: {
        user: auth.user,
        pass: auth.pass,
      },
      // Skip certificate validation for self-signed certs
      tls: {
        rejectUnauthorized: false,
      },
    };

    this.transporter = createTransport(smtpConfig);

    // Verify connection configuration
    this.transporter.verify((error) => {
      if (error) {
        this.logger.error('Error with SMTP configuration:', error.message);
        this.logger.warn('Email sending will be disabled due to configuration error');
        emailConfig.enabled = false;
      } else {
        this.logger.log(`SMTP server connected to ${host}:${port}`);
      }
    });
  }

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    if (!emailConfig.enabled) {
      this.logger.warn(`Email service is disabled. Cannot send OTP to ${to}`);
      return false;
    }

    if (!this.transporter) {
      this.logger.error('SMTP transporter not initialized');
      return false;
    }

    const subject = emailConfig.templates.otp.subject;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>K-MINDS Authentication</h2>
        <p>Your verification code is:</p>
        <div style="
          background: #f4f4f4;
          padding: 15px;
          font-size: 24px;
          letter-spacing: 5px;
          text-align: center;
          margin: 20px 0;
          font-weight: bold;
          border-radius: 4px;
        ">
          ${otp}
        </div>
        <p>This code will expire in 15 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #777;">
          This is an automated message, please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error('Email transporter not initialized');
      return false;
    }
    
    const from = emailConfig.from;
    
    try {
      await this.transporter.sendMail({
        from: `"KUET Auth" <${from}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, ''), // Fallback text version
      });
      
      this.logger.log(`Email sent to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send email:', error);
      return false;
    }
  }
}
