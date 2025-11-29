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
    console.warn('⚠️ [IDO API] Module load initialization failed (will retry in handler):', error?.message);
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
      console.log('🔄 [IDO API] Firebase Admin Auth not found, initializing...');
      try {
        // Try to initialize
        const { initAdmin } = await import('@/server/firebaseAdmin');
        const app = initAdmin();
        if (app) {
          console.log('✅ [IDO API] Firebase Admin app initialized');
          auth = getAdminAuth();
        }
      } catch (initError: any) {
        console.error('❌ [IDO API] Initialization error:', initError?.message || initError);
        // Don't fail yet, try other methods
      }
      
      if (!auth) {
        console.log('🔄 [IDO API] Trying explicit initialization...');
        try {
          // Try one more time with explicit initialization
          const { getAuth } = await import('firebase-admin/auth');
          const { getApps } = await import('firebase-admin/app');
          const apps = getApps();
          console.log(`📊 [IDO API] Found ${apps.length} Firebase Admin apps`);
          if (apps.length > 0) {
            auth = getAuth(apps[0]);
            console.log('✅ [IDO API] Got Auth from existing app');
          }
        } catch (explicitError: any) {
          console.error('❌ [IDO API] Explicit initialization error:', explicitError?.message || explicitError);
        }
      }
      
      if (!auth) {
        console.error('❌ [IDO API] Firebase Admin Auth not available after initialization attempts');
        const envCheck = {
          hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
          hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
          hasB64: !!process.env.FIREBASE_SERVICE_ACCOUNT_B64,
          nodeEnv: process.env.NODE_ENV,
          vercel: !!process.env.VERCEL
        };
        console.error('❌ [IDO API] Environment check:', envCheck);
        return NextResponse.json({
          error: "Firebase Admin initialization failed",
          details: "Server configuration error. Please check Firebase Admin credentials.",
          envCheck
        }, {status:503});
      }
    }
    console.log('✅ [IDO API] Firebase Admin Auth ready');
    
    const decoded = await auth.verifyIdToken(token).catch((err) => {
      console.error('❌ [IDO API] Token verification failed:', err);
      return null;
    });
    if(!decoded) return NextResponse.json({error:"Invalid or expired token"}, {status:401});
    const uid = decoded.uid;
    console.log(`✅ [IDO API] Authenticated user: ${uid}`);

    let db = getAdminDb();
    if(!db){
      console.log('🔄 [IDO API] Firebase Admin DB not found, initializing...');
      try {
        // Try to initialize
        const { initAdmin } = await import('@/server/firebaseAdmin');
        const app = initAdmin();
        if (app) {
          console.log('✅ [IDO API] Firebase Admin app initialized for DB');
          db = getAdminDb();
        }
      } catch (initError: any) {
        console.error('❌ [IDO API] DB initialization error:', initError?.message || initError);
      }
      
      if(!db){
        console.log('🔄 [IDO API] Trying explicit DB initialization...');
        try {
          // Try one more time with explicit initialization
          const { getFirestore } = await import('firebase-admin/firestore');
          const { getApps } = await import('firebase-admin/app');
          const apps = getApps();
          if (apps.length > 0) {
            db = getFirestore(apps[0]);
            console.log('✅ [IDO API] Got Firestore from existing app');
          }
        } catch (explicitError: any) {
          console.error('❌ [IDO API] Explicit DB initialization error:', explicitError?.message || explicitError);
        }
      }
      
      if(!db){
        console.error('❌ [IDO API] Firebase Admin DB not available after initialization attempts');
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
    
    console.log('✅ [IDO API] Firebase Admin DB ready');
    
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
      console.error('❌ [IDO API] Error fetching project:', dbError);
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
    let idoDoc, founderDoc;
    try {
      idoDoc = await db.collection("users").doc(uid).get();
      founderDoc = await db.collection("users").doc(proj.founderId).get();
    } catch (userError: any) {
      console.error('❌ [IDO API] Error fetching user data:', userError);
      return NextResponse.json({
        error: "Database error",
        details: `Failed to fetch user data: ${userError?.message || 'Unknown error'}`
      }, {status:500});
    }
    
    const idoData = idoDoc.exists ? idoDoc.data() : {};
    const founderData = founderDoc.exists ? founderDoc.data() : {};
    
    const idoName = idoData?.displayName || idoData?.companyName || idoData?.organizationName || "IDO Platform";
    const founderName = founderData?.displayName || founderData?.companyName || "Founder";
    const idoLogo = idoData?.photoURL || idoData?.logo || null;
    const founderLogo = founderData?.photoURL || founderData?.logo || null;

    // Update project with acceptance
    try {
      await projRef.update({
        idoAction: 'accepted',
        idoActionBy: uid,
        idoActionAt: Date.now(),
        updatedAt: Date.now()
      });
      console.log(`✅ [IDO API] Updated project ${projectId} with acceptance`);
    } catch (updateError: any) {
      console.error('❌ [IDO API] Error updating project:', updateError);
      return NextResponse.json({
        error: "Database error",
        details: `Failed to update project: ${updateError?.message || 'Unknown error'}`
      }, {status:500});
    }

    // Create relation
    try {
      const rid = `${uid}_${projectId}`;
      await db.collection("relations").doc(rid).set({
        idoId: uid, 
        projectId, 
        founderId: proj.founderId,
        status: "accepted", 
        updatedAt: Date.now(), 
        createdAt: FieldValue.serverTimestamp()
      }, { merge:true });
    } catch (relationError: any) {
      console.error('❌ [IDO API] Error creating relation:', relationError);
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
      console.error('❌ [IDO API] Error checking chat room:', chatError);
      return NextResponse.json({
        error: "Database error",
        details: `Failed to check chat room: ${chatError?.message || 'Unknown error'}`
      }, {status:500});
    }

    if (!existingChat.exists) {
      // Create new room - PRODUCTION READY
      try {
        await chatRef.set({
        name: `${proj.title || proj.name || "Project"} - ${founderName} / ${idoName}`,
        type: "ido",
        status: "active",
        
        founderId: proj.founderId,
        founderName,
        founderLogo,
        
        counterpartId: uid,
        counterpartName: idoName,
        counterpartRole: "ido",
        counterpartLogo: idoLogo,
        
        projectId,
        members: [proj.founderId, uid, 'raftai'],
        memberRoles: {
          [proj.founderId]: 'owner',
          [uid]: 'member',
          'raftai': 'admin'
        },
        memberNames: {
          [proj.founderId]: founderName,
          [uid]: idoName,
          'raftai': 'RaftAI'
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
        text: `🚀 RaftAI created this IDO room for ${founderName} / ${idoName}. Plan your token sale here!`,
        reactions: {},
        readBy: [],
        isPinned: false,
        isEdited: false,
        isDeleted: false,
        createdAt: Date.now()
      });

        console.log(`✅ [IDO] Chat room created: ${chatId}`);
      } catch (chatCreateError: any) {
        console.error('❌ [IDO API] Error creating chat room:', chatCreateError);
        return NextResponse.json({
          error: "Database error",
          details: `Failed to create chat room: ${chatCreateError?.message || 'Unknown error'}`
        }, {status:500});
      }
    } else {
      console.log(`✅ [IDO] Reusing room: ${chatId}`);
    }

    // Create notification for founder
    try {
      const projectName = proj.title || proj.name || 'Your Project';
      await db.collection('notifications').add({
        userId: proj.founderId,
        type: 'project_accepted',
        title: 'IDO Platform Accepted Your Pitch! 🎉',
        message: `${idoName} (IDO Platform) has accepted your pitch "${projectName}". You can now collaborate in the chat room.`,
        data: {
          projectId,
          projectName,
          roomId: chatId,
          acceptedBy: uid,
          acceptedByName: idoName,
          acceptedByRole: 'ido',
          roomUrl: `/founder/messages?room=${chatId}`,
          founderLogo: founderLogo,
          partnerLogo: idoLogo
        },
        link: `/founder/messages?room=${chatId}`,
        read: false,
        priority: 'high',
        createdAt: FieldValue.serverTimestamp(),
        soundPlayed: false
      });
      console.log(`✅ [IDO API] Notification created for founder: ${proj.founderId}`);
    } catch (notificationError: any) {
      console.warn(`⚠️ [IDO API] Failed to create notification (non-critical):`, notificationError.message);
      // Don't throw - notification creation is not critical for acceptance
    }

    return NextResponse.json({ 
      success: true,
      chatId,
      roomUrl: `/messages?room=${chatId}`,
      isNew: !existingChat.exists
    });
    
  }catch(e:any){
    console.error('❌ [IDO API] Error in accept-pitch:', e);
    console.error('❌ [IDO API] Error stack:', e?.stack);
    console.error('❌ [IDO API] Error name:', e?.name);
    console.error('❌ [IDO API] Error code:', e?.code);
    
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

