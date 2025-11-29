/**
 * Team Management API for Blog Department
 * 
 * POST /api/blog/admin/team - Invite team member
 * GET /api/blog/admin/team - Get team members
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/server/firebaseAdmin';

const COLLECTION_NAME = 'blog_team_members';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, department, role, invitedBy } = body;

    if (!email || !department || !invitedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate Gmail email
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return NextResponse.json(
        { success: false, error: 'Only Gmail accounts are allowed' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    // Check if member already exists
    const existingQuery = await db.collection(COLLECTION_NAME)
      .where('email', '==', email.toLowerCase())
      .where('department', '==', department)
      .get();

    if (!existingQuery.empty) {
      return NextResponse.json(
        { success: false, error: 'Member already exists in this department' },
        { status: 400 }
      );
    }

    // Create team member invitation
    const memberData = {
      email: email.toLowerCase(),
      department,
      role: role || 'member',
      status: 'invited',
      invitedBy,
      invitedAt: new Date(),
      createdAt: new Date(),
      permissions: {
        canPost: true,
        canEdit: role === 'admin' || role === 'editor',
        canDelete: role === 'admin',
        canPublish: role === 'admin' || role === 'editor',
      },
    };

    const docRef = await db.collection(COLLECTION_NAME).add(memberData);

    return NextResponse.json({
      success: true,
      memberId: docRef.id,
      message: `Invitation sent to ${email}`,
    });

  } catch (error: any) {
    console.error('❌ Error inviting team member:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to invite team member' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not initialized' },
        { status: 500 }
      );
    }

    let query = db.collection(COLLECTION_NAME);
    
    if (department) {
      query = query.where('department', '==', department) as any;
    }

    const snapshot = await query.get();
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      members,
      count: members.length,
    });

  } catch (error: any) {
    console.error('❌ Error fetching team members:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch team members' },
      { status: 500 }
    );
  }
}

