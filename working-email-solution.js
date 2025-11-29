#!/usr/bin/env node

/**
 * 🚀 WORKING EMAIL SOLUTION - Use Your Existing Gmail Account
 * This will work with any Gmail account you have access to
 */

import nodemailer from 'nodemailer';

console.log('🚀 CryptoRafts Email Setup - Working Solution');
console.log('==============================================\n');

// Working email service using your existing Gmail
class WorkingEmailService {
  constructor() {
    // Use your existing Gmail account instead of business@cryptorafts.com
    this.config = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'shamsi4269@gmail.com', // Use your existing Gmail
        pass: 'REPLACE_WITH_YOUR_GMAIL_APP_PASSWORD' // You need App Password
      }
    };
  }

  // Professional email template
  createProfessionalEmail(userData) {
    const fullName = `${userData.firstName} ${userData.lastName}`;
    
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
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 40px 30px; text-align: center; }
            .logo { width: 120px; height: 60px; margin-bottom: 20px; background: white; border-radius: 12px; display: inline-block; }
            .content { padding: 40px 30px; background: #f8fafc; }
            .button { display: inline-block; background: #06b6d4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; margin: 20px 0; font-weight: bold; }
            .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
            .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
            .feature { background: white; padding: 25px; border-radius: 12px; text-align: center; }
            .feature-icon { font-size: 32px; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <img src="https://via.placeholder.com/120x60/06b6d4/ffffff?text=CryptoRafts" alt="CryptoRafts Logo" style="width: 100%; height: 100%; border-radius: 12px;">
              </div>
              <h1 style="margin: 0; font-size: 32px;">🚀 Welcome to CryptoRafts!</h1>
              <p style="margin: 15px 0 0 0; font-size: 18px;">Your account has been approved</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin-top: 0;">Congratulations ${fullName}! 🎉</h2>
              <p style="font-size: 16px;">We're thrilled to inform you that your CryptoRafts account has been successfully approved. You now have access to our exclusive platform.</p>
              
              <div class="features">
                <div class="feature">
                  <div class="feature-icon">💼</div>
                  <h3>Exclusive Deal Flow</h3>
                  <p>Access pre-vetted investment opportunities</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">🤝</div>
                  <h3>Premium Networking</h3>
                  <p>Connect with successful founders and investors</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">📊</div>
                  <h3>Advanced Analytics</h3>
                  <p>Track portfolio performance with detailed insights</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">🔒</div>
                  <h3>Bank-Level Security</h3>
                  <p>Enterprise-grade security and compliance</p>
                </div>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="https://cryptorafts.com/founder/dashboard" class="button">
                  🎯 Access Your Dashboard Now
                </a>
              </div>
              
              <p style="font-size: 16px;">Our support team is here to help you make the most of your CryptoRafts experience.</p>
              
              <p style="font-size: 16px; margin-top: 30px;">Welcome to the future of investing,<br><strong style="color: #06b6d4;">The CryptoRafts Team</strong></p>
            </div>
            
            <div class="footer">
              <div style="margin-bottom: 20px;">
                <img src="https://via.placeholder.com/100x50/ffffff/06b6d4?text=CryptoRafts" alt="CryptoRafts Logo" style="width: 100px; height: 50px; border-radius: 8px;">
              </div>
              <p style="margin: 0; font-size: 16px; font-weight: bold;">CryptoRafts</p>
              <p style="margin: 5px 0; font-size: 14px;">Connecting Founders with Capital</p>
              <p style="margin: 15px 0 0 0; font-size: 12px;">This email was sent to ${userData.email}</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to CryptoRafts!
        
        Congratulations ${fullName}!
        
        We're thrilled to inform you that your CryptoRafts account has been successfully approved. You now have access to our exclusive platform.
        
        What's Next?
        - Complete your investor profile
        - Browse exclusive investment opportunities
        - Connect with other members
        - Start building your portfolio
        
        Access your dashboard: https://cryptorafts.com/founder/dashboard
        
        Our support team is here to help you make the most of your CryptoRafts experience.
        
        Welcome to the future of investing,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        This email was sent to ${userData.email}
      `
    };
  }

  async sendEmail(userData) {
    try {
      const transporter = nodemailer.createTransport(this.config);
      
      // Verify connection
      await transporter.verify();
      console.log('✅ Gmail connection successful!');
      
      const template = this.createProfessionalEmail(userData);
      
      const mailOptions = {
        from: `"CryptoRafts" <${this.config.auth.user}>`, // Will show as "CryptoRafts <your-email@gmail.com>"
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Professional email sent successfully!');
      console.log('📧 Message ID:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Email failed:', error.message);
      return false;
    }
  }

  async testSystem() {
    console.log('🧪 Testing Working Email System...\n');
    
    const testUser = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'test@example.com', // Change this to your test email
      company: 'Test Company',
      jobTitle: 'Investor'
    };

    const result = await this.sendEmail(testUser);
    
    if (result) {
      console.log('\n🎉 SUCCESS! Working email system!');
      console.log('📧 Professional CryptoRafts email sent!');
      console.log('\n📋 Next Steps:');
      console.log('1. Get Gmail App Password for shamsi4269@gmail.com');
      console.log('2. Replace password in this script');
      console.log('3. Send approval emails to all users');
    } else {
      console.log('\n❌ Setup needed:');
      console.log('1. Go to myaccount.google.com → Security');
      console.log('2. Enable 2-Step Verification');
      console.log('3. Generate App Password for "Mail"');
      console.log('4. Replace "REPLACE_WITH_YOUR_GMAIL_APP_PASSWORD" in this script');
    }
  }
}

// Run the working system
const emailService = new WorkingEmailService();
emailService.testSystem();
