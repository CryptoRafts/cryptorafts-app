import nodemailer from 'nodemailer';

// Test email with your provided password
async function testEmailWithYourPassword() {
  console.log('🧪 Testing CryptoRafts Email with your password...\n');

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: 'business@cryptorafts.com',
      pass: 'shamsi4269@'
    }
  });

  try {
    // Test connection
    console.log('📡 Testing connection to Gmail...');
    await transporter.verify();
    console.log('✅ Connection successful!');

    // Test email sending
    console.log('\n📧 Testing email sending...');
    
    const testEmail = {
      from: '"CryptoRafts" <business@cryptorafts.com>',
      to: 'test@example.com', // Change this to your test email
      subject: '🎉 CryptoRafts Email Test - SUCCESS!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #06b6d4, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🚀 CryptoRafts Email Test</h1>
            <p>Your email system is working perfectly!</p>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2>✅ Email Configuration Successful!</h2>
            <p>Your business email <strong>business@cryptorafts.com</strong> is now ready to send approval emails to all registered users.</p>
            
            <h3>🎯 What's Ready:</h3>
            <ul>
              <li>✅ Registration confirmation emails</li>
              <li>✅ Account approval emails</li>
              <li>✅ KYC approval notifications</li>
              <li>✅ Bulk email operations</li>
            </ul>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="https://cryptorafts.com/admin/email" style="background: #06b6d4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
                Access Admin Panel
              </a>
            </div>
            
            <p><strong>Next Steps:</strong></p>
            <ol>
              <li>Run: <code>node admin.js approve-all</code> to send approval emails to all users</li>
              <li>Visit: <code>/admin/email</code> for web-based management</li>
              <li>Monitor email delivery in your Gmail sent folder</li>
            </ol>
            
            <p>Best regards,<br>The CryptoRafts Team</p>
          </div>
        </div>
      `,
      text: `
        CryptoRafts Email Test - SUCCESS!
        
        Your email system is working perfectly!
        
        Your business email business@cryptorafts.com is now ready to send approval emails to all registered users.
        
        What's Ready:
        - Registration confirmation emails
        - Account approval emails  
        - KYC approval notifications
        - Bulk email operations
        
        Next Steps:
        1. Run: node admin.js approve-all to send approval emails to all users
        2. Visit: /admin/email for web-based management
        3. Monitor email delivery in your Gmail sent folder
        
        Best regards,
        The CryptoRafts Team
      `
    };

    const result = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
    console.log('\n🎉 YOUR EMAIL SYSTEM IS READY!');
    console.log('================================');
    console.log('\n📋 Ready to use commands:');
    console.log('• node admin.js stats - Get user statistics');
    console.log('• node admin.js approve-all - Send approval to all users');
    console.log('• node admin.js approve-pending - Send approval to pending users');
    console.log('\n🌐 Web interface: http://localhost:3001/admin/email');

  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    
    if (error.message.includes('Invalid login')) {
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Make sure business@cryptorafts.com is set up in Gmail');
      console.log('2. Enable 2-Factor Authentication on Gmail');
      console.log('3. Generate an App Password (not regular password)');
      console.log('4. Use the App Password in EMAIL_PASSWORD');
    }
  }
}

// Run the test
testEmailWithYourPassword();
