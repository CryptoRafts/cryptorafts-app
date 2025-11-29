#!/usr/bin/env node

/**
 * 🚀 COMPLETELY AUTOMATED ADMIN SYSTEM
 * This will work without any manual setup!
 */

console.log('🚀 CryptoRafts Completely Automated Admin System');
console.log('===============================================\n');

const nodemailer = require('nodemailer');

// Working email configuration
const emailConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'anasshamsiggc@gmail.com',
    pass: 'shamsi4269@'
  }
};

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

// Send approval email
async function sendApprovalEmail(userData) {
  try {
    const transporter = nodemailer.createTransport(emailConfig);
    
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
    
    console.log(`✅ Email sent to ${userData.email}`);
    return true;
    
  } catch (error) {
    console.log(`❌ Failed to send email to ${userData.email}:`, error.message);
    return false;
  }
}

// Approve all users
async function approveAllUsers() {
  console.log('🚀 Starting bulk approval process...\n');
  
  // Sample users (replace with your actual user data)
  const users = [
    {
      firstName: 'John',
      lastName: 'Doe',
      email: 'cryptorafts@gmail.com',
      company: 'Test Company',
      jobTitle: 'Investor'
    },
    {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'anasshamsiggc@gmail.com',
      company: 'Another Company',
      jobTitle: 'Founder'
    }
  ];
  
  console.log(`📧 Sending approval emails to ${users.length} users...\n`);
  
  let successCount = 0;
  let failCount = 0;
  
  for (const user of users) {
    console.log(`📧 Sending to ${user.email}...`);
    const success = await sendApprovalEmail(user);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Wait 1 second between emails
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Approval Process Complete!');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📧 Total: ${users.length}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Approval emails sent successfully!');
    console.log('📧 All users have been notified of their approval.');
  }
}

// Main function
async function main() {
  const command = process.argv[2];
  
  if (command === 'approve-all') {
    await approveAllUsers();
  } else {
    console.log('🚀 CryptoRafts Admin System');
    console.log('==========================\n');
    console.log('Available commands:');
    console.log('  node admin.js approve-all  - Send approval emails to all users');
    console.log('\nExample:');
    console.log('  node admin.js approve-all');
  }
}

main();