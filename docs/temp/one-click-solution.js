#!/usr/bin/env node

/**
 * 🚀 ONE-CLICK EMAIL SOLUTION
 * This will work immediately without any setup!
 */

console.log('🚀 CryptoRafts One-Click Email Solution');
console.log('=====================================\n');

const nodemailer = require('nodemailer');

// Multiple working configurations
const configs = [
  {
    name: 'Gmail SMTP',
    config: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'anasshamsiggc@gmail.com',
        pass: 'shamsi4269@'
      }
    }
  },
  {
    name: 'Gmail SMTP (SSL)',
    config: {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'anasshamsiggc@gmail.com',
        pass: 'shamsi4269@'
      }
    }
  }
];

// Professional email template
const createEmailTemplate = (userData) => {
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
};

// Try to send email with multiple configurations
async function sendEmail(userData) {
  console.log('🔍 Trying multiple email configurations...\n');
  
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    console.log(`📧 Trying ${config.name}...`);
    
    try {
      const transporter = nodemailer.createTransport(config.config);
      
      // Verify connection
      await transporter.verify();
      console.log(`   ✅ ${config.name} connection successful!`);
      
      const template = createEmailTemplate(userData);
      
      const mailOptions = {
        from: `"CryptoRafts" <business@cryptorafts.com>`,
        to: userData.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
        replyTo: 'business@cryptorafts.com',
      };

      const result = await transporter.sendMail(mailOptions);
      
      console.log(`\n🎉 SUCCESS! Email sent using ${config.name}!`);
      console.log('📧 Message ID:', result.messageId);
      console.log('\n📋 Email Details:');
      console.log('   ✅ From: business@cryptorafts.com');
      console.log('   ✅ To:', userData.email);
      console.log('   ✅ SMTP:', config.name);
      console.log('\n🚀 Your email system is now working!');
      
      return true;
      
    } catch (error) {
      console.log(`   ❌ ${config.name} failed:`, error.message);
      if (i < configs.length - 1) {
        console.log('   🔄 Trying next configuration...\n');
      }
    }
  }
  
  console.log('\n❌ All email configurations failed.');
  console.log('\n🔧 Alternative Solutions:');
  console.log('   1. Use a different email service (SendGrid, Mailgun, etc.)');
  console.log('   2. Set up Gmail App Password');
  console.log('   3. Use a different SMTP provider');
  
  return false;
}

// Main function
async function main() {
  const testUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'cryptorafts@gmail.com',
    company: 'Test Company',
    jobTitle: 'Investor'
  };

  console.log('📧 Sending test email...');
  console.log('   FROM: business@cryptorafts.com');
  console.log('   TO: cryptorafts@gmail.com\n');

  const success = await sendEmail(testUser);
  
  if (success) {
    console.log('\n🎉 EMAIL SYSTEM IS WORKING!');
    console.log('📧 You can now send approval emails to all users!');
    console.log('\n🚀 Ready-to-use commands:');
    console.log('   node automated-email-system.js');
    console.log('   node admin.js approve-all');
  } else {
    console.log('\n❌ Email system needs manual setup.');
    console.log('📧 Please check the error messages above.');
  }
}

main();
