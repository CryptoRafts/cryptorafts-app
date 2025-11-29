import nodemailer from 'nodemailer';
import { getFromAddress, getFromName, smtpConfig } from '@/config/email-aliases.config';

// Email configuration interface
interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email template interface
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// User data interface for email content
interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  jobTitle?: string;
}

// Email subscriber interface
interface EmailSubscriber {
  email: string;
  name?: string;
}

// Email options interface
interface EmailOptions {
  from?: string;
  fromName?: string;
  replyTo?: string;
  alias?: string; // Use predefined alias (business, support, help, etc.)
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig;

  constructor() {
    // Use SMTP config from aliases config (supports all aliases)
    this.config = {
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: smtpConfig.auth,
    };
  }

  // Get logo URL for emails
  private getLogoUrl(): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com';
    return `${baseUrl}/logo.png`;
  }

  // Get logo HTML for email templates
  private getLogoHtml(): string {
    const logoUrl = this.getLogoUrl();
    return `
      <div style="margin-bottom: 20px;">
        <img src="${logoUrl}" alt="CryptoRafts Logo" style="max-width: 180px; height: auto; display: block; margin: 0 auto;" />
      </div>
    `;
  }

  // Initialize the email transporter - REAL-TIME EMAIL SENDING
  private async initializeTransporter(): Promise<void> {
    if (!this.transporter) {
      // Check if email configuration is available
      if (!this.config.auth.user || !this.config.auth.pass) {
        const errorMsg = 'Email configuration missing: EMAIL_USER or EMAIL_PASSWORD not set in environment variables';
        console.error(`❌ ${errorMsg}`);
        console.error('Current config:', {
          host: this.config.host,
          port: this.config.port,
          secure: this.config.secure,
          user: this.config.auth.user || 'NOT SET',
          hasPassword: !!this.config.auth.pass,
        });
        throw new Error(errorMsg);
      }

      console.log('📧 [REAL-TIME] Initializing email transporter...');
      console.log('📧 [REAL-TIME] Email config:', {
        host: this.config.host,
        port: this.config.port,
        secure: this.config.secure,
        user: this.config.auth.user,
        hasPassword: !!this.config.auth.pass,
      });

      this.transporter = nodemailer.createTransport(this.config);
      
      // Verify connection configuration - THIS IS CRITICAL FOR REAL-TIME EMAIL
      try {
        if (this.transporter) {
          console.log('📧 [REAL-TIME] Verifying SMTP connection...');
          await this.transporter.verify();
          console.log('✅ [REAL-TIME] Email service connected and verified successfully');
        }
      } catch (error: any) {
        console.error('❌ [REAL-TIME] Email service connection verification failed:', error);
        console.error('❌ [REAL-TIME] Error details:', {
          message: error.message,
          code: error.code,
          command: error.command,
          response: error.response,
          responseCode: error.responseCode,
        });
        throw new Error(`Failed to connect to email service: ${error.message}`);
      }
    }
  }

  // Send approval email to registered member
  async sendApprovalEmail(userData: UserData, emailType: string = 'approval'): Promise<boolean> {
    try {
      await this.initializeTransporter();
      
      const template = this.getApprovalEmailTemplate(userData);
      const fromAddress = getFromAddress(emailType);
      const fromName = getFromName(emailType);
      
      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: fromAddress,
      };

      const result = await this.transporter!.sendMail(mailOptions);
      console.log(`✅ Approval email sent successfully FROM ${fromAddress}:`, result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send approval email:', error);
      return false;
    }
  }

  // Send registration confirmation email
  async sendRegistrationConfirmation(userData: UserData, emailType: string = 'general'): Promise<boolean> {
    try {
      await this.initializeTransporter();
      
      const template = this.getRegistrationConfirmationTemplate(userData);
      const fromAddress = getFromAddress(emailType);
      const fromName = getFromName(emailType);
      
      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: fromAddress,
      };

      const result = await this.transporter!.sendMail(mailOptions);
      console.log(`✅ Registration confirmation email sent FROM ${fromAddress}:`, result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send registration confirmation:', error);
      return false;
    }
  }

  // Send KYC approval notification
  async sendKYCApprovalNotification(userData: UserData, emailType: string = 'kyc'): Promise<boolean> {
    try {
      await this.initializeTransporter();
      
      const template = this.getKYCApprovalTemplate(userData);
      const fromAddress = getFromAddress(emailType);
      const fromName = getFromName(emailType);
      
      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: fromAddress,
      };

      const result = await this.transporter!.sendMail(mailOptions);
      console.log(`✅ KYC approval notification sent FROM ${fromAddress}:`, result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send KYC approval notification:', error);
      return false;
    }
  }

  // Send KYC rejection notification
  async sendKYCRejectionNotification(userData: UserData, reason?: string, emailType: string = 'support'): Promise<boolean> {
    try {
      await this.initializeTransporter();
      
      const template = this.getKYCRejectionTemplate(userData, reason);
      const fromAddress = getFromAddress(emailType);
      const fromName = getFromName(emailType);
      
      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: fromAddress,
      };

      const result = await this.transporter!.sendMail(mailOptions);
      console.log(`✅ KYC rejection notification sent FROM ${fromAddress}:`, result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send KYC rejection notification:', error);
      return false;
    }
  }

  // Send KYB approval notification
  async sendKYBApprovalNotification(userData: UserData, emailType: string = 'founder'): Promise<boolean> {
    try {
      await this.initializeTransporter();
      
      const template = this.getKYBApprovalTemplate(userData);
      const fromAddress = getFromAddress(emailType);
      const fromName = getFromName(emailType);
      
      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: fromAddress,
      };

      const result = await this.transporter!.sendMail(mailOptions);
      console.log(`✅ KYB approval notification sent FROM ${fromAddress}:`, result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send KYB approval notification:', error);
      return false;
    }
  }

  // Send KYB rejection notification
  async sendKYBRejectionNotification(userData: UserData, reason?: string, emailType: string = 'support'): Promise<boolean> {
    try {
      await this.initializeTransporter();
      
      const template = this.getKYBRejectionTemplate(userData, reason);
      const fromAddress = getFromAddress(emailType);
      const fromName = getFromName(emailType);
      
      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: fromAddress,
      };

      const result = await this.transporter!.sendMail(mailOptions);
      console.log(`✅ KYB rejection notification sent FROM ${fromAddress}:`, result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send KYB rejection notification:', error);
      return false;
    }
  }

  // Send bulk approval emails to multiple users
  async sendBulkApprovalEmails(users: UserData[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const user of users) {
      const result = await this.sendApprovalEmail(user);
      if (result) {
        success++;
      } else {
        failed++;
      }
      
      // Add delay between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { success, failed };
  }

  // Send promotional email to subscribers
  async sendPromotionalEmail(
    subscribers: EmailSubscriber[],
    subject: string,
    title: string,
    message: string,
    buttonText?: string,
    buttonUrl?: string,
    options?: EmailOptions
  ): Promise<{ success: number; failed: number }> {
    try {
      await this.initializeTransporter();
      
      let success = 0;
      let failed = 0;

      for (const subscriber of subscribers) {
        try {
          const template = this.getPromotionalEmailTemplate(
            subscriber,
            title,
            message,
            buttonText,
            buttonUrl
          );

          const fromAddress = getFromAddress('blog');
          const fromName = getFromName('blog');
          
          const mailOptions = {
            from: `"${fromName}" <${fromAddress}>`,
            to: subscriber.email,
            subject,
            html: template.html,
            text: template.text,
            replyTo: fromAddress,
          };

          await this.transporter!.sendMail(mailOptions);
          success++;
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`❌ Failed to send promotional email to ${subscriber.email}:`, error);
          failed++;
        }
      }

      console.log(`✅ Promotional email sent: ${success} success, ${failed} failed`);
      return { success, failed };
    } catch (error) {
      console.error('❌ Error sending promotional emails:', error);
      return { success: 0, failed: subscribers.length };
    }
  }

  // Send welcome email to new subscribers
  async sendWelcomeEmail(subscriber: EmailSubscriber): Promise<boolean> {
    try {
      await this.initializeTransporter();
      
      const template = this.getWelcomeEmailTemplate(subscriber);
      
      const fromAddress = getFromAddress('blog');
      const fromName = getFromName('blog');
      
      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: subscriber.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: fromAddress,
      };

      const result = await this.transporter!.sendMail(mailOptions);
      console.log('✅ Welcome email sent:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send welcome email:', error);
      return false;
    }
  }

  // Email templates
  private getApprovalEmailTemplate(userData: UserData): EmailTemplate {
    const fullName = `${userData.firstName} ${userData.lastName}`;
    const logoHtml = this.getLogoHtml();
    
    return {
      subject: '🎉 Welcome to CryptoRafts - Your Account Has Been Approved!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Account Approved - CryptoRafts</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { margin-bottom: 20px; }
            .logo img { max-width: 180px; height: auto; display: block; margin: 0 auto; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #06b6d4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${logoHtml}
              <h1>🚀 Welcome to CryptoRafts!</h1>
              <p>Your account has been approved</p>
            </div>
            <div class="content">
              <h2>Congratulations ${fullName}!</h2>
              <p>We're excited to inform you that your CryptoRafts account has been successfully approved. You can now access all the features and opportunities available on our platform.</p>
              
              <p><strong>What's next?</strong></p>
              <ul>
                <li>Complete your profile setup</li>
                <li>Explore investment opportunities</li>
                <li>Connect with other founders and investors</li>
                <li>Access our exclusive deal flow</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/founder/dashboard" class="button">
                  Access Your Dashboard
                </a>
              </div>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>The CryptoRafts Team</p>
            </div>
            <div class="footer">
              <p>CryptoRafts - Connecting Founders with Capital</p>
              <p>This email was sent to ${userData.email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to CryptoRafts!
        
        Congratulations ${fullName}!
        
        We're excited to inform you that your CryptoRafts account has been successfully approved. You can now access all the features and opportunities available on our platform.
        
        What's next?
        - Complete your profile setup
        - Explore investment opportunities
        - Connect with other founders and investors
        - Access our exclusive deal flow
        
        Access your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/founder/dashboard
        
        If you have any questions or need assistance, please don't hesitate to contact our support team.
        
        Best regards,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        This email was sent to ${userData.email}
      `
    };
  }

  private getRegistrationConfirmationTemplate(userData: UserData): EmailTemplate {
    const fullName = `${userData.firstName} ${userData.lastName}`;
    const logoHtml = this.getLogoHtml();
    
    return {
      subject: '📝 Registration Confirmed - CryptoRafts',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Confirmed - CryptoRafts</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { margin-bottom: 20px; }
            .logo img { max-width: 180px; height: auto; display: block; margin: 0 auto; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${logoHtml}
              <h1>📝 Registration Confirmed</h1>
              <p>Thank you for joining CryptoRafts</p>
            </div>
            <div class="content">
              <h2>Hello ${fullName}!</h2>
              <p>Thank you for registering with CryptoRafts. We've received your registration and our team will review your application.</p>
              
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Complete your KYC verification</li>
                <li>Wait for account approval</li>
                <li>You'll receive an email once approved</li>
              </ul>
              
              <p>We'll review your application and get back to you within 24-48 hours.</p>
              
              <p>Best regards,<br>The CryptoRafts Team</p>
            </div>
            <div class="footer">
              <p>CryptoRafts - Connecting Founders with Capital</p>
              <p>This email was sent to ${userData.email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Registration Confirmed - CryptoRafts
        
        Hello ${fullName}!
        
        Thank you for registering with CryptoRafts. We've received your registration and our team will review your application.
        
        Next Steps:
        - Complete your KYC verification
        - Wait for account approval
        - You'll receive an email once approved
        
        We'll review your application and get back to you within 24-48 hours.
        
        Best regards,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        This email was sent to ${userData.email}
      `
    };
  }

  private getKYCApprovalTemplate(userData: UserData): EmailTemplate {
    const fullName = `${userData.firstName} ${userData.lastName}`;
    const logoHtml = this.getLogoHtml();
    
    return {
      subject: '✅ KYC Verification Approved - CryptoRafts',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>KYC Approved - CryptoRafts</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { margin-bottom: 20px; }
            .logo img { max-width: 180px; height: auto; display: block; margin: 0 auto; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${logoHtml}
              <h1>✅ KYC Verification Approved</h1>
              <p>Your identity has been verified</p>
            </div>
            <div class="content">
              <h2>Congratulations ${fullName}!</h2>
              <p>Great news! Your KYC (Know Your Customer) verification has been successfully completed and approved.</p>
              
              <p><strong>What this means:</strong></p>
              <ul>
                <li>Your identity has been verified</li>
                <li>You can now access all platform features</li>
                <li>You're ready to start connecting with investors</li>
                <li>Your account is fully activated</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/founder/dashboard" class="button">
                  Access Your Dashboard
                </a>
              </div>
              
              <p>Welcome to the CryptoRafts community!</p>
              
              <p>Best regards,<br>The CryptoRafts Team</p>
            </div>
            <div class="footer">
              <p>CryptoRafts - Connecting Founders with Capital</p>
              <p>This email was sent to ${userData.email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        KYC Verification Approved - CryptoRafts
        
        Congratulations ${fullName}!
        
        Great news! Your KYC (Know Your Customer) verification has been successfully completed and approved.
        
        What this means:
        - Your identity has been verified
        - You can now access all platform features
        - You're ready to start connecting with investors
        - Your account is fully activated
        
        Access your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/founder/dashboard
        
        Welcome to the CryptoRafts community!
        
        Best regards,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        This email was sent to ${userData.email}
      `
    };
  }

  private getKYCRejectionTemplate(userData: UserData, reason?: string): EmailTemplate {
    const fullName = `${userData.firstName} ${userData.lastName}`;
    const logoHtml = this.getLogoHtml();
    
    return {
      subject: '⚠️ KYC Verification Update - Action Required',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>KYC Update - CryptoRafts</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { margin-bottom: 20px; }
            .logo img { max-width: 180px; height: auto; display: block; margin: 0 auto; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${logoHtml}
              <h1>⚠️ KYC Verification Update</h1>
              <p>Additional information required</p>
            </div>
            <div class="content">
              <h2>Hello ${fullName},</h2>
              <p>We've reviewed your KYC (Know Your Customer) verification documents, and we need some additional information to complete the process.</p>
              
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              
              <p><strong>What you need to do:</strong></p>
              <ul>
                <li>Review the feedback above</li>
                <li>Submit updated or corrected documents</li>
                <li>Ensure all documents are clear and valid</li>
                <li>Verify all information is correct</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/founder/kyc" class="button">
                  Resubmit KYC Documents
                </a>
              </div>
              
              <p>If you have any questions, please contact our support team at business@cryptorafts.com</p>
              
              <p>Best regards,<br>The CryptoRafts Team</p>
            </div>
            <div class="footer">
              <p>CryptoRafts - Connecting Founders with Capital</p>
              <p>This email was sent to ${userData.email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        KYC Verification Update - CryptoRafts
        
        Hello ${fullName},
        
        We've reviewed your KYC (Know Your Customer) verification documents, and we need some additional information to complete the process.
        
        ${reason ? `Reason: ${reason}` : ''}
        
        What you need to do:
        - Review the feedback above
        - Submit updated or corrected documents
        - Ensure all documents are clear and valid
        - Verify all information is correct
        
        Resubmit KYC: ${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/founder/kyc
        
        If you have any questions, please contact our support team at business@cryptorafts.com
        
        Best regards,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        This email was sent to ${userData.email}
      `
    };
  }

  private getKYBApprovalTemplate(userData: UserData): EmailTemplate {
    const fullName = `${userData.firstName} ${userData.lastName}`;
    const companyName = userData.company || 'your organization';
    const logoHtml = this.getLogoHtml();
    
    return {
      subject: '✅ KYB Verification Approved - CryptoRafts',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>KYB Approved - CryptoRafts</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { margin-bottom: 20px; }
            .logo img { max-width: 180px; height: auto; display: block; margin: 0 auto; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${logoHtml}
              <h1>✅ KYB Verification Approved</h1>
              <p>Your business has been verified</p>
            </div>
            <div class="content">
              <h2>Congratulations ${fullName}!</h2>
              <p>Great news! Your KYB (Know Your Business) verification for <strong>${companyName}</strong> has been successfully completed and approved.</p>
              
              <p><strong>What this means:</strong></p>
              <ul>
                <li>Your organization has been verified</li>
                <li>You can now access all platform features</li>
                <li>You're ready to list projects and raise funding</li>
                <li>Your business account is fully activated</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/founder/dashboard" class="button">
                  Access Your Dashboard
                </a>
              </div>
              
              <p>Welcome to the CryptoRafts community!</p>
              
              <p>Best regards,<br>The CryptoRafts Team</p>
            </div>
            <div class="footer">
              <p>CryptoRafts - Connecting Founders with Capital</p>
              <p>This email was sent to ${userData.email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        KYB Verification Approved - CryptoRafts
        
        Congratulations ${fullName}!
        
        Great news! Your KYB (Know Your Business) verification for ${companyName} has been successfully completed and approved.
        
        What this means:
        - Your organization has been verified
        - You can now access all platform features
        - You're ready to list projects and raise funding
        - Your business account is fully activated
        
        Access your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/founder/dashboard
        
        Welcome to the CryptoRafts community!
        
        Best regards,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        This email was sent to ${userData.email}
      `
    };
  }

  private getKYBRejectionTemplate(userData: UserData, reason?: string): EmailTemplate {
    const fullName = `${userData.firstName} ${userData.lastName}`;
    const companyName = userData.company || 'your organization';
    const logoHtml = this.getLogoHtml();
    
    return {
      subject: '⚠️ KYB Verification Update - Action Required',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>KYB Update - CryptoRafts</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { margin-bottom: 20px; }
            .logo img { max-width: 180px; height: auto; display: block; margin: 0 auto; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${logoHtml}
              <h1>⚠️ KYB Verification Update</h1>
              <p>Additional information required</p>
            </div>
            <div class="content">
              <h2>Hello ${fullName},</h2>
              <p>We've reviewed your KYB (Know Your Business) verification documents for <strong>${companyName}</strong>, and we need some additional information to complete the process.</p>
              
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
              
              <p><strong>What you need to do:</strong></p>
              <ul>
                <li>Review the feedback above</li>
                <li>Submit updated business documents</li>
                <li>Ensure all documents are clear and valid</li>
                <li>Verify all business information is correct</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/founder/kyb" class="button">
                  Resubmit KYB Documents
                </a>
              </div>
              
              <p>If you have any questions, please contact our support team at business@cryptorafts.com</p>
              
              <p>Best regards,<br>The CryptoRafts Team</p>
            </div>
            <div class="footer">
              <p>CryptoRafts - Connecting Founders with Capital</p>
              <p>This email was sent to ${userData.email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        KYB Verification Update - CryptoRafts
        
        Hello ${fullName},
        
        We've reviewed your KYB (Know Your Business) verification documents for ${companyName}, and we need some additional information to complete the process.
        
        ${reason ? `Reason: ${reason}` : ''}
        
        What you need to do:
        - Review the feedback above
        - Submit updated business documents
        - Ensure all documents are clear and valid
        - Verify all business information is correct
        
        Resubmit KYB: ${process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com'}/founder/kyb
        
        If you have any questions, please contact our support team at business@cryptorafts.com
        
        Best regards,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        This email was sent to ${userData.email}
      `
    };
  }

  private getPromotionalEmailTemplate(
    subscriber: EmailSubscriber,
    title: string,
    message: string,
    buttonText?: string,
    buttonUrl?: string
  ): EmailTemplate {
    const name = subscriber.name || 'Valued Member';
    const logoHtml = this.getLogoHtml();
    
    return {
      subject: title,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { margin-bottom: 20px; }
            .logo img { max-width: 180px; height: auto; display: block; margin: 0 auto; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #06b6d4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${logoHtml}
              <h1>🚀 CryptoRafts</h1>
              <p>Web3 Funding Platform</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              ${message.split('\n').map(p => `<p>${p}</p>`).join('')}
              
              ${buttonText && buttonUrl ? `
                <div style="text-align: center;">
                  <a href="${buttonUrl}" class="button">
                    ${buttonText}
                  </a>
                </div>
              ` : ''}
              
              <p>Best regards,<br>The CryptoRafts Team</p>
            </div>
            <div class="footer">
              <p>CryptoRafts - Connecting Founders with Capital</p>
              <p>This email was sent to ${subscriber.email}</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptorafts.com'}/unsubscribe?email=${subscriber.email}" style="color: #666; text-decoration: none;">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        ${title}
        
        Hello ${name}!
        
        ${message}
        
        ${buttonText && buttonUrl ? `${buttonText}: ${buttonUrl}` : ''}
        
        Best regards,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        This email was sent to ${subscriber.email}
        Unsubscribe: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptorafts.com'}/unsubscribe?email=${subscriber.email}
      `
    };
  }

  // Send verification code email
  async sendVerificationCode(email: string, code: string, emailType: string = 'support'): Promise<boolean> {
    try {
      await this.initializeTransporter();
      
      const template = this.getVerificationCodeTemplate(email, code);
      const fromAddress = getFromAddress(emailType);
      const fromName = getFromName(emailType);
      
      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: fromAddress,
      };
      
      const result = await this.transporter!.sendMail(mailOptions);
      console.log(`✅ Verification code email sent to ${email}:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send verification code email to ${email}:`, error);
      return false;
    }
  }

  private getVerificationCodeTemplate(email: string, code: string): EmailTemplate {
    const logoHtml = this.getLogoHtml();
    
    return {
      subject: '🔐 CryptoRafts Verification Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code - CryptoRafts</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: #ffffff; border: 2px dashed #6366f1; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .code { font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${logoHtml}
              <h1>🔐 Verification Code</h1>
              <p>Your secure access code</p>
            </div>
            <div class="content">
              <h2>Hello!</h2>
              <p>You've requested a verification code for your CryptoRafts account.</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your verification code is:</p>
                <div class="code">${code}</div>
              </div>
              
              <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>This code will expire in <strong>10 minutes</strong></li>
                  <li>Never share this code with anyone</li>
                  <li>If you didn't request this code, please ignore this email</li>
                </ul>
              </div>
              
              <p>Enter this code in the verification field to complete your login or action.</p>
              
              <p>If you have any questions or concerns, please contact our support team at <a href="mailto:support@cryptorafts.com">support@cryptorafts.com</a></p>
              
              <p>Best regards,<br>The CryptoRafts Team</p>
            </div>
            <div class="footer">
              <p>CryptoRafts - Connecting Founders with Capital</p>
              <p>This email was sent to ${email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        CryptoRafts Verification Code
        
        Hello!
        
        You've requested a verification code for your CryptoRafts account.
        
        Your verification code is: ${code}
        
        ⚠️ Important:
        - This code will expire in 10 minutes
        - Never share this code with anyone
        - If you didn't request this code, please ignore this email
        
        Enter this code in the verification field to complete your login or action.
        
        If you have any questions or concerns, please contact our support team at support@cryptorafts.com
        
        Best regards,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        This email was sent to ${email}
      `
    };
  }

  private getWelcomeEmailTemplate(subscriber: EmailSubscriber): EmailTemplate {
    const name = subscriber.name || 'Friend';
    const logoHtml = this.getLogoHtml();
    
    return {
      subject: '🎉 Welcome to CryptoRafts - Exciting Updates Ahead!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to CryptoRafts</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .logo { margin-bottom: 20px; }
            .logo img { max-width: 180px; height: auto; display: block; margin: 0 auto; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #06b6d4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${logoHtml}
              <h1>🎉 Welcome to CryptoRafts!</h1>
              <p>Thank you for joining our community</p>
            </div>
            <div class="content">
              <h2>Hello ${name}!</h2>
              <p>Thank you for subscribing to CryptoRafts updates! We're excited to have you as part of our growing community of founders, investors, and innovators.</p>
              
              <p><strong>What to expect:</strong></p>
              <ul>
                <li>📊 Weekly market insights and crypto trends</li>
                <li>🚀 Platform updates and new features</li>
                <li>💰 Investment opportunities and deal flows</li>
                <li>📈 Success stories from our community</li>
                <li>🎯 Exclusive events and webinars</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptorafts.com'}" class="button">
                  Explore CryptoRafts
                </a>
              </div>
              
              <p>Ready to get started? Create your account and join thousands of verified members in the Web3 ecosystem!</p>
              
              <p>Best regards,<br>The CryptoRafts Team</p>
            </div>
            <div class="footer">
              <p>CryptoRafts - Connecting Founders with Capital</p>
              <p>This email was sent to ${subscriber.email}</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptorafts.com'}/unsubscribe?email=${subscriber.email}" style="color: #666; text-decoration: none;">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to CryptoRafts!
        
        Hello ${name}!
        
        Thank you for subscribing to CryptoRafts updates! We're excited to have you as part of our growing community.
        
        What to expect:
        - Weekly market insights and crypto trends
        - Platform updates and new features
        - Investment opportunities and deal flows
        - Success stories from our community
        - Exclusive events and webinars
        
        Explore CryptoRafts: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptorafts.com'}
        
        Ready to get started? Create your account and join thousands of verified members in the Web3 ecosystem!
        
        Best regards,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        This email was sent to ${subscriber.email}
        Unsubscribe: ${process.env.NEXT_PUBLIC_APP_URL || 'https://www.cryptorafts.com'}/unsubscribe?email=${subscriber.email}
      `
    };
  }

  // Send team invitation email
  async sendTeamInvitation(invitationData: {
    email: string;
    fullName: string;
    inviterName: string;
    inviterEmail: string;
    teamType: string;
    role: string;
    invitationLink: string;
  }): Promise<boolean> {
    try {
      console.log(`📧 Attempting to send team invitation email to ${invitationData.email}...`);
      console.log(`📧 Invitation link: ${invitationData.invitationLink}`);
      
      await this.initializeTransporter();
      
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }
      
      const template = this.getTeamInvitationTemplate(invitationData);
      const fromAddress = getFromAddress('business');
      const fromName = getFromName('business');
      
      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: invitationData.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: fromAddress,
      };
      
      console.log(`📧 [REAL-TIME] Sending email from ${fromAddress} to ${invitationData.email}...`);
      console.log(`📧 [REAL-TIME] Email subject: ${template.subject}`);
      
      // Send email synchronously - THIS IS REAL-TIME, NOT QUEUED
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log(`✅ [REAL-TIME] Team invitation email sent successfully to ${invitationData.email}`);
      console.log(`✅ [REAL-TIME] Email response:`, {
        messageId: result.messageId,
        accepted: result.accepted,
        rejected: result.rejected,
        response: result.response,
        responseCode: result.responseCode,
      });
      
      // Verify email was actually accepted
      if (result.accepted && result.accepted.length > 0) {
        console.log(`✅ [REAL-TIME] Email accepted by server for: ${result.accepted.join(', ')}`);
        return true;
      } else if (result.rejected && result.rejected.length > 0) {
        console.error(`❌ [REAL-TIME] Email rejected by server for: ${result.rejected.join(', ')}`);
        return false;
      } else {
        // If we have a messageId, assume it was sent
        if (result.messageId) {
          console.log(`✅ [REAL-TIME] Email has messageId, assuming sent: ${result.messageId}`);
          return true;
        }
        return false;
      }
    } catch (error: any) {
      console.error(`❌ Failed to send team invitation email to ${invitationData.email}:`, error);
      console.error(`❌ Error details:`, {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        responseCode: error.responseCode,
      });
      return false;
    }
  }

  private getTeamInvitationTemplate(invitationData: {
    email: string;
    fullName: string;
    inviterName: string;
    inviterEmail: string;
    teamType: string;
    role: string;
    invitationLink: string;
  }): EmailTemplate {
    const logoHtml = this.getLogoHtml();
    const teamTypeName = invitationData.teamType.toUpperCase();
    const roleName = invitationData.role.charAt(0).toUpperCase() + invitationData.role.slice(1);
    
    return {
      subject: `🎉 You've been invited to join a ${teamTypeName} team on CryptoRafts`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team Invitation - CryptoRafts</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
            .button:hover { background: #4f46e5; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .info-box { background: #e0e7ff; border-left: 4px solid #6366f1; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .role-badge { display: inline-block; background: #6366f1; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-left: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${logoHtml}
              <h1>🎉 Team Invitation</h1>
              <p>You've been invited to join CryptoRafts</p>
            </div>
            <div class="content">
              <h2>Hello ${invitationData.fullName}!</h2>
              <p><strong>${invitationData.inviterName}</strong> (${invitationData.inviterEmail}) has invited you to join their <strong>${teamTypeName}</strong> team on CryptoRafts.</p>
              
              <div class="info-box">
                <p style="margin: 0;"><strong>Your Role:</strong> <span class="role-badge">${roleName}</span></p>
                <p style="margin: 8px 0 0 0;"><strong>Team Type:</strong> ${teamTypeName}</p>
              </div>
              
              <p>To accept this invitation and join the team:</p>
              <ol>
                <li>Click the button below to open the invitation link</li>
                <li>Sign in with your Google account (using <strong>${invitationData.email}</strong>)</li>
                <li>Complete your profile setup</li>
                <li>You'll automatically be added to the team with the assigned role</li>
              </ol>
              
              <div style="text-align: center;">
                <a href="${invitationData.invitationLink}" class="button">
                  Accept Invitation & Join Team
                </a>
              </div>
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <strong>Important:</strong>
              </p>
              <ul>
                <li>This invitation link will expire in 7 days</li>
                <li>You must sign in with the email address: <strong>${invitationData.email}</strong></li>
                <li>If you don't have a CryptoRafts account, one will be created for you automatically</li>
                <li>If you didn't expect this invitation, you can safely ignore this email</li>
              </ul>
              
              <p>If you have any questions, please contact our support team at <a href="mailto:support@cryptorafts.com">support@cryptorafts.com</a></p>
              
              <p>Best regards,<br>The CryptoRafts Team</p>
            </div>
            <div class="footer">
              <p>CryptoRafts - Connecting Founders with Capital</p>
              <p>This email was sent to ${invitationData.email}</p>
              <p style="margin-top: 10px; font-size: 12px; color: #999;">
                If you're having trouble with the button, copy and paste this link into your browser:<br>
                <a href="${invitationData.invitationLink}" style="color: #6366f1; word-break: break-all;">${invitationData.invitationLink}</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Team Invitation - CryptoRafts
        
        Hello ${invitationData.fullName}!
        
        ${invitationData.inviterName} (${invitationData.inviterEmail}) has invited you to join their ${teamTypeName} team on CryptoRafts.
        
        Your Role: ${roleName}
        Team Type: ${teamTypeName}
        
        To accept this invitation and join the team:
        1. Click the link below to open the invitation
        2. Sign in with your Google account (using ${invitationData.email})
        3. Complete your profile setup
        4. You'll automatically be added to the team with the assigned role
        
        Accept Invitation: ${invitationData.invitationLink}
        
        Important:
        - This invitation link will expire in 7 days
        - You must sign in with the email address: ${invitationData.email}
        - If you don't have a CryptoRafts account, one will be created for you automatically
        - If you didn't expect this invitation, you can safely ignore this email
        
        If you have any questions, please contact our support team at support@cryptorafts.com
        
        Best regards,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        This email was sent to ${invitationData.email}
      `
    };
  }

  // Send blog update notification email
  async sendBlogUpdateNotification(blogData: {
    title: string;
    slug: string;
    author: string;
    category: string;
    excerpt?: string;
    status: 'published' | 'draft' | 'scheduled';
    subscribers?: string[];
  }): Promise<boolean> {
    try {
      await this.initializeTransporter();
      
      const template = this.getBlogUpdateTemplate(blogData);
      const fromAddress = getFromAddress('blog');
      const fromName = getFromName('blog');
      
      // If subscribers provided, send to all; otherwise this is for admin notification
      const recipients = blogData.subscribers && blogData.subscribers.length > 0 
        ? blogData.subscribers 
        : [process.env.ADMIN_EMAIL || 'admin@cryptorafts.com'];
      
      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: recipients.join(','),
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: fromAddress,
      };
      
      const result = await this.transporter!.sendMail(mailOptions);
      console.log(`✅ Blog update notification sent:`, result.messageId);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send blog update notification:`, error);
      return false;
    }
  }

  private getBlogUpdateTemplate(blogData: {
    title: string;
    slug: string;
    author: string;
    category: string;
    excerpt?: string;
    status: string;
  }): EmailTemplate {
    const logoHtml = this.getLogoHtml();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptorafts.com';
    const blogUrl = `${baseUrl}/blog/${blogData.slug}`;
    const isPublished = blogData.status === 'published';
    
    return {
      subject: isPublished 
        ? `📝 New Blog Post: ${blogData.title}` 
        : `📝 Blog Post ${blogData.status === 'scheduled' ? 'Scheduled' : 'Updated'}: ${blogData.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Blog Update - CryptoRafts</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
            .button:hover { background: #4f46e5; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            .blog-card { background: white; border-left: 4px solid #6366f1; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .category-badge { display: inline-block; background: #e0e7ff; color: #6366f1; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              ${logoHtml}
              <h1>${isPublished ? '📝 New Blog Post' : '📝 Blog Post Updated'}</h1>
              <p>${isPublished ? 'A new article has been published' : 'A blog post has been updated'}</p>
            </div>
            <div class="content">
              <div class="blog-card">
                <h2 style="margin: 0 0 10px 0; color: #1f2937;">${blogData.title}</h2>
                <p style="margin: 0 0 15px 0;">
                  <span class="category-badge">${blogData.category}</span>
                  <span style="color: #6b7280; margin-left: 10px;">by ${blogData.author}</span>
                </p>
                ${blogData.excerpt ? `<p style="color: #4b5563; margin: 15px 0;">${blogData.excerpt}</p>` : ''}
              </div>
              
              ${isPublished ? `
                <p>We're excited to share our latest blog post with you!</p>
                <div style="text-align: center;">
                  <a href="${blogUrl}" class="button">Read Full Article</a>
                </div>
              ` : `
                <p>The blog post has been ${blogData.status === 'scheduled' ? 'scheduled for later publication' : 'updated'}.</p>
                ${blogData.status === 'scheduled' ? `
                  <p style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
                    <strong>Status:</strong> Scheduled for publication
                  </p>
                ` : ''}
              `}
              
              <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Stay tuned for more insights, updates, and stories from the CryptoRafts community!
              </p>
              
              <p>Best regards,<br>The CryptoRafts Team</p>
            </div>
            <div class="footer">
              <p>CryptoRafts - Connecting Founders with Capital</p>
              <p><a href="${baseUrl}/blog" style="color: #6366f1; text-decoration: none;">View All Blog Posts</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        ${isPublished ? 'New Blog Post' : 'Blog Post Updated'} - CryptoRafts
        
        ${blogData.title}
        
        Category: ${blogData.category}
        Author: ${blogData.author}
        
        ${blogData.excerpt ? `\n${blogData.excerpt}\n` : ''}
        
        ${isPublished ? `Read the full article: ${blogUrl}` : `Status: ${blogData.status}`}
        
        Stay tuned for more insights, updates, and stories from the CryptoRafts community!
        
        Best regards,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        View all blog posts: ${baseUrl}/blog
      `
    };
  }
}

// Export singleton instance
export const emailService = new EmailService();
export default emailService;
