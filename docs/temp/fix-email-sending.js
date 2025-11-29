#!/usr/bin/env node

/**
 * 🚀 WORKING EMAIL SOLUTION - Let's Fix This!
 */

console.log('🚀 CryptoRafts Email Fix');
console.log('========================\n');

const nodemailer = require('nodemailer');

// Let's try with your existing Gmail account
const config = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'anasshamsiggc@gmail.com', // Your actual Gmail account
    pass: 'REPLACE_WITH_YOUR_ANASSHAMSI_APP_PASSWORD' // You need App Password for this account
  }
};

console.log('📧 Email Configuration:');
console.log('   FROM: business@cryptorafts.com');
console.log('   TO:   cryptorafts@gmail.com');
console.log('   SMTP: anasshamsiggc@gmail.com (Your Gmail)\n');

// Simple test email
const testEmail = {
  from: '"CryptoRafts" <business@cryptorafts.com>', // Send FROM business@cryptorafts.com
  to: 'cryptorafts@gmail.com', // Send TO cryptorafts@gmail.com
  subject: '🧪 CryptoRafts Test Email - FIXED!',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0;">🧪 Test Email - FIXED!</h1>
        <p style="margin: 10px 0 0 0;">CryptoRafts Email System</p>
      </div>
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="background: #10b981; color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h2 style="margin: 0;">✅ SUCCESS!</h2>
          <p style="margin: 10px 0 0 0;">Email system is working!</p>
        </div>
        
        <h3>📧 Email Details:</h3>
        <ul>
          <li><strong>From:</strong> business@cryptorafts.com</li>
          <li><strong>To:</strong> cryptorafts@gmail.com</li>
          <li><strong>SMTP:</strong> anasshamsiggc@gmail.com</li>
          <li><strong>Status:</strong> ✅ Working!</li>
        </ul>
        
        <p>If you received this email, your CryptoRafts email system is working perfectly!</p>
        
        <p style="margin-top: 30px;">Best regards,<br><strong>The CryptoRafts Team</strong></p>
      </div>
    </div>
  `,
  text: `
    CryptoRafts Test Email - FIXED!
    
    SUCCESS!
    Email system is working!
    
    Email Details:
    - From: business@cryptorafts.com
    - To: cryptorafts@gmail.com
    - SMTP: anasshamsiggc@gmail.com
    - Status: ✅ Working!
    
    If you received this email, your CryptoRafts email system is working perfectly!
    
    Best regards,
    The CryptoRafts Team
  `
};

// Send test email
async function sendTestEmail() {
  try {
    console.log('🔍 Step 1: Connecting to Gmail...');
    const transporter = nodemailer.createTransport(config);
    
    console.log('🔍 Step 2: Verifying connection...');
    await transporter.verify();
    console.log('   ✅ Connection successful!\n');
    
    console.log('🔍 Step 3: Sending test email...');
    console.log('   FROM: business@cryptorafts.com');
    console.log('   TO:   cryptorafts@gmail.com\n');
    
    const result = await transporter.sendMail(testEmail);
    
    console.log('\n🎉 SUCCESS! Email sent successfully!\n');
    console.log('📧 Message ID:', result.messageId);
    console.log('\n📋 Next Steps:');
    console.log('   1. Check cryptorafts@gmail.com inbox');
    console.log('   2. Look for email from business@cryptorafts.com');
    console.log('   3. If received, your system is working!');
    console.log('   4. Send approval emails to all users!\n');
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    console.log('\n🔧 QUICK FIX:');
    console.log('   1. Sign in to Gmail with anasshamsiggc@gmail.com');
    console.log('   2. Go to myaccount.google.com → Security');
    console.log('   3. Enable "2-Step Verification"');
    console.log('   4. Generate "App Password" for "Mail"');
    console.log('   5. Update password in this script');
    console.log('   6. Run again\n');
  }
}

// Run test
sendTestEmail();
