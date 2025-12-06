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
    console.warn('⚠️ [AGENCY API] Module load initialization failed (will retry in handler):', error?.message);
  }
}

export async function POST(req: NextRequest){
  try{
    const { projectId } = await req.json();
    if(!projectId) return NextResponse.json({error:"Missing projectId"}, {status:400});

    const token = req.headers.get("Authorization")?.replace("Bearer ","");
    if(!token) return NextResponse.json({error:"Unauthenticated"}, {status:401});
    
    // Initialize Firebase Admin first - with retry logic and better error handling
    let auth = getAdminAuth();
    if (!auth) {
      console.log('🔄 [AGENCY API] Firebase Admin Auth not found, initializing...');
      try {
        // Try to initialize
        const { initAdmin } = await import('@/server/firebaseAdmin');
        const app = initAdmin();
        if (app) {
          console.log('✅ [AGENCY API] Firebase Admin app initialized');
          auth = getAdminAuth();
        }
      } catch (initError: any) {
        console.error('❌ [AGENCY API] Initialization error:', initError?.message || initError);
        // Don't fail yet, try other methods
      }
      
      if (!auth) {
        console.log('🔄 [AGENCY API] Trying explicit initialization...');
        try {
          // Try one more time with explicit initialization
          const { getAuth } = await import('firebase-admin/auth');
          const { getApps } = await import('firebase-admin/app');
          const apps = getApps();
          console.log(`📊 [AGENCY API] Found ${apps.length} Firebase Admin apps`);
          if (apps.length > 0) {
            auth = getAuth(apps[0]);
            console.log('✅ [AGENCY API] Got Auth from existing app');
          }
        } catch (explicitError: any) {
          console.error('❌ [AGENCY API] Explicit initialization error:', explicitError?.message || explicitError);
        }
      }
      
      if (!auth) {
        console.error('❌ [AGENCY API] Firebase Admin Auth not available after initialization attempts');
        const envCheck = {
          hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
          hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
          hasB64: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
          nodeEnv: process.env.NODE_ENV,
          vercel: !!process.env.VERCEL
        };
        console.error('❌ [AGENCY API] Environment check:', envCheck);
        return NextResponse.json({
          error: "Firebase Admin initialization failed",
          details: "Server configuration error. Please check Firebase Admin credentials.",
          envCheck
        }, {status:503});
      }
    }
    console.log('✅ [AGENCY API] Firebase Admin Auth ready');
    
    const decoded = await auth.verifyIdToken(token).catch((err) => {
      console.error('❌ [AGENCY API] Token verification failed:', err);
      return null;
    });
    if(!decoded) return NextResponse.json({error:"Invalid or expired token"}, {status:401});
    const uid = decoded.uid;
    console.log(`✅ [AGENCY API] Authenticated user: ${uid}`);

    let db = getAdminDb();
    if(!db){
      console.log('🔄 [AGENCY API] Firebase Admin DB not found, initializing...');
      try {
        // Try to initialize
        const { initAdmin } = await import('@/server/firebaseAdmin');
        const app = initAdmin();
        if (app) {
          console.log('✅ [AGENCY API] Firebase Admin app initialized for DB');
          db = getAdminDb();
        }
      } catch (initError: any) {
        console.error('❌ [AGENCY API] DB initialization error:', initError?.message || initError);
      }
      
      if(!db){
        console.log('🔄 [AGENCY API] Trying explicit DB initialization...');
        try {
          // Try one more time with explicit initialization
          const { getFirestore } = await import('firebase-admin/firestore');
          const { getApps } = await import('firebase-admin/app');
          const apps = getApps();
          if (apps.length > 0) {
            db = getFirestore(apps[0]);
            console.log('✅ [AGENCY API] Got Firestore from existing app');
          }
        } catch (explicitError: any) {
          console.error('❌ [AGENCY API] Explicit DB initialization error:', explicitError?.message || explicitError);
        }
      }
      
      if(!db){
        console.error('❌ [AGENCY API] Firebase Admin DB not available after initialization attempts');
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
    
    console.log('✅ [AGENCY API] Firebase Admin DB ready');
    
    // Get project
    let proj;
    let projRef;
    try {
      projRef = db.collection("projects").doc(projectId);
      const projSnap = await projRef.get();
      if(!projSnap.exists) {
        return NextResponse.json({error:"Project not found"}, {status:404});
      }
      proj = projSnap.data()!;
      if (!proj) {
        return NextResponse.json({error:"Project data is empty"}, {status:404});
      }
    } catch (dbError: any) {
      console.error('❌ [AGENCY API] Error fetching project:', dbError);
      const errorMsg = dbError?.message || 'Unknown error';
      
      // Check if it's a credentials error
      if (errorMsg.includes('Could not load the default credentials') || 
          errorMsg.includes('Application Default Credentials')) {
        return NextResponse.json({
          error: "Firebase Admin credentials not configured",
          details: "Server needs Firebase Admin service account credentials configured in Vercel environment variables.",
          solution: "Add FIREBASE_SERVICE_ACCOUNT_B64 to Vercel → Settings → Environment Variables. See COMPLETE_SETUP_INSTRUCTIONS.md for details.",
          helpUrl: "https://vercel.com/anas-s-projects-8d19f880/settings/environment-variables"
        }, {status:503});
      }
      
      return NextResponse.json({
        error: "Database error",
        details: `Failed to fetch project: ${errorMsg}`
      }, {status:500});
    }

    // Get names and logos
    let agencyDoc, founderDoc;
    try {
      agencyDoc = await db.collection("users").doc(uid).get();
      founderDoc = await db.collection("users").doc(proj.founderId).get();
    } catch (userError: any) {
      console.error('❌ [AGENCY API] Error fetching user data:', userError);
      return NextResponse.json({
        error: "Database error",
        details: `Failed to fetch user data: ${userError?.message || 'Unknown error'}`
      }, {status:500});
    }
    
    const agencyData = agencyDoc.exists ? agencyDoc.data() : {};
    const founderData = founderDoc.exists ? founderDoc.data() : {};
    
    const agencyName = agencyData?.displayName || agencyData?.companyName || agencyData?.organizationName || "Marketing Agency";
    const founderName = founderData?.displayName || founderData?.companyName || "Founder";
    const agencyLogo = agencyData?.photoURL || agencyData?.logo || null;
    const founderLogo = founderData?.photoURL || founderData?.logo || null;

    // Update project with acceptance
    try {
      await projRef.update({
        agencyAction: 'accepted',
        agencyActionBy: uid,
        agencyActionAt: Date.now(),
        updatedAt: Date.now()
      });
      console.log(`✅ [AGENCY API] Updated project ${projectId} with acceptance`);
    } catch (updateError: any) {
      console.error('❌ [AGENCY API] Error updating project:', updateError);
      return NextResponse.json({
        error: "Database error",
        details: `Failed to update project: ${updateError?.message || 'Unknown error'}`
      }, {status:500});
    }

    // Create relation
    try {
      const rid = `${uid}_${projectId}`;
      await db.collection("relations").doc(rid).set({
        agencyId: uid, 
        projectId, 
        founderId: proj.founderId,
        status: "accepted", 
        updatedAt: Date.now(), 
        createdAt: FieldValue.serverTimestamp()
      }, { merge:true });
    } catch (relationError: any) {
      console.error('❌ [AGENCY API] Error creating relation:', relationError);
      return NextResponse.json({
        error: "Database error",
        details: `Failed to create relation: ${relationError?.message || 'Unknown error'}`
      }, {status:500});
    }

    // Create deal room - IDEMPOTENT
    const chatId = `deal_${proj.founderId}_${uid}_${projectId}`;
    let chatRef, existingChat;
    try {
      chatRef = db.collection("groupChats").doc(chatId);
      existingChat = await chatRef.get();
    } catch (chatError: any) {
      console.error('❌ [AGENCY API] Error checking chat room:', chatError);
      return NextResponse.json({
        error: "Database error",
        details: `Failed to check chat room: ${chatError?.message || 'Unknown error'}`
      }, {status:500});
    }

    if (!existingChat.exists) {
      // Create new room - PRODUCTION READY
      try {
        await chatRef.set({
        name: `${proj.title || proj.name || "Project"} - ${founderName} / ${agencyName}`,
        type: "campaign",
        status: "active",
        
        founderId: proj.founderId,
        founderName,
        founderLogo,
        
        counterpartId: uid,
        counterpartName: agencyName,
        counterpartRole: "agency",
        counterpartLogo: agencyLogo,
        
        projectId,
        members: [proj.founderId, uid, 'raftai'],
        memberRoles: {
          [proj.founderId]: 'owner',
          [uid]: 'member',
          'raftai': 'admin'
        },
        memberNames: {
          [proj.founderId]: founderName,
          [uid]: agencyName,
          'raftai': 'RaftAI'
        },
        memberAvatars: {
          [proj.founderId]: founderLogo,
          [uid]: agencyLogo,
          'raftai': null
        },
        
        unreadCount: {
          [proj.founderId]: 0,
          [uid]: 0,
          'raftai': 0
        },
        
        lastMessage: {
          senderId: "raftai",
          senderName: "RaftAI",
          text: `🎯 RaftAI created this collaboration room for ${founderName} / ${agencyName}.`,
          createdAt: Date.now()
        },
        
        settings: {
          filesAllowed: true,
          maxFileSize: 100,
          voiceNotesAllowed: true,
          videoCallAllowed: true
        },
        
        createdAt: FieldValue.serverTimestamp(),
        createdBy: uid,
        lastActivityAt: Date.now(),
        pinnedMessages: [],
        mutedBy: [],
        
        raftaiMemory: {
          decisions: [],
          tasks: [],
          milestones: [],
          notePoints: []
        }
      });

      // System message
      await chatRef.collection("messages").add({
        senderId: "raftai",
        senderName: "RaftAI",
        type: "system",
        text: `🎯 RaftAI created this collaboration room for ${founderName} / ${agencyName}. Let's build something amazing together!`,
        reactions: {},
        readBy: [],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      });

        console.log(`✅ [AGENCY] Chat room created: ${chatId}`);
      } catch (chatCreateError: any) {
        console.error('❌ [AGENCY API] Error creating chat room:', chatCreateError);
        return NextResponse.json({
          error: "Database error",
          details: `Failed to create chat room: ${chatCreateError?.message || 'Unknown error'}`
        }, {status:500});
      }
    } else {
      console.log(`✅ [AGENCY] Reusing room: ${chatId}`);
    }

    // Create notification for founder
    try {
      const projectName = proj.title || proj.name || 'Your Project';
      await db.collection('notifications').add({
        userId: proj.founderId,
        type: 'project_accepted',
        title: 'Marketing Agency Accepted Your Pitch! 🎉',
        message: `${agencyName} (Marketing Agency) has accepted your pitch "${projectName}". You can now collaborate in the chat room.`,
        data: {
          projectId,
          projectName,
          roomId: chatId,
          acceptedBy: uid,
          acceptedByName: agencyName,
          acceptedByRole: 'agency',
          roomUrl: `/founder/messages?room=${chatId}`,
          founderLogo: founderLogo,
          partnerLogo: agencyLogo
        },
        link: `/founder/messages?room=${chatId}`,
        read: false,
        priority: 'high',
        createdAt: FieldValue.serverTimestamp(),
        soundPlayed: false
      });
      console.log(`✅ [AGENCY API] Notification created for founder: ${proj.founderId}`);
    } catch (notificationError: any) {
      console.warn(`⚠️ [AGENCY API] Failed to create notification (non-critical):`, notificationError.message);
      // Don't throw - notification creation is not critical for acceptance
    }

    return NextResponse.json({ 
      success: true,
      chatId,
      roomId: chatId,
      roomUrl: `/agency/messages?room=${chatId}`,
      isNew: !existingChat.exists
    });
    
  }catch(e:any){
    console.error('❌ [AGENCY API] Error in accept-pitch:', e);
    console.error('❌ [AGENCY API] Error stack:', e?.stack);
    console.error('❌ [AGENCY API] Error name:', e?.name);
    console.error('❌ [AGENCY API] Error code:', e?.code);
    
    // Provide more helpful error messages
    let errorMessage = 'Internal server error';
    let errorDetails = String(e?.message || e);
    
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
      type: e?.name || 'UnknownError'
    }, {status:500});
  }
}

