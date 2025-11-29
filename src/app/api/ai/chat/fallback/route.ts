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
    const { roomId, projectId, projectTitle, dealType } = body;

    if (!roomId) {
      return NextResponse.json({ error: "Missing roomId" }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    
    // Verify the chat room exists and user has access
    const roomRef = db.doc(`chatRooms/${roomId}`);
    const roomSnap = await roomRef.get();
    
    if (!roomSnap.exists) {
      return NextResponse.json({ error: "Chat room not found" }, { status: 404 });
    }

    const room = roomSnap.data();
    if (!room?.participants?.includes(uid)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create a simple fallback welcome message without RaftAI
    const welcomeMessageRef = db.collection(`chatRooms/${roomId}/messages`).doc();
    await welcomeMessageRef.set({
      id: welcomeMessageRef.id,
      content: `🎉 Deal room created for "${projectTitle || 'your project'}"!\n\nThis is your private space to discuss the ${dealType || 'investment'} opportunity.\n\nYou can:\n• Share documents and updates\n• Discuss terms and conditions\n• Schedule meetings and calls\n• Track progress and milestones\n\nLet's make this deal happen! 💼`,
      sender: 'system',
      senderName: 'System',
      senderAvatar: '/system-icon.png',
      timestamp: new Date(),
      type: 'system',
      metadata: {
        type: 'welcome',
        dealType: dealType || 'investment',
        projectTitle: projectTitle
      }
    });

    // Update chat room with fallback status
    await roomRef.update({
      raftaiStatus: 'fallback',
      lastMessage: 'Deal room created - Ready for discussions',
      lastActivity: new Date(),
      fallbackMode: true
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Fallback chat room initialized successfully',
      roomId,
      raftaiStatus: 'fallback'
    });

  } catch (error) {
    console.error('Fallback chat initialization error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
