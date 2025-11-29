import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email.service';

// API route for sending approval emails
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, userData, users } = body;

    // Validate required fields
    if (!type) {
      return NextResponse.json(
        { error: 'Email type is required' },
        { status: 400 }
      );
    }

    let result;
    
    switch (type) {
      case 'approval':
        if (!userData?.email) {
          return NextResponse.json(
            { error: 'User data with email is required for approval email' },
            { status: 400 }
          );
        }
        result = await emailService.sendApprovalEmail(userData);
        break;
        
      case 'registration':
        if (!userData?.email) {
          return NextResponse.json(
            { error: 'User data with email is required for registration email' },
            { status: 400 }
          );
        }
        result = await emailService.sendRegistrationConfirmation(userData);
        break;
        
      case 'kyc_approval':
        if (!userData?.email) {
          return NextResponse.json(
            { error: 'User data with email is required for KYC approval email' },
            { status: 400 }
          );
        }
        result = await emailService.sendKYCApprovalNotification(userData);
        break;
        
      case 'bulk_approval':
        if (!users || !Array.isArray(users)) {
          return NextResponse.json(
            { error: 'Users array is required for bulk approval emails' },
            { status: 400 }
          );
        }
        result = await emailService.sendBulkApprovalEmails(users);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid email type. Supported types: approval, registration, kyc_approval, bulk_approval' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      result,
      message: `Email(s) sent successfully`
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// API route for testing email configuration
export async function GET() {
  try {
    // Test email configuration
    const testUserData = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      company: 'Test Company',
      jobTitle: 'Test Role'
    };

    // This will test the connection without actually sending
    const result = await emailService.sendApprovalEmail(testUserData);
    
    return NextResponse.json({
      success: true,
      message: 'Email service is configured correctly',
      testResult: result
    });

  } catch (error) {
    console.error('Email test error:', error);
    return NextResponse.json(
      { 
        error: 'Email service configuration test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
