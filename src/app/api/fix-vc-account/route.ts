import { NextRequest, NextResponse } from 'next/server';
import { adminAuth as auth } from '@/lib/firebase.admin';
import { vcAccountFix } from '@/lib/vc-account-fix';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Verify user exists and is authenticated
    try {
      await auth.getUser(userId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 401 }
      );
    }

    // Fix VC account
    const result = await vcAccountFix.fixVCAccount(userId);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in fix-vc-account API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, action, step } = await request.json();

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'User ID and action are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    try {
      await auth.getUser(userId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 401 }
      );
    }

    let result;

    switch (action) {
      case 'reset':
        await vcAccountFix.resetVCOnboarding(userId);
        result = { success: true, message: 'VC onboarding reset successfully' };
        break;
      case 'complete':
        if (!step) {
          return NextResponse.json(
            { error: 'Step is required for complete action' },
            { status: 400 }
          );
        }
        await vcAccountFix.completeVCOnboardingStep(userId, step);
        result = { success: true, message: `VC onboarding step ${step} completed` };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error in fix-vc-account API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
