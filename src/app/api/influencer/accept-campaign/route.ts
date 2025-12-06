export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, initAdmin } from "@/server/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin on module load - wrapped in try-catch to prevent crashes
if (typeof window === 'undefined') {
  try {
    initAdmin();
  } catch (error: any) {
    // Silently fail at module load - we'll retry in the route handler
    console.warn('⚠️ [INFLUENCER API] Module load initialization failed (will retry in handler):', error?.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get user ID from auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Initialize Firebase Admin first - with retry logic and better error handling
    let auth = getAdminAuth();
    if (!auth) {
      console.log('🔄 [INFLUENCER API] Firebase Admin Auth not found, initializing...');
      try {
        // Try to initialize
        const { initAdmin } = await import('@/server/firebaseAdmin');
        const app = initAdmin();
        if (app) {
          console.log('✅ [INFLUENCER API] Firebase Admin app initialized');
          auth = getAdminAuth();
        }
      } catch (initError: any) {
        console.error('❌ [INFLUENCER API] Initialization error:', initError?.message || initError);
        // Don't fail yet, try other methods
      }
      
      if (!auth) {
        console.log('🔄 [INFLUENCER API] Trying explicit initialization...');
        try {
          // Try one more time with explicit initialization
          const { getAuth } = await import('firebase-admin/auth');
          const { getApps } = await import('firebase-admin/app');
          const apps = getApps();
          console.log(`📊 [INFLUENCER API] Found ${apps.length} Firebase Admin apps`);
          if (apps.length > 0) {
            auth = getAuth(apps[0]);
            console.log('✅ [INFLUENCER API] Got Auth from existing app');
          }
        } catch (explicitError: any) {
          console.error('❌ [INFLUENCER API] Explicit initialization error:', explicitError?.message || explicitError);
        }
      }
      
      if (!auth) {
        console.error('❌ [INFLUENCER API] Firebase Admin Auth not available after initialization attempts');
        const envCheck = {
          hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
          hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
          hasB64: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
          nodeEnv: process.env.NODE_ENV,
          vercel: !!process.env.VERCEL
        };
        console.error('❌ [INFLUENCER API] Environment check:', envCheck);
        return NextResponse.json({
          error: "Firebase Admin initialization failed",
          details: "Server configuration error. Please check Firebase Admin credentials.",
          envCheck
        }, {status:503});
      }
    }
    console.log('✅ [INFLUENCER API] Firebase Admin Auth ready');
    
    const decodedToken = await auth.verifyIdToken(token).catch((err) => {
      console.error('❌ [INFLUENCER API] Token verification failed:', err);
      return null;
    });
    if (!decodedToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }
    
    const uid = decodedToken.uid;
    console.log(`✅ [INFLUENCER API] Authenticated user: ${uid}`);

    // Verify role and KYC status (optional - don't block if not set)
    if (decodedToken.role && decodedToken.role !== "influencer") {
      return NextResponse.json({ error: "not_influencer" }, { status: 403 });
    }

    if (decodedToken.kycStatus && decodedToken.kycStatus !== "approved" && decodedToken.kycStatus !== "verified") {
      // Don't block - KYC might not be in token
      console.warn('⚠️ [INFLUENCER API] KYC status not approved in token, but continuing');
    }

    const { campaignId, projectId, message } = await req.json();

    if (!campaignId && !projectId) {
      return NextResponse.json({ error: "missing_campaign_or_project_id" }, { status: 400 });
    }

    let db = getAdminDb();
    if(!db){
      console.log('🔄 [INFLUENCER API] Firebase Admin DB not found, initializing...');
      try {
        // Try to initialize
        const { initAdmin } = await import('@/server/firebaseAdmin');
        const app = initAdmin();
        if (app) {
          console.log('✅ [INFLUENCER API] Firebase Admin app initialized for DB');
          db = getAdminDb();
        }
      } catch (initError: any) {
        console.error('❌ [INFLUENCER API] DB initialization error:', initError?.message || initError);
      }
      
      if(!db){
        console.log('🔄 [INFLUENCER API] Trying explicit DB initialization...');
        try {
          // Try one more time with explicit initialization
          const { getFirestore } = await import('firebase-admin/firestore');
          const { getApps } = await import('firebase-admin/app');
          const apps = getApps();
          if (apps.length > 0) {
            db = getFirestore(apps[0]);
            console.log('✅ [INFLUENCER API] Got Firestore from existing app');
          }
        } catch (explicitError: any) {
          console.error('❌ [INFLUENCER API] Explicit DB initialization error:', explicitError?.message || explicitError);
        }
      }
      
      if(!db){
        console.error('❌ [INFLUENCER API] Firebase Admin DB not available after initialization attempts');
        return NextResponse.json({ 
          error: "Firebase Admin credentials not configured",
          details: "Server needs Firebase Admin service account credentials. Please configure FIREBASE_SERVICE_ACCOUNT_B64 in Vercel environment variables.",
          setupGuide: "See COMPLETE_SETUP_INSTRUCTIONS.md or run: .\\scripts\\auto-setup-firebase.ps1",
          vercelUrl: "https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables"
        }, { status: 503 });
      }
    }
    
    // Validate database is actually working by checking if it's not null
    if (!db) {
      return NextResponse.json({
        error: "Firebase Admin database not available",
        details: "Database instance is null. Firebase Admin credentials may be invalid or missing.",
        setupGuide: "See COMPLETE_SETUP_INSTRUCTIONS.md for setup instructions"
      }, { status: 503 });
    }
    
    console.log('✅ [INFLUENCER API] Firebase Admin DB ready');
    const acceptanceId = `acceptance_${uid}_${campaignId || projectId}_${Date.now()}`;

    // Get influencer profile
    const influencerDoc = await db.collection("users").doc(uid).get();
    const influencerData = influencerDoc.exists ? influencerDoc.data() : null;

    // Get campaign or project data
    let campaignData: any = {};
    let founderId: string = "";

    if (campaignId) {
      const campaignDoc = await db.collection("campaigns").doc(campaignId).get();
      if (!campaignDoc.exists) {
        return NextResponse.json({ error: "campaign_not_found" }, { status: 404 });
      }
      campaignData = campaignDoc.data();
      founderId = campaignData.founderId || campaignData.createdBy;
    } else if (projectId) {
      const projectDoc = await db.collection("projects").doc(projectId).get();
      if (!projectDoc.exists) {
        return NextResponse.json({ error: "project_not_found" }, { status: 404 });
      }
      campaignData = projectDoc.data();
      founderId = campaignData.founderId;
      
      // Update project with acceptance
      try {
        const projectRef = db.collection("projects").doc(projectId);
        try {
          await projectRef.update({
            influencerAction: 'accepted',
            influencerActionBy: uid,
            influencerActionAt: Date.now(),
            updatedAt: Date.now()
          });
          console.log(`✅ [INFLUENCER API] Updated project ${projectId} with acceptance`);
        } catch (updateError: any) {
          console.error('❌ [INFLUENCER API] Error updating project:', updateError);
          // Try set with merge instead if update fails
          try {
            await projectRef.set({
              influencerAction: 'accepted',
              influencerActionBy: uid,
              influencerActionAt: Date.now(),
              updatedAt: Date.now()
            }, { merge: true });
            console.log(`✅ [INFLUENCER API] Updated project ${projectId} with set(merge)`);
          } catch (setError: any) {
            console.error('❌ [INFLUENCER API] Error setting project:', setError);
            // Don't throw - project update is not critical for campaign acceptance
          }
        }
      } catch (error: any) {
        console.error('❌ [INFLUENCER API] Error accessing project:', error);
        // Don't throw - project update is not critical
      }
    }

    // Get founder profile
    const founderDoc = await db.collection("users").doc(founderId).get();
    const founderData = founderDoc.exists ? founderDoc.data() : {};

    // Create campaign acceptance record
    await db.collection("campaignAcceptances").doc(acceptanceId).set({
      id: acceptanceId,
      campaignId: campaignId || projectId,
      projectId: projectId || null,
      influencerId: uid,
      influencerEmail: decodedToken.email,
      influencerName: influencerData?.displayName || `${influencerData?.firstName || ''} ${influencerData?.lastName || ''}`,
      founderId,
      founderEmail: founderData?.email || '',
      founderName: founderData?.displayName || founderData?.companyName || '',
      status: "active",
      acceptedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Create Chat Room in groupChats (for consistency with other roles)
    const roomId = `deal_${founderId}_${uid}_${campaignId || projectId}`;
    const chatRef = db.collection("groupChats").doc(roomId);
    const existingChat = await chatRef.get();
    
    if (!existingChat.exists) {
      const influencerName = influencerData?.displayName || `${influencerData?.firstName || ''} ${influencerData?.lastName || ''}`.trim() || 'Influencer';
      const founderName = founderData?.displayName || founderData?.companyName || "Founder";
      const projectName = campaignData.title || campaignData.name || "Campaign";
      
      // Create new room in groupChats (matching ChatRoom interface)
      await chatRef.set({
        id: roomId,
        name: `${projectName} - ${founderName} / ${influencerName}`,
        type: "deal",
        projectId: projectId || campaignId,
        
        // Members
        founderId,
        founderName,
        founderLogo: founderData?.photoURL || founderData?.logo || null,
        counterpartId: uid,
        counterpartName: influencerName,
        counterpartRole: "influencer",
        counterpartLogo: influencerData?.photoURL || influencerData?.profilePhotoURL || null,
        members: [founderId, uid, "raftai"],
        memberRoles: {
          [founderId]: "owner",
          [uid]: "member",
          "raftai": "admin"
        },
        memberNames: {
          [founderId]: founderName,
          [uid]: influencerName,
          "raftai": "RaftAI"
        },
        memberAvatars: {
          [founderId]: founderData?.photoURL || founderData?.logo || null,
          [uid]: influencerData?.photoURL || influencerData?.profilePhotoURL || null,
          "raftai": null
        },
        
        // Last message
        lastMessage: {
          senderId: "raftai",
          senderName: "RaftAI",
          text: `🎉 Deal room created! ${influencerName} has accepted the project "${projectName}".`,
          createdAt: Date.now()
        },
        
        // Room settings
        settings: {
          filesAllowed: true,
          maxFileSize: 100 * 1024 * 1024, // 100MB
          voiceNotesAllowed: true,
          videoCallAllowed: true
        },
        
        // Room data
        status: "active",
        lastActivityAt: Date.now(),
        pinnedMessages: [],
        mutedBy: [],
        unreadCount: {
          [founderId]: 0,
          [uid]: 0,
          "raftai": 0
        },
        
        // RaftAI memory
        raftaiMemory: {
          decisions: [],
          tasks: [],
          milestones: [],
          notePoints: []
        },
        
        createdAt: Date.now(),
        createdBy: uid,
        updatedAt: Date.now()
      });

      // Create welcome message from RaftAI in groupChats
      await db.collection("groupChats").doc(roomId).collection("messages").add({
        senderId: "raftai",
        senderName: "RaftAI",
        senderAvatar: null,
        type: "system",
        text: `🎉 Deal room created! ${influencerName} has accepted the project "${projectName}". You can now discuss the project details, next steps, and collaboration opportunities.\n\nI'm RaftAI, your AI assistant. I can help you with:\n• Project coordination\n• Task management\n• Document sharing\n• Meeting scheduling\n• Progress tracking\n\nFeel free to ask me anything about the project!`,
        reactions: {},
        readBy: [],
        mentions: [],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now(),
        timestamp: Date.now()
      });
      
      console.log(`✅ [INFLUENCER API] Created chat room in groupChats: ${roomId} with RaftAI welcome message`);
      
      // Create RaftAI collaboration group (similar to VC role)
      try {
        const collaborationGroupId = `collab_${projectId || campaignId}_${uid}_${Date.now()}`;
        const collaborationGroupData = {
          id: collaborationGroupId,
          name: `${projectName} - Collaboration`,
          projectId: projectId || campaignId,
          projectName: projectName,
          influencerId: uid,
          influencerName: influencerName,
          founderId: founderId,
          founderName: founderName,
          members: [
            {
              id: founderId,
              name: founderName,
              email: founderData?.email || '',
              role: 'founder_admin',
              isOnline: true,
              addedBy: 'raftai',
              addedAt: new Date(),
              permissions: {
                canChat: true,
                canShareFiles: true,
                canManageMilestones: true,
                canViewReports: true,
                canInviteMembers: false
              }
            },
            {
              id: uid,
              name: influencerName,
              email: influencerData?.email || decodedToken.email || '',
              role: 'influencer_admin',
              isOnline: true,
              addedBy: 'raftai',
              addedAt: new Date(),
              permissions: {
                canChat: true,
                canShareFiles: true,
                canManageMilestones: false,
                canViewReports: true,
                canInviteMembers: false
              }
            },
            {
              id: 'raftai',
              name: 'RaftAI Assistant',
              email: 'assistant@raftai.com',
              role: 'ai_assistant',
              isOnline: true,
              addedBy: 'raftai',
              addedAt: new Date(),
              permissions: {
                canChat: true,
                canShareFiles: false,
                canManageMilestones: true,
                canViewReports: true,
                canInviteMembers: false
              }
            }
          ],
          createdBy: 'raftai',
          createdAt: Date.now(),
          isActive: true,
          settings: {
            allowFileUpload: true,
            allowVoiceMessages: true,
            allowVoiceCalls: true,
            allowPinnedMessages: true,
            encryptionEnabled: true
          },
          milestones: [],
          raftaiReports: []
        };
        
        await db.collection("collaborationGroups").doc(collaborationGroupId).set(collaborationGroupData);
        console.log(`✅ [INFLUENCER API] Created RaftAI collaboration group: ${collaborationGroupId}`);
      } catch (collabError: any) {
        console.warn(`⚠️ [INFLUENCER API] Failed to create collaboration group (non-critical):`, collabError?.message);
        // Don't throw - collaboration group is nice to have but not critical
      }
    } else {
      console.log(`✅ [INFLUENCER API] Chat room already exists: ${roomId}`);
    }

    // Send notification to founder
    await db.collection("notifications").add({
      userId: founderId,
      type: "campaign_accepted",
      title: "Influencer Accepted Your Campaign! 🎉",
      message: `${influencerData?.displayName || "An influencer"} has accepted your campaign "${campaignData.title || "Campaign"}". You can now collaborate in the campaign room.`,
      data: {
        campaignId: campaignId || projectId,
        roomId,
        influencerId: uid,
        influencerName: influencerData?.displayName
      },
      link: `/founder/messages?room=${roomId}`,
      read: false,
      createdAt: Date.now()
    });

    // Send notification to influencer
    await db.collection("notifications").add({
      userId: uid,
      type: "campaign_room_created",
      title: "Campaign Room Created! 🚀",
      message: `Your campaign room for "${campaignData.title || "Campaign"}" is ready. Start collaborating with the founder!`,
      data: {
        campaignId: campaignId || projectId,
        roomId
      },
      link: `/influencer/messages?room=${roomId}`,
      read: false,
      createdAt: Date.now()
    });

    // Create audit log
    await db.collection("audit").add({
      type: "campaign_accepted",
      userId: uid,
      campaignId: campaignId || projectId,
      roomId,
      founderId,
      timestamp: Date.now(),
      immutable: true
    });

    console.log(`✅ Campaign accepted and room created: ${roomId}`);

    return NextResponse.json({ 
      success: true, 
      roomId,
      chatId: roomId,
      roomUrl: `/influencer/messages?room=${roomId}`,
      acceptanceId
    });
  } catch (error: any) {
    console.error('❌ [INFLUENCER API] Error in accept-campaign:', error);
    console.error('❌ [INFLUENCER API] Error stack:', error?.stack);
    console.error('❌ [INFLUENCER API] Error name:', error?.name);
    console.error('❌ [INFLUENCER API] Error code:', error?.code);
    
    // Provide more helpful error messages
    let errorMessage = 'Internal server error';
    let errorDetails = String(error?.message || error);
    
    // Check for specific Firebase credential errors FIRST (most common issue)
    if (errorDetails.includes('Could not load the default credentials') || 
        errorDetails.includes('Application Default Credentials') ||
        (errorDetails.includes('credential') && (errorDetails.includes('load') || errorDetails.includes('default')))) {
      errorMessage = 'Firebase Admin credentials not configured';
      errorDetails = 'Server needs Firebase Admin service account credentials configured in Vercel.';
      return NextResponse.json({
        error: errorMessage,
        details: errorDetails,
        solution: "Add FIREBASE_SERVICE_ACCOUNT_B64 to Vercel → Settings → Environment Variables. Run: .\\scripts\\auto-setup-firebase.ps1 for automated setup.",
        helpUrl: "https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables",
        documentation: "See COMPLETE_SETUP_INSTRUCTIONS.md in the project root for step-by-step guide.",
        type: 'CredentialsMissing'
      }, {status:503});
    } else if (errorDetails.includes('Permission denied') || errorDetails.includes('permission-denied')) {
      errorMessage = 'Permission denied';
      errorDetails = 'You do not have permission to perform this action.';
    } else if (errorDetails.includes('not found') || errorDetails.includes('does not exist')) {
      errorMessage = 'Resource not found';
    }
    
    return NextResponse.json({
      error: errorMessage,
      details: errorDetails,
      type: error?.name || 'UnknownError'
    }, {status:500});
  }
}

