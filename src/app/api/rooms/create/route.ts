import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";
import { requireUser } from "@/app/api/_utils";

export async function POST(req: NextRequest) {
  try {
    const uid = await requireUser(req);
    if (!uid) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { 
      type, 
      projectId, 
      counterpartyId, 
      counterpartyType, 
      counterpartyRole,
      roomName,
      additionalMembers = []
    } = body;

    // Validate required fields
    if (!type || !projectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate room type
    const validTypes = ['deal', 'listing', 'ido', 'campaign', 'proposal', 'team'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid room type" }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    // Verify project ownership for founders
    const projectRef = db.doc(`projects/${projectId}`);
    const projectSnap = await projectRef.get();
    
    if (!projectSnap.exists) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectSnap.data() as any;
    if (!project) {
      return NextResponse.json({ error: "Project data unavailable" }, { status: 404 });
    }
    
    // Check if user is authorized to create this room type
    let isAuthorized = false;
    let members: string[] = [uid];

    switch (type) {
      case 'deal':
        // Only VCs can create deal rooms
        isAuthorized = counterpartyRole === 'vc';
        if (isAuthorized) {
          members = [uid, project.founderId ?? '', ...additionalMembers].filter(Boolean) as string[];
        }
        break;
      
      case 'listing':
        // Only exchanges can create listing rooms
        isAuthorized = counterpartyRole === 'exchange';
        if (isAuthorized) {
          members = [uid, project.founderId ?? '', ...additionalMembers].filter(Boolean) as string[];
        }
        break;
      
      case 'ido':
        // Only IDO platforms can create IDO rooms
        isAuthorized = counterpartyRole === 'ido';
        if (isAuthorized) {
          members = [uid, project.founderId ?? '', ...additionalMembers].filter(Boolean) as string[];
        }
        break;
      
      case 'campaign':
        // Only influencers can create campaign rooms
        isAuthorized = counterpartyRole === 'influencer';
        if (isAuthorized) {
          members = [uid, project.founderId ?? '', ...additionalMembers].filter(Boolean) as string[];
        }
        break;
      
      case 'proposal':
        // Only agencies can create proposal rooms
        isAuthorized = counterpartyRole === 'agency';
        if (isAuthorized) {
          members = [uid, project.founderId, ...additionalMembers].filter(Boolean);
        }
        break;
      
      case 'team':
        // Only founders can create team rooms
        isAuthorized = uid === (project.founderId ?? '');
        if (isAuthorized) {
          members = [uid, ...additionalMembers].filter(Boolean);
        }
        break;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Not authorized to create this room type" }, { status: 403 });
    }

    // Generate room ID
    const roomId = `${type}_${projectId}_${uid}_${Date.now()}`;

    // Create room document
    const roomData = {
      id: roomId,
      name: roomName || `${type.charAt(0).toUpperCase() + type.slice(1)}: ${project.title || 'Untitled Project'}`,
      type,
      projectId,
      ownerId: uid,
      members: [...new Set(members)], // Remove duplicates
      status: 'active',
      createdAt: Date.now(),
      lastActivityAt: Date.now(),
      metadata: {
        counterpartyType,
        counterpartyId,
        projectTitle: project.title || 'Untitled Project'
      }
    };

    await db.doc(`rooms/${roomId}`).set(roomData);

    // Create initial system message
    const systemMessage = {
      senderId: 'system',
      type: 'system',
      text: getSystemMessage(type, project.title || 'Untitled Project'),
      createdAt: Date.now()
    };

    await db.doc(`rooms/${roomId}/messages/${Date.now()}_system`).set(systemMessage);

    // Update project with room reference
    await projectRef.set({
      rooms: {
        [type]: roomId,
        updatedAt: Date.now()
      },
      updatedAt: Date.now()
    }, { merge: true });

    // Create notifications for all members
    const notificationPromises = members.map(async (memberId) => {
      if (memberId !== uid) { // Don't notify the creator
        await db.collection('notifications').add({
          userId: memberId,
          type: 'room_created',
          title: `New ${type} room created`,
          message: `You've been added to a new ${type} room for ${project.title}`,
          roomId,
          projectId,
          read: false,
          createdAt: Date.now()
        });
      }
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      roomId,
      room: roomData
    });

  } catch (error) {
    console.error('Room creation error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getSystemMessage(type: string, projectTitle: string): string {
  const messages = {
    deal: `🎯 Deal room created for ${projectTitle}. This is your private space to discuss investment terms and due diligence. Use /raftai help for AI assistance.`,
    listing: `📈 Listing room created for ${projectTitle}. This is your private space to discuss exchange listing requirements and timelines.`,
    ido: `🚀 IDO room created for ${projectTitle}. This is your private space to discuss IDO launch strategy and token distribution.`,
    campaign: `📢 Campaign room created for ${projectTitle}. This is your private space to discuss marketing campaigns and influencer partnerships.`,
    proposal: `💼 Proposal room created for ${projectTitle}. This is your private space to discuss service proposals and project requirements.`,
    team: `👥 Team room created for ${projectTitle}. This is your private team workspace for internal project discussions.`
  };

  return messages[type as keyof typeof messages] || `Room created for ${projectTitle}`;
}
