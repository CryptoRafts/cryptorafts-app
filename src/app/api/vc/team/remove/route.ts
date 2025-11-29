import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth, initAdmin } from '@/server/firebaseAdmin';

// Initialize Firebase Admin on module load
if (typeof window === 'undefined') {
  initAdmin();
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const auth = getAdminAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 });
    }

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const { memberId } = body;

    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // Get member document
    const memberDoc = await adminDb.collection('vc_team_members').doc(memberId).get();
    if (!memberDoc.exists) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }

    const memberData = memberDoc.data();
    
    // Verify user has permission (must be from same org)
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const orgId = userData?.orgId || userData?.organization_id || userId;

    if (memberData?.orgId !== orgId) {
      return NextResponse.json({ error: 'Unauthorized to remove this member' }, { status: 403 });
    }

    // Remove team member
    await adminDb.collection('vc_team_members').doc(memberId).delete();

    return NextResponse.json({
      success: true,
      message: 'Team member removed successfully'
    });
  } catch (error: any) {
    console.error('Error removing team member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove team member' },
      { status: 500 }
    );
  }
}

