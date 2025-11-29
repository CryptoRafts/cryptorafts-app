import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth, initAdmin } from '@/server/firebaseAdmin';
import { emailService } from '@/lib/email.service';
import crypto from 'crypto';

// Initialize Firebase Admin on module load
if (typeof window === 'undefined') {
  initAdmin();
}

interface TeamInvitation {
  id: string;
  email: string;
  inviterId: string;
  inviterEmail: string;
  inviterName: string;
  inviterRole: string;
  orgId: string;
  role: 'admin' | 'member' | 'viewer';
  teamType: 'vc' | 'founder' | 'exchange' | 'ido' | 'influencer' | 'agency';
  invitationToken: string;
  invitationLink: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  acceptedBy?: string;
}

// Generate secure invitation token
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
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
    const inviterId = decodedToken.uid;
    const inviterEmail = decodedToken.email;
    const inviterName = decodedToken.name || inviterEmail?.split('@')[0] || 'User';

    if (!inviterEmail) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const body = await request.json();
    const { email, fullName, role = 'member', teamType } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Validate teamType
    const validTeamTypes = ['vc', 'founder', 'exchange', 'ido', 'influencer', 'agency'];
    if (!teamType || !validTeamTypes.includes(teamType)) {
      return NextResponse.json({ error: 'Valid team type is required' }, { status: 400 });
    }

    const adminDb = getAdminDb();
    if (!adminDb) {
      return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
    }

    // Get inviter's user data to determine orgId and role
    const inviterDoc = await adminDb.collection('users').doc(inviterId).get();
    if (!inviterDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const inviterData = inviterDoc.data();
    const inviterRole = inviterData?.role || 'founder';
    const orgId = inviterData?.orgId || inviterData?.organization_id || inviterId;

    // Determine collection name based on team type
    const teamCollectionMap: Record<string, string> = {
      vc: 'vc_team_members',
      founder: 'founder_team_members',
      exchange: 'exchange_team_members',
      ido: 'ido_team_members',
      influencer: 'influencer_team_members',
      agency: 'agency_team_members',
    };

    const teamCollection = teamCollectionMap[teamType] || 'team_members';

    // Check if email already exists in team
    const existingMemberQuery = await adminDb
      .collection(teamCollection)
      .where('orgId', '==', orgId)
      .where('email', '==', email.toLowerCase())
      .get();

    if (!existingMemberQuery.empty) {
      return NextResponse.json({ error: 'Team member with this email already exists' }, { status: 400 });
    }

    // Check for existing pending invitation
    const existingInviteQuery = await adminDb
      .collection('team_invitations')
      .where('email', '==', email.toLowerCase())
      .where('orgId', '==', orgId)
      .where('teamType', '==', teamType)
      .where('status', '==', 'pending')
      .get();

    if (!existingInviteQuery.empty) {
      const existingInvite = existingInviteQuery.docs[0].data() as TeamInvitation;
      return NextResponse.json({
        success: true,
        message: 'Invitation already sent',
        invitation: {
          id: existingInvite.id,
          email: existingInvite.email,
          invitationLink: existingInvite.invitationLink,
        },
      });
    }

    // Generate invitation token and link
    const invitationToken = generateInvitationToken();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://cryptorafts.com';
    const invitationLink = `${baseUrl}/invite/signup?token=${invitationToken}`;

    // Create invitation document
    const invitationId = `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const invitationData: TeamInvitation = {
      id: invitationId,
      email: email.toLowerCase(),
      inviterId,
      inviterEmail,
      inviterName,
      inviterRole,
      orgId,
      role,
      teamType,
      invitationToken,
      invitationLink,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    // Save invitation to Firestore
    await adminDb.collection('team_invitations').doc(invitationId).set({
      ...invitationData,
      createdAt: adminDb.firestore.FieldValue.serverTimestamp(),
      expiresAt: adminDb.firestore.Timestamp.fromDate(invitationData.expiresAt),
    });

    // Create pending team member record
    const teamMemberId = `${teamType}_team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const teamMemberData = {
      id: teamMemberId,
      orgId: orgId,
      email: email.toLowerCase(),
      fullName: fullName || email.split('@')[0],
      role: role,
      status: 'invited',
      invitedBy: inviterId,
      invitedByEmail: inviterEmail,
      invitedByName: inviterName,
      invitationToken: invitationToken,
      invitationLink: invitationLink,
      teamType: teamType,
      invitedAt: adminDb.firestore.FieldValue.serverTimestamp(),
      createdAt: adminDb.firestore.FieldValue.serverTimestamp(),
      updatedAt: adminDb.firestore.FieldValue.serverTimestamp(),
    };

    await adminDb.collection(teamCollection).doc(teamMemberId).set(teamMemberData);

    // Send invitation email - MUST be sent synchronously in real-time
    let emailSent = false;
    let emailError: string | null = null;
    
    try {
      console.log(`📧 [REAL-TIME] Starting to send invitation email to ${email.toLowerCase()}...`);
      console.log(`📧 [REAL-TIME] Invitation link: ${invitationLink}`);
      
      emailSent = await emailService.sendTeamInvitation({
        email: email.toLowerCase(),
        fullName: fullName || email.split('@')[0],
        inviterName: inviterName,
        inviterEmail: inviterEmail,
        teamType: teamType,
        role: role,
        invitationLink: invitationLink,
      });

      if (emailSent) {
        console.log(`✅ [REAL-TIME] Invitation email sent successfully to ${email.toLowerCase()}`);
      } else {
        emailError = 'Email service returned false - check email configuration';
        console.error(`❌ [REAL-TIME] Failed to send invitation email to ${email.toLowerCase()}`);
      }
    } catch (emailErr: any) {
      emailError = emailErr.message || 'Unknown error sending email';
      console.error(`❌ [REAL-TIME] Error sending invitation email to ${email.toLowerCase()}:`, emailErr);
      console.error(`❌ [REAL-TIME] Error details:`, {
        message: emailErr.message,
        code: emailErr.code,
        stack: emailErr.stack,
      });
    }

    // Return response with email status
    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Team member invitation sent successfully and email delivered' 
        : 'Team member invitation created, but email delivery failed',
      emailSent: emailSent,
      emailError: emailError,
      invitation: {
        id: invitationId,
        email: email.toLowerCase(),
        invitationLink: invitationLink,
        expiresAt: invitationData.expiresAt,
      },
      teamMember: {
        id: teamMemberId,
        email: email.toLowerCase(),
        status: 'invited',
      },
    });
  } catch (error: any) {
    console.error('Error inviting team member:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to invite team member' },
      { status: 500 }
    );
  }
}

