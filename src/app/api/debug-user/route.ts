import { NextRequest, NextResponse } from 'next/server';
import { adminAuth as auth, adminDb as db } from '@/lib/firebase.admin';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    // Get user data from Firestore
    const userDoc = await getDoc(doc(db!, 'users', userId));
    
    if (!userDoc.exists()) {
      return NextResponse.json({
        error: 'User document not found in Firestore',
        userId,
        exists: false
      });
    }

    const userData = userDoc.data();
    
    return NextResponse.json({
      userId,
      exists: true,
      ...userData,
      // Convert timestamps to readable format
      createdAt: userData.createdAt?.toDate?.() || userData.createdAt,
      updatedAt: userData.updatedAt?.toDate?.() || userData.updatedAt,
      'onboarding.startedAt': userData.onboarding?.startedAt?.toDate?.() || userData.onboarding?.startedAt,
      'onboarding.completedAt': userData.onboarding?.completedAt?.toDate?.() || userData.onboarding?.completedAt,
      'kyc.submittedAt': userData.kyc?.submittedAt?.toDate?.() || userData.kyc?.submittedAt,
      'kyc.approvedAt': userData.kyc?.approvedAt?.toDate?.() || userData.kyc?.approvedAt,
      'kyb.submittedAt': userData.kyb?.submittedAt?.toDate?.() || userData.kyb?.submittedAt,
      'kyb.approvedAt': userData.kyb?.approvedAt?.toDate?.() || userData.kyb?.approvedAt,
    });

  } catch (error) {
    console.error('Error in debug-user API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
