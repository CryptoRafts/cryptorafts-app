import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, initAdmin } from '@/server/firebaseAdmin';

// Initialize Firebase Admin on module load
if (typeof window === 'undefined') {
  initAdmin();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
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
      .where('invitationToken', '==', token)
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

    // Check if invitation is expired
    const expiresAt = invitationData.expiresAt?.toDate();
    if (expiresAt && expiresAt < new Date()) {
      // Update status to expired
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

    // Return invitation data (without sensitive info)
    return NextResponse.json({
      success: true,
      invitation: {
        id: invitationDoc.id,
        email: invitationData.email,
        inviterName: invitationData.inviterName,
        inviterEmail: invitationData.inviterEmail,
        teamType: invitationData.teamType,
        role: invitationData.role,
        expiresAt: expiresAt?.toISOString() || invitationData.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Error validating invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to validate invitation' },
      { status: 500 }
    );
  }
}

