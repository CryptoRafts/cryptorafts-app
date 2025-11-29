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
    const { memberId, role } = body;

    if (!memberId || !role) {
      return NextResponse.json({ error: 'Member ID and role are required' }, { status: 400 });
    }

    if (!['admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
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
    
    // Verify user has permission (must be from same org and be admin/owner)
    const userDoc = await adminDb.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const orgId = userData?.orgId || userData?.organization_id || userId;

    if (memberData?.orgId !== orgId) {
      return NextResponse.json({ error: 'Unauthorized to update this member' }, { status: 403 });
    }

    // Check if user is admin or owner
    const userMemberQuery = await adminDb
      .collection('vc_team_members')
      .where('orgId', '==', orgId)
      .where('userId', '==', userId)
      .get();

    let canUpdate = false;
    if (!userMemberQuery.empty) {
      const userMemberData = userMemberQuery.docs[0].data();
      canUpdate = userMemberData.role === 'admin' || userMemberData.role === 'owner';
    } else {
      // If user is not in team members, check if they're the org owner
      canUpdate = userId === orgId;
    }

    if (!canUpdate) {
      return NextResponse.json({ error: 'Only admins and owners can update member roles' }, { status: 403 });
    }

    // Update team member role
    await adminDb.collection('vc_team_members').doc(memberId).update({
      role: role,
      updatedAt: new Date().toISOString()
    });

    // If member has userId, also update their user document
    if (memberData.userId) {
      await adminDb.collection('users').doc(memberData.userId).update({
        vcTeamRole: role,
        updatedAt: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Team member role updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating team member role:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update team member role' },
      { status: 500 }
    );
  }
}


