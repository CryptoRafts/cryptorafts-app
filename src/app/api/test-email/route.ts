import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email.service';

export async function POST(request: NextRequest) {
  try {
    const { email, type } = await request.json();

    // Default test email
    const testEmail = email || 'anasshamsiggc@gmail.com';

    let result = false;
    let message = '';

    switch (type) {
      case 'welcome':
        result = await emailService.sendWelcomeEmail({
          email: testEmail,
          name: 'Test User'
        });
        message = 'Welcome email sent';
        break;

      case 'promotional':
        const promoResult = await emailService.sendPromotionalEmail(
          [{ email: testEmail, name: 'Test User' }],
          '🎯 Test Promotional Email - CryptoRafts',
          'Test Email from CryptoRafts',
          'This is a test promotional email to verify the email system is working correctly.\n\nIf you received this email, congratulations! The automated email system is now fully operational.\n\nYou will now receive:\n- Welcome emails when you subscribe\n- Promotional updates and newsletters\n- KYC/KYB approval notifications\n- Platform updates and announcements',
          'Visit Website',
          'https://www.cryptorafts.com'
        );
        result = promoResult.success > 0;
        message = `Promotional email sent: ${promoResult.success} success, ${promoResult.failed} failed`;
        break;

      case 'kyc-approval':
        result = await emailService.sendKYCApprovalNotification({
          firstName: 'Test',
          lastName: 'User',
          email: testEmail
        });
        message = 'KYC approval email sent';
        break;

      case 'kyc-rejection':
        result = await emailService.sendKYCRejectionNotification({
          firstName: 'Test',
          lastName: 'User',
          email: testEmail
        }, 'This is a test rejection email');
        message = 'KYC rejection email sent';
        break;

      default:
        // Send all test emails
        console.log('📧 Sending all test emails...');
        
        const results = await Promise.allSettled([
          emailService.sendWelcomeEmail({ email: testEmail, name: 'Test User' }),
          emailService.sendKYCApprovalNotification({ firstName: 'Test', lastName: 'User', email: testEmail }),
          emailService.sendKYBApprovalNotification({ firstName: 'Test', lastName: 'User', email: testEmail, company: 'Test Company' })
        ]);

        const successCount = results.filter(r => r.status === 'fulfilled' && r.value === true).length;
        result = successCount > 0;
        message = `Sent ${successCount}/3 test emails successfully`;
    }

    if (result) {
      return NextResponse.json({
        success: true,
        message: `✅ ${message} to ${testEmail}`,
        email: testEmail
      });
    } else {
      return NextResponse.json({
        success: false,
        message: `❌ Failed to send email to ${testEmail}`,
        email: testEmail
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ Test email error:', error);
    return NextResponse.json({
      success: false,
      message: `Error: ${error.message}`,
      error: error.toString()
    }, { status: 500 });
  }
}

