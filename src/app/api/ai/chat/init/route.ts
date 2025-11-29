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
    const { roomId, projectId, founderId, vcId, projectTitle, dealType } = body;

    if (!roomId || !projectId || !founderId || !vcId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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

    // Get project details for RaftAI context
    const projectRef = db.doc(`projects/${projectId}`);
    const projectSnap = await projectRef.get();
    const project = projectSnap.exists ? projectSnap.data() : {};

    // Get user details for RaftAI context
    const vcRef = db.doc(`users/${vcId}`);
    const founderRef = db.doc(`users/${founderId}`);
    const [vcSnap, founderSnap] = await Promise.all([vcRef.get(), founderRef.get()]);
    
    const vcData = vcSnap.exists ? vcSnap.data() : {};
    const founderData = founderSnap.exists ? founderSnap.data() : {};

    // Prepare RaftAI initialization data
    const raftaiInitData = {
      roomId,
      projectId,
      projectTitle: projectTitle || project?.title || 'Unknown Project',
      dealType: dealType || 'investment',
      participants: {
        vc: {
          id: vcId,
          name: vcData?.displayName || vcData?.companyName || 'VC Partner',
          role: vcData?.role || 'vc',
          organization: vcData?.organizationName || vcData?.companyName || 'Unknown Organization'
        },
        founder: {
          id: founderId,
          name: founderData?.displayName || founderData?.companyName || 'Founder',
          role: founderData?.role || 'founder',
          company: founderData?.companyName || project?.title || 'Unknown Company'
        }
      },
      projectContext: {
        title: project?.title || projectTitle,
        stage: project?.stage || project?.fundingStage || 'unknown',
        sector: project?.sector || project?.category || 'unknown',
        fundingGoal: project?.fundingGoal || project?.raiseAmount || 0,
        description: project?.description || project?.tagline || 'No description available',
        problem: project?.problem || 'Problem not specified',
        solution: project?.solution || 'Solution not specified',
        businessModel: project?.businessModel || 'Business model not specified',
        marketSize: project?.marketSize || 'Market size not specified',
        teamSize: project?.teamSize || 0,
        timeline: project?.timeline || 'Timeline not specified',
        createdAt: project?.createdAt || new Date().toISOString()
      },
      dealContext: {
        type: dealType || 'investment',
        status: 'negotiation',
        priority: 'high',
        estimatedValue: project?.fundingGoal || project?.raiseAmount || 0,
        currency: 'USD',
        expectedClose: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString() // 90 days from now
      }
    };

    // Call RaftAI service to initialize chat context
    try {
      const raftaiResponse = await fetch(`${process.env.RAFTAI_SERVICE_URL}/chat/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RAFTAI_SERVICE_TOKEN}`,
          'X-Idempotency-Key': `chat-init-${roomId}-${Date.now()}`
        },
        body: JSON.stringify(raftaiInitData)
      });

      if (raftaiResponse.ok) {
        const raftaiResult = await raftaiResponse.json();
        
        // Update chat room with RaftAI initialization success
        await roomRef.update({
          raftaiStatus: 'active',
          raftaiContext: raftaiInitData,
          raftaiInitializedAt: new Date().toISOString(),
          lastMessage: 'RaftAI assistant activated - Ready to help with deal discussions',
          lastActivity: new Date()
        });

        // Create initial RaftAI welcome message
        const welcomeMessageRef = db.collection(`chatRooms/${roomId}/messages`).doc();
        await welcomeMessageRef.set({
          id: welcomeMessageRef.id,
          content: `🚀 Welcome to your deal room! I'm RaftAI, your AI assistant for this ${dealType || 'investment'} discussion.\n\nI can help you with:\n• Project analysis and due diligence\n• Market research and competitive analysis\n• Financial modeling and valuation\n• Deal structuring and negotiation\n• Documentation and compliance\n\nLet's make this deal successful! 💼`,
          sender: 'raftai',
          senderName: 'RaftAI Assistant',
          senderAvatar: '/ai-assistant.png',
          timestamp: new Date(),
          type: 'system',
          raftaiGenerated: true,
          metadata: {
            type: 'welcome',
            dealType: dealType || 'investment',
            projectTitle: projectTitle || project?.title
          }
        });

        return NextResponse.json({ 
          success: true, 
          message: 'RaftAI chat initialized successfully',
          roomId,
          raftaiStatus: 'active'
        });
      } else {
        console.error('RaftAI service error:', raftaiResponse.status, await raftaiResponse.text());
        
        // Update chat room with fallback status
        await roomRef.update({
          raftaiStatus: 'fallback',
          raftaiError: 'Service temporarily unavailable',
          lastMessage: 'Deal room created - RaftAI will be available soon',
          lastActivity: new Date()
        });

        return NextResponse.json({ 
          success: false, 
          message: 'RaftAI service unavailable, chat room created with fallback',
          roomId,
          raftaiStatus: 'fallback'
        });
      }
    } catch (error) {
      console.error('RaftAI initialization error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Update chat room with error status
      await roomRef.update({
        raftaiStatus: 'error',
        raftaiError: errorMessage,
        lastMessage: 'Deal room created - RaftAI initialization failed',
        lastActivity: new Date()
      });

      return NextResponse.json({ 
        success: false, 
        message: 'RaftAI initialization failed, but chat room created',
        roomId,
        raftaiStatus: 'error',
        error: errorMessage
      });
    }

  } catch (error) {
    console.error('Chat initialization error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
