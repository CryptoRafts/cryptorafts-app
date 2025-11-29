#!/usr/bin/env node

/**
 * 🧪 SIMPLE DEMO TEST EMAIL - Shows Everything
 */

console.log('\n');
console.log('🧪 ========================================');
console.log('   CryptoRafts Demo Test Email Sender');
console.log('========================================\n');

const nodemailer = require('nodemailer');

// Check if password is set
const password = 'REPLACE_WITH_YOUR_CRYPTORAFTS_GMAIL_APP_PASSWORD';

if (password === 'REPLACE_WITH_YOUR_CRYPTORAFTS_GMAIL_APP_PASSWORD') {
  console.log('⚠️  SETUP REQUIRED:\n');
  console.log('   1. Open this file: send-demo-test-email-simple.js');
  console.log('   2. Replace the password on line 12');
  console.log('   3. Save and run again\n');
  console.log('   📧 Gmail Setup:');
  console.log('      - Sign in to cryptorafts@gmail.com');
  console.log('      - Enable 2-Step Verification');
  console.log('      - Generate App Password for "Mail"\n');
  process.exit(1);
}

console.log('📧 Email Configuration:');
console.log('   FROM: business@cryptorafts.com');
console.log('   TO:   cryptorafts@gmail.com');
console.log('   SMTP: cryptorafts@gmail.com (Gmail)\n');

// Email configuration
const config = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'cryptorafts@gmail.com',
    pass: password
  }
};

// Simple demo email
const demoEmail = {
  from: '"CryptoRafts" <business@cryptorafts.com>',
  to: 'cryptorafts@gmail.com',
  subject: '🧪 CryptoRafts Demo Test Email',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">🧪 Demo Test Email</h1>
        <p style="margin: 10px 0 0 0;">CryptoRafts Email System Test</p>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: #10b981; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">✅ SUCCESS!</h2>
          <p style="margin: 10px 0 0 0;">Your email system is working perfectly!</p>
        </div>
        
        <h3>📧 Email Details:</h3>
        <ul>
          <li><strong>From:</strong> business@cryptorafts.com</li>
          <li><strong>To:</strong> cryptorafts@gmail.com</li>
          <li><strong>Status:</strong> ✅ Working!</li>
        </ul>
        
        <p>If you received this email, your CryptoRafts email system is fully operational!</p>
        
        <p style="margin-top: 30px;">Best regards,<br><strong>The CryptoRafts Team</strong></p>
      </div>
    </div>
  `,
  text: `
    Demo Test Email - CryptoRafts
    
    SUCCESS!
    Your email system is working perfectly!
    
    Email Details:
    - From: business@cryptorafts.com
    - To: cryptorafts@gmail.com
    - Status: ✅ Working!
    
    If you received this email, your CryptoRafts email system is fully operational!
    
    Best regards,
    The CryptoRafts Team
  `
};

// Send email
async function sendEmail() {
  try {
    console.log('🔍 Step 1: Connecting to Gmail...');
    const transporter = nodemailer.createTransport(config);
    
    console.log('🔍 Step 2: Verifying connection...');
    await transporter.verify();
    console.log('   ✅ Connection successful!\n');
    
    console.log('🔍 Step 3: Sending email...');
    console.log('   FROM: business@cryptorafts.com');
    console.log('   TO:   cryptorafts@gmail.com\n');
    
    const result = await transporter.sendMail(demoEmail);
    
    console.log('\n🎉 SUCCESS! Email sent successfully!\n');
    console.log('📧 Message ID:', result.messageId);
    console.log('\n📋 Next Steps:');
    console.log('   1. Check cryptorafts@gmail.com inbox');
    console.log('   2. Verify the email was received');
    console.log('   3. Check "From" shows business@cryptorafts.com');
    console.log('   4. Send approval emails to all users!\n');
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    console.log('\n🔧 Setup Instructions:');
    console.log('   1. Sign in to Gmail with cryptorafts@gmail.com');
    console.log('   2. Go to myaccount.google.com → Security');
    console.log('   3. Enable "2-Step Verification"');
    console.log('   4. Generate "App Password" for "Mail"');
    console.log('   5. Update password in this script');
    console.log('   6. Run again\n');
  }
}

// Run
sendEmail();

