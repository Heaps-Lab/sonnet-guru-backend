/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const mailConfig: any = {
      host: this.configService.get<string>('MAIL_HOST'),
      port: this.configService.get<number>('MAIL_PORT'),
      secure: this.configService.get<boolean>('MAIL_SECURE') === true,
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2',
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    };

    this.logger.log('Email configuration loaded:');
    this.logger.log(`Host: ${mailConfig.host}`);
    this.logger.log(`Port: ${mailConfig.port}`);
    this.logger.log(`User: ${mailConfig.auth.user}`);
    this.logger.log(`Secure: ${mailConfig.secure}`);

    this.transporter = nodemailer.createTransport(mailConfig);

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        this.logger.error(
          '❌ Email transporter verification failed:',
          error.message,
        );
      } else {
        this.logger.log('✅ Email server is ready to send messages');
      }
    });
  }

  async sendVerificationEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL')}/verify-email?token=${token}`;
    const appName =
      this.configService.get<string>('APP_NAME') || 'Sonnet Guru LMS';

    this.logger.log(`Preparing to send verification email to: ${email}`);
    this.logger.log(`Verification URL: ${verificationUrl}`);

    const mailOptions = {
      from: `"${appName}" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: email,
      subject: `Verify your email - ${appName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #4F46E5;
              margin: 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 8px;
            }
            .button {
              display: inline-block;
              padding: 14px 30px;
              background-color: #4F46E5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background-color: #4338CA;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .token-box {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              word-break: break-all;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <p>Welcome aboard! 🎉</p>
            </div>
            
            <div class="content">
              <h2>Hi ${name},</h2>
              
              <p>Thank you for registering with ${appName}! To complete your registration and start learning, please verify your email address.</p>
              
              <p>Click the button below to verify your email:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <div class="token-box">${verificationUrl}</div>
              
              <p><strong>Important:</strong> This verification link will expire in 24 hours.</p>
              
              <p>If you didn't create an account with ${appName}, please ignore this email.</p>
              
              <p>Best regards,<br>The ${appName} Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      this.logger.log(
        `Sending email from: ${mailOptions.from} to: ${mailOptions.to}`,
      );
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`✅ Verification email sent successfully to ${email}`);
      this.logger.log(`Message ID: ${info.messageId}`);
      this.logger.log(`Response: ${info.response}`);
    } catch (error) {
      this.logger.error(`❌ Failed to send verification email to ${email}`);
      this.logger.error(`Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    name: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL')}/reset-password?token=${token}`;
    const appName =
      this.configService.get<string>('APP_NAME') || 'Sonnet Guru LMS';

    const mailOptions = {
      from: `"${appName}" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: email,
      subject: `Reset Your Password - ${appName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #DC2626;
              margin: 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 8px;
            }
            .button {
              display: inline-block;
              padding: 14px 30px;
              background-color: #DC2626;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background-color: #B91C1C;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .token-box {
              background-color: #f3f4f6;
              padding: 15px;
              border-radius: 5px;
              margin: 20px 0;
              word-break: break-all;
              font-family: monospace;
            }
            .warning {
              background-color: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 15px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <p>🔐 Password Reset Request</p>
            </div>
            
            <div class="content">
              <h2>Hi ${name},</h2>
              
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <div class="token-box">${resetUrl}</div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul style="margin: 10px 0;">
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your password won't change until you create a new one</li>
                </ul>
              </div>
              
              <p>Best regards,<br>The ${appName} Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated email. Please do not reply to this message.</p>
              <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
      throw error;
    }
  }

  async sendTeacherApplicationNotification(
    adminEmail: string,
    application: any,
    cvBuffer: Buffer,
    cvFileName: string,
  ): Promise<void> {
    const appName =
      this.configService.get<string>('APP_NAME') || 'Sonnet Guru LMS';
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    const mailOptions = {
      from: `"${appName}" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: adminEmail,
      subject: `New Teacher Application - ${application.fullName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Teacher Application</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 700px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #4F46E5;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #4F46E5;
              margin: 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 8px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 20px 0;
            }
            .info-item {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              border-left: 4px solid #4F46E5;
            }
            .info-label {
              font-weight: bold;
              color: #4F46E5;
              display: block;
              margin-bottom: 5px;
            }
            .info-value {
              color: #333;
            }
            .full-width {
              grid-column: 1 / -1;
            }
            .button {
              display: inline-block;
              padding: 14px 30px;
              background-color: #4F46E5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 5px;
              font-weight: bold;
            }
            .button.approve {
              background-color: #10B981;
            }
            .button.reject {
              background-color: #EF4444;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
            .attachment-note {
              background-color: #FEF3C7;
              border-left: 4px solid #F59E0B;
              padding: 15px;
              margin: 20px 0;
              border-radius: 5px;
            }
            @media (max-width: 600px) {
              .info-grid {
                grid-template-columns: 1fr;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <p>📚 New Teacher Application Received</p>
            </div>
            
            <div class="content">
              <h2>New Teacher Application Submission</h2>
              
              <p>A new teacher application has been submitted and requires your review.</p>
              
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">👤 Full Name:</span>
                  <span class="info-value">${application.fullName}</span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">📧 Email:</span>
                  <span class="info-value">${application.email}</span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">📱 Phone:</span>
                  <span class="info-value">${application.phoneNumber}</span>
                </div>
                
                <div class="info-item">
                  <span class="info-label">📅 Applied:</span>
                  <span class="info-value">${new Date(application.createdAt).toLocaleDateString()}</span>
                </div>
                
                <div class="info-item full-width">
                  <span class="info-label">🎓 Qualifications:</span>
                  <span class="info-value">${application.qualifications}</span>
                </div>
                
                <div class="info-item full-width">
                  <span class="info-label">💼 Experience:</span>
                  <span class="info-value">${application.experience}</span>
                </div>
                
                <div class="info-item full-width">
                  <span class="info-label">📚 Subjects to Teach:</span>
                  <span class="info-value">${application.subjectsToTeach}</span>
                </div>
                
                ${
                  application.additionalInfo
                    ? `
                <div class="info-item full-width">
                  <span class="info-label">ℹ️ Additional Information:</span>
                  <span class="info-value">${application.additionalInfo}</span>
                </div>
                `
                    : ''
                }
              </div>
              
              <div class="attachment-note">
                <strong>📎 Attachment:</strong> The applicant's CV is attached to this email as <strong>${cvFileName}</strong>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <p><strong>Review this application in your admin panel:</strong></p>
                <a href="${frontendUrl}/admin/teacher-applications/${application.id}" class="button">
                  📋 Review Application
                </a>
                <a href="${frontendUrl}/admin/teacher-applications/${application.id}?action=approve" class="button approve">
                  ✅ Quick Approve
                </a>
                <a href="${frontendUrl}/admin/teacher-applications/${application.id}?action=reject" class="button reject">
                  ❌ Quick Reject
                </a>
              </div>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              
              <p><strong>Application Details:</strong></p>
              <ul>
                <li><strong>Application ID:</strong> ${application.id}</li>
                <li><strong>Status:</strong> Pending Review</li>
                <li><strong>CV File Size:</strong> ${(application.cvFileSize / 1024).toFixed(1)} KB</li>
                <li><strong>Submitted:</strong> ${new Date(application.createdAt).toLocaleString()}</li>
              </ul>
              
              <p style="color: #666; font-size: 14px;">
                <strong>Next Steps:</strong><br>
                1. Review the attached CV<br>
                2. Evaluate the application details<br>
                3. Approve or reject the application<br>
                4. The applicant will be notified of your decision
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated notification from ${appName}</p>
              <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: cvFileName,
          content: cvBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `✅ Teacher application notification sent to ${adminEmail}`,
      );
      this.logger.log(`Message ID: ${info.messageId}`);
      this.logger.log(
        `CV attached: ${cvFileName} (${application.cvFileSize} bytes)`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to send teacher application notification to ${adminEmail}`,
      );
      this.logger.error(`Error details: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const appName =
      this.configService.get<string>('APP_NAME') || 'Sonnet Guru LMS';
    const dashboardUrl = `${this.configService.get<string>('FRONTEND_URL')}/dashboard`;

    const mailOptions = {
      from: `"${appName}" <${this.configService.get<string>('MAIL_FROM')}>`,
      to: email,
      subject: `Welcome to ${appName}! 🎓`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ${appName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9f9f9;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #10B981;
              margin: 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 8px;
            }
            .button {
              display: inline-block;
              padding: 14px 30px;
              background-color: #10B981;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
              font-weight: bold;
            }
            .features {
              background-color: #F0FDF4;
              padding: 20px;
              border-radius: 5px;
              margin: 20px 0;
            }
            .features ul {
              margin: 10px 0;
              padding-left: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${appName}</h1>
              <p>🎉 Your email is verified!</p>
            </div>
            
            <div class="content">
              <h2>Welcome, ${name}! 🎓</h2>
              
              <p>Congratulations! Your email has been successfully verified and your account is now active.</p>
              
              <div class="features">
                <strong>What's next?</strong>
                <ul>
                  <li>📚 Browse our extensive course catalog</li>
                  <li>🎯 Enroll in courses that interest you</li>
                  <li>📹 Start learning with high-quality video content</li>
                  <li>📝 Take quizzes and track your progress</li>
                  <li>🏆 Earn certificates upon completion</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
              </div>
              
              <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
              
              <p>Happy learning!<br>The ${appName} Team</p>
            </div>
            
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Welcome email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send welcome email to ${email}`, error);
      throw error;
    }
  }
}
