import { emailService } from './src/lib/email.service';

async function quickTest() {
  console.log('🧪 Testing email service...');
  
  try {
    const result = await emailService.sendApprovalEmail({
      firstName: 'Test',
      lastName: 'User', 
      email: 'test@example.com',
      company: 'Test Company',
      jobTitle: 'Test Role'
    });
    
    console.log(result ? '✅ Email service working!' : '❌ Email service failed');
  } catch (error) {
    console.log('❌ Error:', error.message);
    console.log('💡 Make sure to update EMAIL_PASSWORD in .env.local');
  }
}

quickTest();