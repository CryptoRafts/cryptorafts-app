import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth.service';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the token and get user info
    const user = authService.getCurrentUser();
    const profile = authService.getUserProfile();
    
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      },
      profile: profile ? {
        role: profile.role,
        kycStatus: profile.kycStatus,
        kybStatus: profile.kybStatus,
        onboardingStep: profile.onboardingStep,
        isActive: profile.isActive
      } : null,
      isAdmin: authService.isAdmin(),
      isKycVerified: authService.isKycVerified(),
      isKybVerified: authService.isKybVerified(),
      isOnboardingComplete: authService.isOnboardingComplete()
    });
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({ error: 'Authentication test failed' }, { status: 500 });
  }
}
