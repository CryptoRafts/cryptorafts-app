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
    const userEmail = decodedToken.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const body = await request.json();
    const { email, fullName, role = 'member' } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // Get user's organization
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const orgId = userData?.orgId || userData?.organization_id || userId;

    // Check if email already exists in team
    const existingMemberQuery = await adminDb
      .collection('vc_team_members')
      .where('orgId', '==', orgId)
      .where('email', '==', email.toLowerCase())
      .get();

    if (!existingMemberQuery.empty) {
      return NextResponse.json({ error: 'Team member with this email already exists' }, { status: 400 });
    }

    // Create team member invitation
    const teamMemberId = `vc_team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const teamMemberData = {
      id: teamMemberId,
      orgId: orgId,
      email: email.toLowerCase(),
      fullName: fullName || email.split('@')[0],
      role: role,
      status: 'invited',
      invitedBy: userId,
      invitedByEmail: userEmail,
      invitedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await adminDb.collection('vc_team_members').doc(teamMemberId).set(teamMemberData);

    return NextResponse.json({
      success: true,
      message: 'Team member invitation sent',
      teamMember: teamMemberData
    });
  } catch (error: any) {
    console.error('Error inviting team member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to invite team member' },
      { status: 500 }
    );
  }
}

