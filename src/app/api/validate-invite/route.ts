import { NextRequest, NextResponse } from 'next/server';

interface InviteCode {
  id: string;
  code: string;
  email?: string;
  fullName?: string;
  role: 'admin' | 'member' | 'viewer';
  roomScope: 'room_admin' | 'editor' | 'reader';
  createdAt: Date;
  expiresAt: Date;
  status: 'pending' | 'used' | 'expired' | 'revoked';
  usedBy?: string;
  usedAt?: Date;
  createdBy: string;
}

// Demo invite codes for testing
const demoInviteCodes: InviteCode[] = [
  {
    id: 'invite-1',
    code: 'VC-TEAM-ABC123',
    email: 'alex@vc.com',
    fullName: 'Alex Rodriguez',
    role: 'member',
    roomScope: 'editor',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
    status: 'pending',
    createdBy: 'demo-vc-123'
  },
  {
    id: 'invite-2',
    code: 'VC-TEAM-XYZ789',
    email: 'emma@vc.com',
    fullName: 'Emma Wilson',
    role: 'viewer',
    roomScope: 'reader',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // expired 1 day ago
    status: 'expired',
    createdBy: 'demo-vc-123'
  },
  {
    id: 'invite-3',
    code: 'VC-TEAM-DEF456',
    email: 'john@vc.com',
    fullName: 'John Smith',
    role: 'admin',
    roomScope: 'room_admin',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
    status: 'used',
    usedBy: 'member-2',
    usedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdBy: 'demo-vc-123'
  }
];

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Invite code is required' },
        { status: 400 }
      );
    }

    // Validate code format
    const validCodePattern = /^VC-TEAM-[A-Z0-9]{6}$/;
    if (!validCodePattern.test(code)) {
      return NextResponse.json(
        { error: 'Invalid invite code format' },
        { status: 400 }
      );
    }

    // Find invite code in demo data, or create a valid one for any VC-TEAM- format
    let inviteCode = demoInviteCodes.find(invite => invite.code === code);

    // If not found in demo data but format is valid, create a valid invite
    if (!inviteCode) {
      inviteCode = {
        id: `invite-${Date.now()}`,
        code,
        email: '',
        fullName: '',
        role: 'member',
        roomScope: 'editor',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
        createdBy: 'demo-vc-123'
      };
    }

    // Check if code is expired
    if (inviteCode.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This invite code has expired' },
        { status: 400 }
      );
    }

    // Check if code is already used
    if (inviteCode.status === 'used') {
      return NextResponse.json(
        { error: 'This code has already been used' },
        { status: 400 }
      );
    }

    // Check if code is revoked
    if (inviteCode.status === 'revoked') {
      return NextResponse.json(
        { error: 'This invite code has been revoked' },
        { status: 400 }
      );
    }

    // Return valid invite code data
    return NextResponse.json({
      success: true,
      invite: {
        id: inviteCode.id,
        code: inviteCode.code,
        email: inviteCode.email,
        fullName: inviteCode.fullName,
        role: inviteCode.role,
        roomScope: inviteCode.roomScope,
        expiresAt: inviteCode.expiresAt,
        createdAt: inviteCode.createdAt
      }
    });

  } catch (error) {
    console.error('Error validating invite code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { code, action } = await request.json();

    if (!code || !action) {
      return NextResponse.json(
        { error: 'Invite code and action are required' },
        { status: 400 }
      );
    }

    const inviteCode = demoInviteCodes.find(invite => invite.code === code);

    if (!inviteCode) {
      return NextResponse.json(
        { error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    if (action === 'use') {
      // Mark code as used
      inviteCode.status = 'used';
      inviteCode.usedAt = new Date();
      // In real implementation, you would save this to database
    } else if (action === 'revoke') {
      // Revoke code
      inviteCode.status = 'revoked';
      // In real implementation, you would save this to database
    }

    return NextResponse.json({
      success: true,
      message: `Invite code ${action === 'use' ? 'used' : 'revoked'} successfully`
    });

  } catch (error) {
    console.error('Error updating invite code:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
