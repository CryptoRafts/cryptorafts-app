#!/usr/bin/env tsx

/**
 * Test script for CryptoRafts email functionality
 * Run with: npx tsx scripts/test-email.ts
 */

import { emailService } from '../src/lib/email.service';

async function testEmailService() {
  console.log('🧪 Testing CryptoRafts Email Service...\n');

  // Test user data
  const testUser = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com', // Change this to your test email
    company: 'Test Company',
    jobTitle: 'Test Role'
  };

  try {
    console.log('📧 Testing email service connection...');
    
    // Test 1: Registration confirmation email
    console.log('\n1. Testing registration confirmation email...');
    const registrationResult = await emailService.sendRegistrationConfirmation(testUser);
    console.log(`   Result: ${registrationResult ? '✅ Success' : '❌ Failed'}`);

    // Test 2: Approval email
    console.log('\n2. Testing approval email...');
    const approvalResult = await emailService.sendApprovalEmail(testUser);
    console.log(`   Result: ${approvalResult ? '✅ Success' : '❌ Failed'}`);

    // Test 3: KYC approval notification
    console.log('\n3. Testing KYC approval notification...');
    const kycResult = await emailService.sendKYCApprovalNotification(testUser);
    console.log(`   Result: ${kycResult ? '✅ Success' : '❌ Failed'}`);

    console.log('\n🎉 Email service test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Check your email inbox for test messages');
    console.log('2. Verify email formatting and content');
    console.log('3. Update EMAIL_PASSWORD in .env.local with actual Hostinger password');
    console.log('4. Test with real user emails');

  } catch (error) {
    console.error('❌ Email service test failed:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check EMAIL_PASSWORD in .env.local');
    console.log('2. Verify Hostinger SMTP settings');
    console.log('3. Ensure business@cryptorafts.com email account exists');
    console.log('4. Check firewall/network settings');
  }
}

// Run the test
testEmailService();
