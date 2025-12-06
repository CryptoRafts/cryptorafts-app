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
      roomId,
      type = 'text',
      content,
      replyTo,
      metadata = {}
    } = body;

    // Validate required fields
    if (!roomId || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate message type
    const allowedTypes = ['text', 'file', 'image', 'video', 'voice', 'poll', 'task', 'event', 'aiReply', 'system'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid message type" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }

    // Verify room access
    const roomDoc = await db.doc(`rooms/${roomId}`).get();
    if (!roomDoc.exists) {
      return NextResponse.json(
        { error: "Room not found" },
        { status: 404 }
      );
    }

    const roomData = roomDoc.data();
    if (!roomData?.members.includes(uid)) {
      return NextResponse.json(
        { error: "Unauthorized to send messages to this room" },
        { status: 403 }
      );
    }

    // Get user information
    const userDoc = await db.doc(`users/${uid}`).get();
    const userData = userDoc.data();

    // Check if user is muted
    if (roomData.settings?.mutedUsers?.includes(uid)) {
      return NextResponse.json(
        { error: "You are muted in this room" },
        { status: 403 }
      );
    }

    // Handle AI commands
    if (type === 'text' && content.startsWith('/raftai ')) {
      return await handleAICommand(uid, roomId, content, userData, db);
    }

    // Create message
    const messageData = {
      roomId,
      type,
      content,
      replyTo: replyTo || null,
      senderId: uid,
      senderName: userData?.displayName || userData?.email,
      senderAvatar: userData?.profilePhotoUrl || null,
      timestamp: Date.now(),
      metadata,
      reactions: {},
      readBy: {
        [uid]: Date.now()
      },
      edited: false,
      deleted: false
    };

    const messageRef = await db.collection('messages').add(messageData);
    const messageId = messageRef.id;

    // Update room activity
    await db.doc(`rooms/${roomId}`).update({
      lastActivityAt: Date.now(),
      messageCount: (roomData.messageCount || 0) + 1,
      updatedAt: Date.now()
    });

    // ENHANCED: Create notifications for other members with role-based routing
    const otherMembers = roomData.members.filter((memberId: string) => memberId !== uid);
    
    for (const memberId of otherMembers) {
      // Get user role to determine correct message route
      const memberDoc = await db.collection('users').doc(memberId).get();
      const memberRole = memberDoc.data()?.role || 'user';
      
      // Determine correct route based on role
      let messageRoute = '/messages';
      if (memberRole === 'founder') {
        messageRoute = '/founder/messages';
      } else if (memberRole === 'vc') {
        messageRoute = '/vc/messages';
      } else if (memberRole === 'exchange') {
        messageRoute = '/exchange/messages';
      } else if (memberRole === 'ido') {
        messageRoute = '/ido/messages';
      } else if (memberRole === 'agency') {
        messageRoute = '/agency/messages';
      } else if (memberRole === 'influencer') {
        messageRoute = '/influencer/messages';
      }
      
      // CRITICAL: Use serverTimestamp() for createdAt to ensure proper ordering and indexing
      // Import serverTimestamp from firebase-admin/firestore
      const { FieldValue } = await import('firebase-admin/firestore');
      
      await db.collection('notifications').add({
        userId: memberId,
        type: 'message',
        source: 'chat',
        title: `💬 New message in ${roomData.name}`,
        message: `${userData?.displayName}: ${content.substring(0, 100)}${content.length > 100 ? '...' : ''}`,
        data: {
          roomId,
          messageId,
          senderId: uid,
          senderName: userData?.displayName,
          url: `${messageRoute}?room=${roomId}`
        },
        read: false,
        timestamp: Date.now(),
        createdAt: FieldValue.serverTimestamp() // FIXED: Use serverTimestamp() like call notifications
      });
    }

    return NextResponse.json({
      success: true,
      messageId,
      message: "Message sent successfully"
    });

  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

async function handleAICommand(uid: string, roomId: string, content: string, userData: any, db: any) {
  try {
    const command = content.substring(8); // Remove '/raftai ' prefix
    const [action, ...args] = command.split(' ');

    let aiResponse = '';

    // TODO: Implement RaftAI integration
    switch (action) {
      case 'summarize':
        aiResponse = 'RaftAI summarization is not yet implemented.';
        break;
      case 'risks':
        aiResponse = 'RaftAI risk analysis is not yet implemented.';
        break;
      case 'draft':
        const tone = args[0] || 'professional';
        aiResponse = `RaftAI ${tone} drafting is not yet implemented.`;
        break;
      case 'action-items':
        aiResponse = 'RaftAI action item extraction is not yet implemented.';
        break;
      case 'decisions':
        aiResponse = 'RaftAI decision tracking is not yet implemented.';
        break;
      case 'translate':
        const language = args[0] || 'Spanish';
        aiResponse = `RaftAI translation to ${language} is not yet implemented.`;
        break;
      case 'compliance':
        aiResponse = 'RaftAI compliance checking is not yet implemented.';
        break;
      case 'redact':
        aiResponse = 'RaftAI redaction is not yet implemented.';
        break;
      default:
        aiResponse = `Unknown AI command: ${action}. Available commands: summarize, risks, draft, action-items, decisions, translate, compliance, redact`;
    }

    // Create AI reply message
    const messageData = {
      roomId,
      type: 'aiReply',
      content: aiResponse,
      senderId: 'raftai',
      senderName: 'RaftAI Assistant',
      senderAvatar: null,
      timestamp: Date.now(),
      metadata: {
        command: action,
        args,
        originalCommand: command
      },
      reactions: {},
      readBy: {
        [uid]: Date.now()
      },
      edited: false,
      deleted: false
    };

    const messageRef = await db.collection('messages').add(messageData);
    const messageId = messageRef.id;

    // Update room activity
    const roomDoc = await db.doc(`rooms/${roomId}`).get();
    const roomData = roomDoc.data();
    
    await db.doc(`rooms/${roomId}`).update({
      lastActivityAt: Date.now(),
      messageCount: (roomData.messageCount || 0) + 1,
      updatedAt: Date.now()
    });

    return NextResponse.json({
      success: true,
      messageId,
      message: "AI command processed successfully"
    });

  } catch (error) {
    console.error("AI command error:", error);
    return NextResponse.json(
      { error: "Failed to process AI command" },
      { status: 500 }
    );
  }
}
