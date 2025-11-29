import nodemailer from 'nodemailer';

// Complete automated email system with logo
class AutomatedEmailService {
  constructor() {
    this.config = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'business@cryptorafts.com',
        pass: 'shamsi4269@' // You'll need to replace with App Password
      }
    };
  }

  // Professional email template with logo
  getApprovalEmailTemplate(userData) {
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
            .container { max-width: 600px; margin: 0 auto; background: white; }
            .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 40px 30px; text-align: center; }
            .logo { width: 120px; height: 60px; margin-bottom: 20px; background: white; border-radius: 10px; display: inline-block; }
            .content { padding: 40px 30px; background: #f8fafc; }
            .button { display: inline-block; background: #06b6d4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
            .features { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .feature { background: white; padding: 20px; border-radius: 8px; text-align: center; }
            .feature-icon { font-size: 24px; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <img src="https://via.placeholder.com/120x60/06b6d4/ffffff?text=CryptoRafts" alt="CryptoRafts Logo" style="width: 100%; height: 100%; border-radius: 10px;">
              </div>
              <h1 style="margin: 0; font-size: 28px;">🚀 Welcome to CryptoRafts!</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your account has been approved</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin-top: 0;">Congratulations ${fullName}!</h2>
              <p style="font-size: 16px;">We're excited to inform you that your CryptoRafts account has been successfully approved. You can now access all the features and opportunities available on our platform.</p>
              
              <div class="features">
                <div class="feature">
                  <div class="feature-icon">💼</div>
                  <h3>Deal Flow</h3>
                  <p>Access exclusive investment opportunities</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">🤝</div>
                  <h3>Networking</h3>
                  <p>Connect with founders and investors</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">📊</div>
                  <h3>Analytics</h3>
                  <p>Track your portfolio performance</p>
                </div>
                <div class="feature">
                  <div class="feature-icon">🔒</div>
                  <h3>Security</h3>
                  <p>Bank-level security and compliance</p>
                </div>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://cryptorafts.com/founder/dashboard" class="button">
                  🎯 Access Your Dashboard
                </a>
              </div>
              
              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #06b6d4; margin-top: 0;">What's Next?</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Complete your investor profile</li>
                  <li>Explore available deals</li>
                  <li>Connect with other members</li>
                  <li>Start building your portfolio</li>
                </ul>
              </div>
              
              <p style="font-size: 16px;">If you have any questions or need assistance, our support team is here to help.</p>
              
              <p style="font-size: 16px;">Best regards,<br><strong>The CryptoRafts Team</strong></p>
            </div>
            
            <div class="footer">
              <div style="margin-bottom: 20px;">
                <img src="https://via.placeholder.com/80x40/ffffff/06b6d4?text=CryptoRafts" alt="CryptoRafts Logo" style="width: 80px; height: 40px;">
              </div>
              <p style="margin: 0; font-size: 14px;">CryptoRafts - Connecting Founders with Capital</p>
              <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">This email was sent to ${userData.email}</p>
              <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
                <a href="https://cryptorafts.com/unsubscribe" style="color: #06b6d4;">Unsubscribe</a> | 
                <a href="https://cryptorafts.com/privacy" style="color: #06b6d4;">Privacy Policy</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to CryptoRafts!
        
        Congratulations ${fullName}!
        
        We're excited to inform you that your CryptoRafts account has been successfully approved. You can now access all the features and opportunities available on our platform.
        
        What's Next?
        - Complete your investor profile
        - Explore available deals
        - Connect with other members
        - Start building your portfolio
        
        Access your dashboard: https://cryptorafts.com/founder/dashboard
        
        If you have any questions or need assistance, our support team is here to help.
        
        Best regards,
        The CryptoRafts Team
        
        ---
        CryptoRafts - Connecting Founders with Capital
        This email was sent to ${userData.email}
      `
    };
  }

  // Send approval email
  async sendApprovalEmail(userData) {
    try {
      const transporter = nodemailer.createTransport(this.config);
      
      // Verify connection
      await transporter.verify();
      console.log('✅ Email service connected successfully');
      
      const template = this.getApprovalEmailTemplate(userData);
      
      const mailOptions = {
        from: `"CryptoRafts" <${this.config.auth.user}>`,
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Approval email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send approval email:', error.message);
      return false;
    }
  }

  // Test email with logo
  async testEmailWithLogo() {
    console.log('🧪 Testing CryptoRafts Email with Logo...\n');
    
    const testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com', // Change this to your email
      company: 'Test Company',
      jobTitle: 'Test Role'
    };

    const result = await this.sendApprovalEmail(testUser);
    
    if (result) {
      console.log('🎉 SUCCESS! Email with logo sent successfully!');
      console.log('📧 Check your email inbox for the professional email with CryptoRafts logo');
    } else {
      console.log('❌ Email failed - you need to set up Gmail App Password');
      console.log('\n🔧 Quick Setup:');
      console.log('1. Go to myaccount.google.com → Security');
      console.log('2. Enable 2-Step Verification');
      console.log('3. Generate App Password for "Mail"');
      console.log('4. Replace password in this script');
    }
  }
}

// Run the test
const emailService = new AutomatedEmailService();
emailService.testEmailWithLogo();
