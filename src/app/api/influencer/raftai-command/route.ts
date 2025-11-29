import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/server/firebaseAdmin";

// Handle /raftai slash commands
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const adminAuth = getAdminAuth();
    if (!adminAuth) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const { command, roomId, context } = await req.json();

    if (!command || !roomId) {
      return NextResponse.json({ error: "missing_required_fields" }, { status: 400 });
    }

    const db = getAdminDb();
    if (!db) {
      return NextResponse.json({ error: "Service temporarily unavailable" }, { status: 503 });
    }
    
    // Verify user is a participant
    const roomDoc = await db.collection("campaignRooms").doc(roomId).get();
    if (!roomDoc.exists) {
      return NextResponse.json({ error: "room_not_found" }, { status: 404 });
    }

    const roomData = roomDoc.data();
    if (!roomData?.participants?.includes(uid)) {
      return NextResponse.json({ error: "not_a_participant" }, { status: 403 });
    }

    // Call RaftAI service
    const raftaiUrl = process.env.RAFTAI_SERVICE_URL || "http://localhost:8080";
    
    try {
      const response = await fetch(`${raftaiUrl}/api/influencer-command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RAFT_AI_API_KEY || "dev_key_12345"}`
        },
        body: JSON.stringify({
          command,
          roomId,
          userId: uid,
          context: {
            ...context,
            campaignBrief: roomData.raftaiContext?.campaignBrief || "",
            previousDecisions: roomData.raftaiContext?.decisions || [],
            actionItems: roomData.raftaiContext?.actionItems || []
          }
        })
      });

      if (!response.ok) {
        throw new Error(`RaftAI service returned ${response.status}`);
      }

      const raftaiResult = await response.json();

      // Post RaftAI response as a message
      await db.collection("campaignRooms")
        .doc(roomId)
        .collection("messages")
        .add({
          senderId: "raftai",
          senderName: "RaftAI",
          senderAvatar: null,
          type: "raftai_response",
          command,
          text: raftaiResult.response || "Command executed successfully.",
          data: raftaiResult.data || {},
          reactions: {},
          readBy: [uid],
          mentions: [],
          isPinned: false,
          isEdited: false,
          isDeleted: false,
          createdAt: Date.now(),
          timestamp: Date.now()
        });

      // Update RaftAI context if needed
      if (raftaiResult.updateContext) {
        await db.collection("campaignRooms").doc(roomId).set({
          raftaiContext: {
            ...roomData.raftaiContext,
            ...raftaiResult.updateContext,
            updatedAt: Date.now()
          }
        }, { merge: true });
      }

      return NextResponse.json({ success: true, result: raftaiResult });
    } catch (raftaiError) {
      console.error("RaftAI service error:", raftaiError);
      
      // Return provider unavailable message
      return NextResponse.json({ 
        success: false, 
        error: "raftai_unavailable",
        message: "RaftAI service is currently unavailable. Please try again later."
      }, { status: 503 });
    }
  } catch (error: any) {
    console.error("Error executing RaftAI command:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

