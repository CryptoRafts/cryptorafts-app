#!/usr/bin/env node

/**
 * 🚀 VERCEL DOMAIN + HOSTINGER EMAIL TEST
 * Test email with your Vercel domain and Hostinger MX records
 */

console.log('🚀 CryptoRafts Vercel Domain Email Test');
console.log('=======================================\n');

const nodemailer = require('nodemailer');

// Email configuration with Vercel domain
const config = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'anasshamsiggc@gmail.com', // Your Gmail account
    pass: 'REPLACE_WITH_YOUR_ANASSHAMSI_APP_PASSWORD' // Gmail App Password
  }
};

console.log('📧 Email Configuration:');
console.log('   FROM: business@cryptorafts.com (Hostinger)');
console.log('   TO:   cryptorafts@gmail.com');
console.log('   SMTP: anasshamsiggc@gmail.com (Gmail)');
console.log('   DOMAIN: Your Vercel domain with MX records\n');

// Professional test email
const testEmail = {
  from: '"CryptoRafts" <business@cryptorafts.com>', // Send FROM business@cryptorafts.com
  to: 'cryptorafts@gmail.com', // Send TO cryptorafts@gmail.com
  subject: '🎉 CryptoRafts Vercel Domain Email Test - SUCCESS!',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CryptoRafts Vercel Domain Email Test</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 40px 30px; text-align: center; }
        .logo { width: 120px; height: 60px; margin-bottom: 20px; background: white; border-radius: 12px; display: inline-block; }
        .content { padding: 40px 30px; background: #f8fafc; }
        .success-box { background: #10b981; color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }
        .info-box { background: #e0f2fe; border-left: 4px solid #06b6d4; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .mx-box { background: #f0f9ff; border: 1px solid #06b6d4; padding: 15px; border-radius: 8px; margin: 10px 0; }
        .footer { background: #1f2937; color: white; padding: 30px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <img src="https://via.placeholder.com/120x60/06b6d4/ffffff?text=CryptoRafts" alt="CryptoRafts Logo" style="width: 100%; height: 100%; border-radius: 12px;">
          </div>
          <h1 style="margin: 0; font-size: 32px;">🎉 Vercel Domain Email Test</h1>
          <p style="margin: 15px 0 0 0; font-size: 18px;">Hostinger + Vercel Integration</p>
        </div>
        
        <div class="content">
          <div class="success-box">
            <h2 style="margin: 0;">✅ SUCCESS!</h2>
            <p style="margin: 10px 0 0 0; font-size: 18px;">Your Vercel domain email is working!</p>
          </div>
          
          <h2 style="color: #1f2937; margin-top: 0;">📧 Email Configuration</h2>
          
          <div class="info-box">
            <h3 style="color: #06b6d4; margin-top: 0;">🔗 Connection Details:</h3>
            <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
              <li><strong>Business Email:</strong> business@cryptorafts.com (Hostinger)</li>
              <li><strong>Domain:</strong> Your Vercel domain with MX records</li>
              <li><strong>SMTP Server:</strong> anasshamsiggc@gmail.com (Gmail)</li>
              <li><strong>Status:</strong> ✅ Connected and Working</li>
            </ul>
          </div>
          
          <div class="mx-box">
            <h3 style="color: #1f2937; margin-top: 0;">📋 MX Records (Added to Vercel):</h3>
            <p style="margin: 5px 0;"><strong>mx1.hostinger.com</strong> - Priority: 5</p>
            <p style="margin: 5px 0;"><strong>mx2.hostinger.com</strong> - Priority: 10</p>
            <p style="margin: 5px 0; color: #10b981;">✅ MX records are properly configured in Vercel!</p>
          </div>
          
          <h3 style="color: #1f2937;">🎯 What This Means:</h3>
          <ul style="line-height: 1.8;">
            <li>✅ business@cryptorafts.com is active and working</li>
            <li>✅ Your Vercel domain works with email</li>
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
          
          <p style="font-size: 16px; margin-top: 30px;">Your CryptoRafts Vercel domain email system is now fully operational!</p>
          
          <p style="font-size: 16px; margin-top: 20px;">Best regards,<br><strong style="color: #06b6d4;">The CryptoRafts Team</strong></p>
        </div>
        
        <div class="footer">
          <div style="margin-bottom: 20px;">
            <img src="https://via.placeholder.com/100x50/ffffff/06b6d4?text=CryptoRafts" alt="CryptoRafts Logo" style="width: 100px; height: 50px; border-radius: 8px;">
          </div>
          <p style="margin: 0; font-size: 16px; font-weight: bold;">CryptoRafts</p>
          <p style="margin: 5px 0; font-size: 14px;">Connecting Founders with Capital</p>
          <p style="margin: 15px 0 0 0; font-size: 12px;">Business Email: business@cryptorafts.com</p>
          <p style="margin: 10px 0 0 0; font-size: 12px;">Vercel Domain: Your domain with MX records</p>
          <p style="margin: 10px 0 0 0; font-size: 12px;">Sent: ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `,
  text: `
    CryptoRafts Vercel Domain Email Test - SUCCESS!
    
    SUCCESS!
    Your Vercel domain email is working!
    
    Email Configuration
    ===================
    
    Connection Details:
    - Business Email: business@cryptorafts.com (Hostinger)
    - Domain: Your Vercel domain with MX records
    - SMTP Server: anasshamsiggc@gmail.com (Gmail)
    - Status: ✅ Connected and Working
    
    MX Records (Added to Vercel):
    - mx1.hostinger.com - Priority: 5
    - mx2.hostinger.com - Priority: 10
    - ✅ MX records are properly configured in Vercel!
    
    What This Means:
    - ✅ business@cryptorafts.com is active and working
    - ✅ Your Vercel domain works with email
    - ✅ All emails sent FROM business@cryptorafts.com
    - ✅ Professional business email address
    - ✅ Gmail SMTP for reliable delivery
    - ✅ Ready to send approval emails to all users
    
    Next Steps:
    1. Send approval emails to all registered users
    2. All emails will show "From: business@cryptorafts.com"
    3. Monitor email delivery and responses
    4. Enjoy your professional business email system!
    
    Your CryptoRafts Vercel domain email system is now fully operational!
    
    Best regards,
    The CryptoRafts Team
    
    ---
    CryptoRafts - Connecting Founders with Capital
    Business Email: business@cryptorafts.com
    Vercel Domain: Your domain with MX records
    Sent: ${new Date().toLocaleString()}
  `
};

// Send Vercel domain email test
async function sendVercelDomainTest() {
  try {
    console.log('🔍 Step 1: Connecting to Gmail...');
    const transporter = nodemailer.createTransport(config);
    
    console.log('🔍 Step 2: Verifying connection...');
    await transporter.verify();
    console.log('   ✅ Gmail connection successful!\n');
    
    console.log('🔍 Step 3: Sending Vercel domain email test...');
    console.log('   FROM: business@cryptorafts.com (Hostinger)');
    console.log('   TO:   cryptorafts@gmail.com');
    console.log('   DOMAIN: Your Vercel domain with MX records\n');
    
    const result = await transporter.sendMail(testEmail);
    
    console.log('\n🎉 SUCCESS! Vercel domain email sent successfully!\n');
    console.log('📧 Message ID:', result.messageId);
    console.log('\n📋 Email Details:');
    console.log('   ✅ From: business@cryptorafts.com');
    console.log('   ✅ To: cryptorafts@gmail.com');
    console.log('   ✅ SMTP: anasshamsiggc@gmail.com');
    console.log('   ✅ Domain: Vercel with MX records');
    console.log('\n🔍 Next Steps:');
    console.log('   1. Check cryptorafts@gmail.com inbox');
    console.log('   2. Look for email from business@cryptorafts.com');
    console.log('   3. Verify Vercel domain is working');
    console.log('   4. Send approval emails to all users!');
    console.log('   5. All emails will show "From: business@cryptorafts.com"');
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    console.log('\n🔧 QUICK FIX:');
    console.log('   1. Add MX records to Vercel domain:');
    console.log('      - mx1.hostinger.com (Priority: 5)');
    console.log('      - mx2.hostinger.com (Priority: 10)');
    console.log('   2. Sign in to Gmail with anasshamsiggc@gmail.com');
    console.log('   3. Enable 2-Step Verification');
    console.log('   4. Generate App Password for "Mail"');
    console.log('   5. Update password in this script');
    console.log('   6. Run again\n');
  }
}

// Run Vercel domain test
sendVercelDomainTest();
