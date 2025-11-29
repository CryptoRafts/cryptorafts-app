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
    const userName = decodedToken.name || userEmail?.split('@')[0] || 'User';

    if (!userEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const body = await request.json();
    const { token: invitationToken } = body;

    if (!invitationToken) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // Find invitation by token
    const invitationQuery = await adminDb
      .collection('team_invitations')
      .where('invitationToken', '==', invitationToken)
      .limit(1)
      .get();

    if (invitationQuery.empty) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      );
    }

    const invitationDoc = invitationQuery.docs[0];
    const invitationData = invitationDoc.data();

    // Verify email matches
    if (invitationData.email.toLowerCase() !== userEmail.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invitation is for a different email address. Please sign in with the invited email.' },
        { status: 400 }
      );
    }

    // Check if invitation is expired
    const expiresAt = invitationData.expiresAt?.toDate();
    if (expiresAt && expiresAt < new Date()) {
      await invitationDoc.ref.update({ status: 'expired' });
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      );
    }

    // Check if invitation is already accepted
    if (invitationData.status === 'accepted') {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      );
    }

    // Check if invitation is revoked
    if (invitationData.status === 'revoked') {
      return NextResponse.json(
        { error: 'This invitation has been revoked' },
        { status: 400 }
      );
    }

    // Determine collection name based on team type
    const teamCollectionMap: Record<string, string> = {
      vc: 'vc_team_members',
      founder: 'founder_team_members',
      exchange: 'exchange_team_members',
      ido: 'ido_team_members',
      influencer: 'influencer_team_members',
      agency: 'agency_team_members',
    };

    const teamCollection = teamCollectionMap[invitationData.teamType] || 'team_members';

    // Find the pending team member record
    const teamMemberQuery = await adminDb
      .collection(teamCollection)
      .where('orgId', '==', invitationData.orgId)
      .where('email', '==', userEmail.toLowerCase())
      .where('status', '==', 'invited')
      .limit(1)
      .get();

    if (teamMemberQuery.empty) {
      return NextResponse.json(
        { error: 'Team member record not found' },
        { status: 404 }
      );
    }

    const teamMemberDoc = teamMemberQuery.docs[0];

    // Update team member status to active
    await teamMemberDoc.ref.update({
      status: 'active',
      userId: userId,
      userName: userName,
      acceptedAt: adminDb.firestore.FieldValue.serverTimestamp(),
      updatedAt: adminDb.firestore.FieldValue.serverTimestamp(),
    });

    // Update invitation status
    await invitationDoc.ref.update({
      status: 'accepted',
      acceptedBy: userId,
      acceptedAt: adminDb.firestore.FieldValue.serverTimestamp(),
    });

    // Update or create user document with role and orgId
    const userDocRef = adminDb.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (userDoc.exists) {
      // Update existing user
      await userDocRef.update({
        role: invitationData.teamType,
        orgId: invitationData.orgId,
        teamRole: invitationData.role,
        updatedAt: adminDb.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Create new user document
      await userDocRef.set({
        uid: userId,
        email: userEmail.toLowerCase(),
        display_name: userName,
        role: invitationData.teamType,
        orgId: invitationData.orgId,
        teamRole: invitationData.role,
        onboarding_state: 'DONE',
        created_at: adminDb.firestore.FieldValue.serverTimestamp(),
        updated_at: adminDb.firestore.FieldValue.serverTimestamp(),
      });
    }

    // Set custom claims for the user
    try {
      await auth.setCustomUserClaims(userId, {
        role: invitationData.teamType,
        teamRole: invitationData.role,
        orgId: invitationData.orgId,
      });
    } catch (claimsError) {
      console.error('Error setting custom claims:', claimsError);
      // Don't fail the request if claims fail - user is still added to team
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      invitation: {
        id: invitationDoc.id,
        teamType: invitationData.teamType,
        role: invitationData.role,
      },
      teamMember: {
        id: teamMemberDoc.id,
        email: userEmail,
        role: invitationData.role,
      },
    });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept invitation' },
      { status: 500 }
    );
  }
}

