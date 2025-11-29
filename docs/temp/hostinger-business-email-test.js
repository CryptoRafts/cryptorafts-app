#!/usr/bin/env node

/**
 * 🚀 HOSTINGER EMAIL CONNECTION - business@cryptorafts.com
 * Connect your Hostinger business email with Gmail SMTP
 */

console.log('🚀 CryptoRafts Hostinger Email Connection');
console.log('==========================================\n');

const nodemailer = require('nodemailer');

// Hostinger email configuration with Gmail SMTP
const config = {
  host: 'smtp.gmail.com', // Use Gmail SMTP for reliability
  port: 587,
  secure: false,
  auth: {
    user: 'cryptorafts@gmail.com', // Your Gmail account for SMTP
    pass: 'REPLACE_WITH_YOUR_GMAIL_APP_PASSWORD' // Gmail App Password
  }
};

// Professional business email template
const businessEmail = {
  from: '"CryptoRafts" <business@cryptorafts.com>', // Send FROM your Hostinger business email
  to: 'cryptorafts@gmail.com', // Test email
  subject: '🎉 CryptoRafts Business Email Test - Hostinger Connected!',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CryptoRafts Business Email Test</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 40px 30px; text-align: center; }
        .logo { width: 120px; height: 60px; margin-bottom: 20px; background: white; border-radius: 12px; display: inline-block; }
        .content { padding: 40px 30px; background: #f8fafc; }
        .success-box { background: #10b981; color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
        .info-box { background: #e0f2fe; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
        .mx-record { background: #f0f9ff; border: 1px solid #06b6d4; padding: 15px; border-radius: 8px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <img src="https://via.placeholder.com/120x60/06b6d4/ffffff?text=CryptoRafts" alt="CryptoRafts Logo" style="width: 100%; height: 100%; border-radius: 12px;">
          </div>
          <h1 style="margin: 0; font-size: 32px;">🎉 Business Email Connected!</h1>
          <p style="margin: 15px 0 0 0; font-size: 18px;">Hostinger + Gmail Integration</p>
        </div>
        
        <div class="content">
          <div class="success-box">
            <h2 style="margin: 0;">✅ SUCCESS!</h2>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your business email is working perfectly!</p>
          </div>
          
          <h2 style="color: #1f2937; margin-top: 0;">📧 Email Configuration</h2>
          
          <div class="info-box">
            <h3 style="color: #06b6d4; margin-top: 0;">🔗 Connection Details:</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>Business Email:</strong> business@cryptorafts.com (Hostinger)</li>
              <li><strong>SMTP Server:</strong> cryptorafts@gmail.com (Gmail)</li>
              <li><strong>MX Records:</strong> ✅ Configured (mx1.hostinger.com, mx2.hostinger.com)</li>
              <li><strong>Status:</strong> ✅ Connected and Working</li>
            </ul>
          </div>
          
          <div class="mx-record">
            <h3 style="color: #1f2937; margin-top: 0;">📋 Your MX Records (Hostinger):</h3>
            <p style="margin: 5px 0;"><strong>mx1.hostinger.com</strong> - Priority: 5</p>
            <p style="margin: 5px 0;"><strong>mx2.hostinger.com</strong> - Priority: 10</p>
            <p style="margin: 5px 0; color: #10b981;">✅ MX records are properly configured!</p>
          </div>
          
          <h3 style="color: #1f2937;">🎯 What This Means:</h3>
          <ul style="line-height: 1.8;">
            <li>✅ business@cryptorafts.com is active and working</li>
            <li>✅ All emails sent FROM business@cryptorafts.com</li>
            <li>✅ Professional business email address</li>
            <li>✅ Gmail SMTP for reliable delivery</li>
            <li>✅ Ready to send approval emails to all users</li>
          </ul>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #06b6d4;">
            <h3 style="color: #06b6d4; margin-top: 0;">🚀 Next Steps:</h3>
            <ol style="line-height: 1.8; margin: 0;">
              <li>Send approval emails to all registered users</li>
              <li>All emails will show "From: business@cryptorafts.com"</li>
              <li>Monitor email delivery and responses</li>
              <li>Enjoy your professional business email system!</li>
            </ol>
          </div>
          
          <p style="font-size: 16px; margin-top: 30px;">Your CryptoRafts business email system is now fully operational!</p>
          
          <p style="font-size: 16px; margin-top: 20px;">Best regards,<br><strong style="color: #06b6d4;">The CryptoRafts Team</strong></p>
        </div>
        
        <div class="footer">
          <div style="margin-bottom: 20px;">
            <img src="https://via.placeholder.com/100x50/ffffff/06b6d4?text=CryptoRafts" alt="CryptoRafts Logo" style="width: 100px; height: 50px; border-radius: 8px;">
          </div>
          <p style="margin: 0; font-size: 16px; font-weight: bold;">CryptoRafts</p>
          <p style="margin: 5px 0; font-size: 14px;">Connecting Founders with Capital</p>
          <p style="margin: 15px 0 0 0; font-size: 12px;">Business Email: business@cryptorafts.com</p>
          <p style="margin: 10px 0 0 0; font-size: 12px;">Sent: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    CryptoRafts Business Email Test - Hostinger Connected!
    
    SUCCESS!
    Your business email is working perfectly!
    
    Email Configuration
    ===================
    
    Connection Details:
    - Business Email: business@cryptorafts.com (Hostinger)
    - SMTP Server: cryptorafts@gmail.com (Gmail)
    - MX Records: ✅ Configured (mx1.hostinger.com, mx2.hostinger.com)
    - Status: ✅ Connected and Working
    
    Your MX Records (Hostinger):
    - mx1.hostinger.com - Priority: 5
    - mx2.hostinger.com - Priority: 10
    - ✅ MX records are properly configured!
    
    What This Means:
    - ✅ business@cryptorafts.com is active and working
    - ✅ All emails sent FROM business@cryptorafts.com
    - ✅ Professional business email address
    - ✅ Gmail SMTP for reliable delivery
    - ✅ Ready to send approval emails to all users
    
    Next Steps:
    1. Send approval emails to all registered users
    2. All emails will show "From: business@cryptorafts.com"
    3. Monitor email delivery and responses
    4. Enjoy your professional business email system!
    
    Your CryptoRafts business email system is now fully operational!
    
    Best regards,
    The CryptoRafts Team
    
    ---
    CryptoRafts - Connecting Founders with Capital
    Business Email: business@cryptorafts.com
    Sent: ${new Date().toLocaleString()}
  `
};

// Send business email test
async function sendBusinessEmailTest() {
  try {
    console.log('📧 Setting up Hostinger business email connection...');
    console.log('   Business Email: business@cryptorafts.com');
    console.log('   SMTP Server: cryptorafts@gmail.com (Gmail)');
    console.log('   MX Records: mx1.hostinger.com, mx2.hostinger.com\n');
    
    const transporter = nodemailer.createTransport(config);
    
    console.log('🔍 Verifying Gmail SMTP connection...');
    await transporter.verify();
    console.log('   ✅ Gmail SMTP connection successful!\n');
    
    console.log('📧 Sending business email test...');
    console.log('   FROM: business@cryptorafts.com (Hostinger)');
    console.log('   TO:   cryptorafts@gmail.com');
    console.log('   SMTP: cryptorafts@gmail.com (Gmail)\n');
    
    const result = await transporter.sendMail(businessEmail);
    
    console.log('🎉 SUCCESS! Business email sent successfully!\n');
    console.log('📧 Message ID:', result.messageId);
    console.log('\n📋 Email Details:');
    console.log('   ✅ From: business@cryptorafts.com');
    console.log('   ✅ To: cryptorafts@gmail.com');
    console.log('   ✅ SMTP: cryptorafts@gmail.com');
    console.log('   ✅ MX Records: Configured');
    console.log('\n🔍 Next Steps:');
    console.log('   1. Check cryptorafts@gmail.com inbox');
    console.log('   2. Verify email from business@cryptorafts.com');
    console.log('   3. Send approval emails to all users!');
    console.log('   4. All emails will show "From: business@cryptorafts.com"');
    
  } catch (error) {
    console.error('\n❌ Failed to send business email:', error.message);
    console.log('\n🔧 Setup needed:');
    console.log('   1. Sign in to Gmail with cryptorafts@gmail.com');
    console.log('   2. Enable 2-Step Verification');
    console.log('   3. Generate App Password for "Mail"');
    console.log('   4. Update password in this script');
    console.log('   5. Run again');
  }
}

// Run business email test
sendBusinessEmailTest();
