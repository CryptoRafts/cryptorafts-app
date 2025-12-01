import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email.service';

/**
 * Test email endpoint - for debugging email issues
 * POST /api/email/test
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email address is required' },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing email service with recipient: ${email}`);

    // Test sending a team invitation email
    const testInvitationData = {
      email: email,
      fullName: 'Test User',
      inviterName: 'Test Inviter',
      inviterEmail: 'test@cryptorafts.com',
      teamType: 'vc',
      role: 'member',
      invitationLink: 'https://cryptorafts.com/invite/signup?token=test-token-123',
    };

    const emailSent = await emailService.sendTeamInvitation(testInvitationData);

    if (emailSent) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        recipient: email,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Email service returned false - check email configuration',
          recipient: email,
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Error testing email service:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send test email',
        details: {
          message: error.message,
          code: error.code,
          command: error.command,
        },
      },
      { status: 500 }
    );
  }
}











