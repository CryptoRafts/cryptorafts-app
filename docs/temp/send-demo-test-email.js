#!/usr/bin/env node

/**
 * 🧪 SEND DEMO TEST EMAIL
 * Send a test email from business@cryptorafts.com to cryptorafts@gmail.com
 */

import nodemailer from 'nodemailer';

console.log('🧪 Sending Demo Test Email');
console.log('==========================\n');

// Test email configuration
const config = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'cryptorafts@gmail.com', // Use Gmail for SMTP authentication
    pass: 'REPLACE_WITH_YOUR_CRYPTORAFTS_GMAIL_APP_PASSWORD' // You need App Password
  }
};

// Professional demo email template
const demoEmail = {
  subject: '🧪 CryptoRafts Demo Test Email - business@cryptorafts.com',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CryptoRafts Demo Test Email</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 40px 30px; text-align: center; }
        .logo { width: 120px; height: 60px; margin-bottom: 20px; background: white; border-radius: 12px; display: inline-block; }
        .content { padding: 40px 30px; background: #f8fafc; }
        .success-box { background: #10b981; color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
        .info-box { background: #e0f2fe; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <img src="https://via.placeholder.com/120x60/06b6d4/ffffff?text=CryptoRafts" alt="CryptoRafts Logo" style="width: 100%; height: 100%; border-radius: 12px;">
          </div>
          <h1 style="margin: 0; font-size: 32px;">🧪 Demo Test Email</h1>
          <p style="margin: 15px 0 0 0; font-size: 18px;">CryptoRafts Email System Test</p>
        </div>
        
        <div class="content">
          <div class="success-box">
            <h2 style="margin: 0;">✅ SUCCESS!</h2>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your email system is working perfectly!</p>
          </div>
          
          <h2 style="color: #1f2937; margin-top: 0;">Email Configuration Test</h2>
          
          <div class="info-box">
            <h3 style="color: #06b6d4; margin-top: 0;">📧 Email Details:</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>From:</strong> business@cryptorafts.com (Hostinger)</li>
              <li><strong>To:</strong> cryptorafts@gmail.com</li>
              <li><strong>SMTP:</strong> cryptorafts@gmail.com (Gmail)</li>
              <li><strong>Status:</strong> ✅ Connection Successful</li>
              <li><strong>Delivery:</strong> ✅ Email Sent Successfully</li>
            </ul>
          </div>
          
          <h3 style="color: #1f2937;">🎯 What This Means:</h3>
          <ul style="line-height: 1.8;">
            <li>✅ business@cryptorafts.com is properly configured</li>
            <li>✅ Gmail SMTP connection is working</li>
            <li>✅ Professional email templates are ready</li>
            <li>✅ You can now send approval emails to all users</li>
            <li>✅ All emails will show "From: business@cryptorafts.com"</li>
          </ul>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #06b6d4;">
            <h3 style="color: #06b6d4; margin-top: 0;">🚀 Next Steps:</h3>
            <ol style="line-height: 1.8; margin: 0;">
              <li>Send approval emails to all registered users</li>
              <li>Test with real user emails</li>
              <li>Monitor email delivery</li>
              <li>Enjoy your automated email system!</li>
            </ol>
          </div>
          
          <p style="font-size: 16px; margin-top: 30px;">If you received this email, your CryptoRafts email system is fully operational!</p>
          
          <p style="font-size: 16px; margin-top: 20px;">Best regards,<br><strong style="color: #06b6d4;">The CryptoRafts Team</strong></p>
        </div>
        
        <div class="footer">
          <div style="margin-bottom: 20px;">
            <img src="https://via.placeholder.com/100x50/ffffff/06b6d4?text=CryptoRafts" alt="CryptoRafts Logo" style="width: 100px; height: 50px; border-radius: 8px;">
          </div>
          <p style="margin: 0; font-size: 16px; font-weight: bold;">CryptoRafts</p>
          <p style="margin: 5px 0; font-size: 14px;">Connecting Founders with Capital</p>
          <p style="margin: 15px 0 0 0; font-size: 12px;">Demo Test Email from business@cryptorafts.com</p>
          <p style="margin: 10px 0 0 0; font-size: 12px;">Sent: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    CryptoRafts Demo Test Email
    
    SUCCESS!
    Your email system is working perfectly!
    
    Email Configuration Test
    ========================
    
    Email Details:
    - From: business@cryptorafts.com (Hostinger)
    - To: cryptorafts@gmail.com
    - SMTP: cryptorafts@gmail.com (Gmail)
    - Status: ✅ Connection Successful
    - Delivery: ✅ Email Sent Successfully
    
    What This Means:
    - ✅ business@cryptorafts.com is properly configured
    - ✅ Gmail SMTP connection is working
    - ✅ Professional email templates are ready
    - ✅ You can now send approval emails to all users
    - ✅ All emails will show "From: business@cryptorafts.com"
    
    Next Steps:
    1. Send approval emails to all registered users
    2. Test with real user emails
    3. Monitor email delivery
    4. Enjoy your automated email system!
    
    If you received this email, your CryptoRafts email system is fully operational!
    
    Best regards,
    The CryptoRafts Team
    
    ---
    CryptoRafts - Connecting Founders with Capital
    Demo Test Email from business@cryptorafts.com
    Sent: ${new Date().toLocaleString()}
  `
};

// Send demo test email
async function sendDemoTestEmail() {
  try {
    console.log('📧 Setting up email connection...');
    const transporter = nodemailer.createTransport(config);
    
    // Verify connection
    console.log('🔍 Verifying Gmail connection...');
    await transporter.verify();
    console.log('✅ Gmail connection successful!');
    
    console.log('\n📧 Sending demo test email...');
    console.log('   FROM: business@cryptorafts.com');
    console.log('   TO: cryptorafts@gmail.com');
    console.log('   SMTP: cryptorafts@gmail.com (Gmail)\n');
    
    const mailOptions = {
      from: `"CryptoRafts" <business@cryptorafts.com>`, // Send FROM business@cryptorafts.com
      to: 'cryptorafts@gmail.com', // Send TO cryptorafts@gmail.com
      subject: demoEmail.subject,
      html: demoEmail.html,
      text: demoEmail.text,
      replyTo: 'business@cryptorafts.com',
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('🎉 SUCCESS! Demo test email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('\n📋 Email Details:');
    console.log('   ✅ From: business@cryptorafts.com');
    console.log('   ✅ To: cryptorafts@gmail.com');
    console.log('   ✅ SMTP: cryptorafts@gmail.com');
    console.log('\n🔍 Next Steps:');
    console.log('   1. Check cryptorafts@gmail.com inbox');
    console.log('   2. Verify the email was received');
    console.log('   3. Check "From" shows business@cryptorafts.com');
    console.log('   4. Send approval emails to all users!');
    
  } catch (error) {
    console.error('\n❌ Failed to send demo test email:', error.message);
    console.log('\n🔧 Setup needed:');
    console.log('   1. Go to Gmail.com and sign in with cryptorafts@gmail.com');
    console.log('   2. Go to myaccount.google.com → Security');
    console.log('   3. Enable 2-Step Verification');
    console.log('   4. Generate App Password for "Mail"');
    console.log('   5. Replace "REPLACE_WITH_YOUR_CRYPTORAFTS_GMAIL_APP_PASSWORD" in this script');
    console.log('   6. Run this script again');
  }
}

// Run the demo test
sendDemoTestEmail();
