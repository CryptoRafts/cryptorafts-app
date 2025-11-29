/**
 * Test Email Script
 * Run this to send a test email to anasshamsiggc@gmail.com
 * 
 * Usage: node test-email.js
 */

const nodemailer = require('nodemailer');

async function sendTestEmail() {
  console.log('📧 Setting up email service...');
  
  // Create transporter
  const transporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'business@cryptorafts.com',
      pass: process.env.EMAIL_PASSWORD || ''
    }
  });

  // Verify connection
  try {
    await transporter.verify();
    console.log('✅ Email service connected successfully');
  } catch (error) {
    console.error('❌ Email service connection failed:', error);
    console.log('\n💡 Make sure you have set up email credentials in .env.local');
    console.log('   EMAIL_HOST=smtp.gmail.com');
    console.log('   EMAIL_PORT=587');
    console.log('   EMAIL_USER=business@cryptorafts.com');
    console.log('   EMAIL_PASSWORD=your_gmail_app_password');
    return;
  }

  // Test email content
  const mailOptions = {
    from: '"CryptoRafts" <business@cryptorafts.com>',
    to: 'anasshamsiggc@gmail.com',
    subject: '🎯 Test Email from CryptoRafts',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Test Email - CryptoRafts</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #06b6d4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 CryptoRafts</h1>
            <p>Test Email System</p>
          </div>
          <div class="content">
            <h2>Hello!</h2>
            <p>Congratulations! 🎉</p>
            <p>This is a test email to verify that the automated email system from CryptoRafts is working correctly.</p>
            
            <p><strong>What this means:</strong></p>
            <ul>
              <li>✅ Email service is configured correctly</li>
              <li>✅ You can now send automated KYC/KYB approval emails</li>
              <li>✅ Promotional emails are ready to send</li>
              <li>✅ Welcome emails will work for new subscribers</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="https://www.cryptorafts.com" class="button">
                Visit CryptoRafts
              </a>
            </div>
            
            <p><strong>Email Types Available:</strong></p>
            <ul>
              <li>KYC Approval/Rejection</li>
              <li>KYB Approval/Rejection</li>
              <li>Welcome Emails</li>
              <li>Promotional Emails</li>
              <li>Registration Confirmations</li>
            </ul>
            
            <p>All emails are sent from <strong>business@cryptorafts.com</strong></p>
            
            <p>Best regards,<br>The CryptoRafts Team</p>
          </div>
          <div class="footer">
            <p>CryptoRafts - Connecting Founders with Capital</p>
            <p>This is a test email sent to verify the email system</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Test Email from CryptoRafts

Congratulations!

This is a test email to verify that the automated email system from CryptoRafts is working correctly.

What this means:
- Email service is configured correctly
- You can now send automated KYC/KYB approval emails
- Promotional emails are ready to send
- Welcome emails will work for new subscribers

Email Types Available:
- KYC Approval/Rejection
- KYB Approval/Rejection
- Welcome Emails
- Promotional Emails
- Registration Confirmations

All emails are sent from business@cryptorafts.com

Best regards,
The CryptoRafts Team

---
CryptoRafts - Connecting Founders with Capital
    `
  };

  // Send email
  try {
    console.log('📤 Sending test email to anasshamsiggc@gmail.com...');
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', info.messageId);
    console.log('\n📬 Check your inbox at anasshamsiggc@gmail.com');
    console.log('   (Also check spam folder if not received)');
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    console.log('\n💡 Common issues:');
    console.log('   1. Check EMAIL_USER and EMAIL_PASSWORD in .env.local');
    console.log('   2. For Gmail, use App Password (not regular password)');
    console.log('   3. Enable "Less secure app access" if needed');
    console.log('   4. Check internet connection');
  }
}

// Run the test
sendTestEmail().catch(console.error);

