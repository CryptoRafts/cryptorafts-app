import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email.service';

// API endpoint to send verification code emails (server-side only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    // Validate required fields
    if (!email || !code) {
      return NextResponse.json(
        { error: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Invalid code format' },
        { status: 400 }
      );
    }

    // Send verification code email
    const result = await emailService.sendVerificationCode(email, code, 'support');

    if (result) {
      console.log(`✅ Verification code email sent successfully to ${email}`);
      return NextResponse.json({
        success: true,
        message: 'Verification code email sent successfully',
      });
    } else {
      console.error(`❌ Failed to send verification code email to ${email}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send verification code email',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Error in send-code API:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send verification code email',
      },
      { status: 500 }
    );
  }
}

